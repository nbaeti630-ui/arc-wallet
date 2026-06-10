import { AppKit } from "@circle-fin/app-kit";
import type { SendParams } from "@circle-fin/app-kit";
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";
import type { EIP1193Provider } from "viem";

declare global {
  interface Window { ethereum?: EIP1193Provider }
  }

  const kit = new AppKit();
  const $ = (id: string) => document.getElementById(id)!;
  const log = (m: string) => { $("log").textContent = m; };
  const short = (a: string) => a.slice(0, 6) + "..." + a.slice(-4);

  let adapter: Awaited<ReturnType<typeof createViemAdapterFromProvider>> | null = null;

  $("connect").addEventListener("click", async () => {
    if (!window.ethereum) { log("MetaMask tidak ditemukan 😕"); return; }
      const accounts = (await window.ethereum.request({
          method: "eth_requestAccounts",
              params: undefined,
                })) as string[];
                  adapter = await createViemAdapterFromProvider({ provider: window.ethereum });
                    $("address").textContent = "🟢 " + short(accounts[0]);
                      await refreshBalance();
                      });

                      async function refreshBalance() {
                        if (!adapter) return;
                          $("balance").textContent = "Memuat...";
                            const balances = await kit.unifiedBalance.getBalances({
                                sources: [{ adapter }],
                                    networkType: "testnet",
                                        includePending: true,
                                          });
                                            $("balance").textContent = (balances as any).totalConfirmedBalance + " USDC";
                                            }

                                            $("send").addEventListener("click", async () => {
                                              if (!adapter) { log("Connect wallet dulu ya 🔌"); return; }
                                                const to = ($("to") as HTMLInputElement).value;
                                                  const amount = ($("amount") as HTMLInputElement).value;
                                                    if (!to || !amount) { log("Isi alamat & jumlah dulu"); return; }
                                                      const params: SendParams = {
                                                          from: { adapter, chain: "Arc_Testnet" },
                                                              to,
                                                                  amount,
                                                                      token: "USDC",
                                                                        };
                                                                          log("⏳ Mengirim " + amount + " USDC...");
                                                                            try {
                                                                                const result = await kit.send(params) as any;
                                                                                    log("✅ Sukses! " + (result.explorerUrl ?? result.txHash));
                                                                                        await refreshBalance();
                                                                                          } catch (e) {
                                                                                              log("❌ Gagal: " + (e as Error).message);
                                                                                                }
                                                                                                });