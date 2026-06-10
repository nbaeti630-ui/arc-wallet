const API = "https://testnet.arcscan.app/api/v2";
const EXPLORER = "https://testnet.arcscan.app";

const $ = (id: string) => document.getElementById(id)!;
const short = (a: string) => a.slice(0, 6) + "..." + a.slice(-4);

// Daftar wallet treasury disimpan di browser kamu
let wallets: string[] = JSON.parse(localStorage.getItem("arc_treasury") || "[]");
const save = () => localStorage.setItem("arc_treasury", JSON.stringify(wallets));

// USDC native di Arc = 18 desimal
const toUsdc = (wei: string) => Number(BigInt(wei || "0")) / 1e18;
const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  async function getJson(url: string) {
    const res = await fetch(url);
      if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
        }

        async function loadNetworkStats() {
          try {
              const s = await getJson(`${API}/stats`);
                  $("net-tx").textContent = Number(s.total_transactions).toLocaleString("en-US");
                      $("net-gas").textContent = (s.gas_prices?.average ?? "-") + " Gwei";
                          $("net-util").textContent = Number(s.network_utilization_percentage).toFixed(1) + "%";
                            } catch {
                                $("net-tx").textContent = "-";
                                  }
                                  }

                                  async function loadWallets() {
                                    const list = $("wallet-list");
                                      const txBody = $("tx-body");
                                        list.innerHTML = "";
                                          txBody.innerHTML = "";

                                            if (wallets.length === 0) {
                                                list.innerHTML = `<div class="empty">Belum ada wallet. Tambah alamat di atas ☝️</div>`;
                                                    $("total-balance").textContent = "0.00";
                                                        $("wallet-count").textContent = "0";
                                                            txBody.innerHTML = `<tr><td colspan="4" class="empty">Belum ada transaksi</td></tr>`;
                                                                return;
                                                                  }

                                                                    let total = 0;
                                                                      const allTx: any[] = [];

                                                                        for (const addr of wallets) {
                                                                            let bal = 0;
                                                                                try {
                                                                                      const info = await getJson(`${API}/addresses/${addr}`);
                                                                                            bal = toUsdc(info.coin_balance);
                                                                                                } catch {}
                                                                                                    total += bal;

                                                                                                        const row = document.createElement("div");
                                                                                                            row.className = "wallet-row";
                                                                                                                row.innerHTML =
                                                                                                                      `<div class="w-addr"><a href="${EXPLORER}/address/${addr}" target="_blank">${short(addr)}</a></div>` +
                                                                                                                            `<div class="w-bal">${fmt(bal)} USDC</div>` +
                                                                                                                                  `<button class="w-del" data-addr="${addr}">✕</button>`;
                                                                                                                                      list.appendChild(row);

                                                                                                                                          try {
                                                                                                                                                const txs = await getJson(`${API}/addresses/${addr}/transactions`);
                                                                                                                                                      for (const t of (txs.items || []).slice(0, 8)) allTx.push({ ...t, _owner: addr });
                                                                                                                                                          } catch {}
                                                                                                                                                            }

                                                                                                                                                              $("total-balance").textContent = fmt(total);
                                                                                                                                                                $("wallet-count").textContent = String(wallets.length);

                                                                                                                                                                  list.querySelectorAll(".w-del").forEach((b) =>
                                                                                                                                                                      b.addEventListener("click", () => {
                                                                                                                                                                            const a = (b as HTMLElement).dataset.addr!;
                                                                                                                                                                                  wallets = wallets.filter((w) => w !== a);
                                                                                                                                                                                        save();
                                                                                                                                                                                              loadWallets();
                                                                                                                                                                                                  })
                                                                                                                                                                                                    );

                                                                                                                                                                                                      allTx.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                                                                                                                                                                                                        if (allTx.length === 0) {
                                                                                                                                                                                                            txBody.innerHTML = `<tr><td colspan="4" class="empty">Belum ada transaksi</td></tr>`;
                                                                                                                                                                                                                return;
                                                                                                                                                                                                                  }

                                                                                                                                                                                                                    for (const t of allTx.slice(0, 12)) {
                                                                                                                                                                                                                        const isOut = t.from?.hash?.toLowerCase() === t._owner.toLowerCase();
                                                                                                                                                                                                                            const amount = toUsdc(t.value);
                                                                                                                                                                                                                                const when = new Date(t.timestamp).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });
                                                                                                                                                                                                                                    const tr = document.createElement("tr");
                                                                                                                                                                                                                                        tr.innerHTML =
                                                                                                                                                                                                                                              `<td><span class="badge ${isOut ? "out" : "in"}">${isOut ? "↑ Keluar" : "↓ Masuk"}</span></td>` +
                                                                                                                                                                                                                                                    `<td>${fmt(amount)} USDC</td>` +
                                                                                                                                                                                                                                                          `<td class="muted">${when}</td>` +
                                                                                                                                                                                                                                                                `<td><a href="${EXPLORER}/tx/${t.hash}" target="_blank">Lihat ↗</a></td>`;
                                                                                                                                                                                                                                                                    txBody.appendChild(tr);
                                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                                      }

                                                                                                                                                                                                                                                                      $("add-btn").addEventListener("click", () => {
                                                                                                                                                                                                                                                                        const input = $("addr-input") as HTMLInputElement;
                                                                                                                                                                                                                                                                          const addr = input.value.trim();
                                                                                                                                                                                                                                                                            if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
                                                                                                                                                                                                                                                                                alert("Alamat tidak valid. Harus diawali 0x dan 42 karakter.");
                                                                                                                                                                                                                                                                                    return;
                                                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                                                        if (!wallets.includes(addr)) { wallets.push(addr); save(); }
                                                                                                                                                                                                                                                                                          input.value = "";
                                                                                                                                                                                                                                                                                            loadWallets();
                                                                                                                                                                                                                                                                                            });

                                                                                                                                                                                                                                                                                            $("refresh-btn").addEventListener("click", () => { loadNetworkStats(); loadWallets(); });

                                                                                                                                                                                                                                                                                            // Muat awal
                                                                                                                                                                                                                                                                                            loadNetworkStats();
                                                                                                                                                                                                                                                                                            loadWallets();