"use client";

import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";
import { useState } from "react";
import {
  BaseError,
  createPublicClient,
  createWalletClient,
  custom,
  getAddress,
  http,
  UserRejectedRequestError,
  type Address,
  type EIP1193Provider,
} from "viem";
import { baseSepolia } from "viem/chains";
import { annalBookAbi } from "@/lib/abi";
import { BOOK } from "@/lib/annal";
import { shortHex } from "@/lib/format";

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

type Step =
  | { s: "idle" }
  | { s: "busy"; label: string }
  | { s: "error"; title: string; body: string }
  | { s: "mismatch"; account: Address };

function explain(e: unknown): { title: string; body: string } {
  if (e instanceof BaseError) {
    if (e.walk((x) => x instanceof UserRejectedRequestError)) {
      return { title: "You declined in your wallet.", body: "Nothing was sent. Press the button again when you're ready." };
    }
    if (/insufficient funds/i.test(e.message)) {
      return {
        title: "This wallet needs a little Base Sepolia ETH.",
        body: "Opening a book is one transaction; it costs a fraction of a cent in testnet gas.",
      };
    }
    return { title: "Your wallet returned an error.", body: e.shortMessage };
  }
  return { title: "Something went wrong.", body: e instanceof Error ? e.message : "Try again in a moment." };
}

/**
 * Opens a book for the connected wallet: one `open()` transaction on Base Sepolia.
 * `forOwner` is set on a book page: then only that wallet can open this particular book.
 */
export function OpenBook({
  forOwner,
  label = "Open your own book",
  hint = true,
}: {
  forOwner?: string;
  label?: string;
  /** Show the one-line explanation under the button. */
  hint?: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>({ s: "idle" });

  async function run() {
    const eth = window.ethereum;
    if (!eth) {
      setStep({
        s: "error",
        title: "No browser wallet found.",
        body: "Install one (MetaMask, Rabby or Coinbase Wallet), or open this page in your wallet app's browser.",
      });
      return;
    }
    try {
      const wallet = createWalletClient({ chain: baseSepolia, transport: custom(eth) });
      const reader = createPublicClient({ chain: baseSepolia, transport: http(BOOK.rpc) });

      setStep({ s: "busy", label: "Connecting your wallet…" });
      const [raw] = await wallet.requestAddresses();
      const account = getAddress(raw);
      if (forOwner && account !== getAddress(forOwner)) {
        setStep({ s: "mismatch", account });
        return;
      }

      if ((await wallet.getChainId()) !== baseSepolia.id) {
        setStep({ s: "busy", label: "Switching to Base Sepolia…" });
        try {
          await wallet.switchChain({ id: baseSepolia.id });
        } catch {
          await wallet.addChain({ chain: baseSepolia });
          await wallet.switchChain({ id: baseSepolia.id });
        }
      }

      const opened = await reader.readContract({
        address: BOOK.address,
        abi: annalBookAbi,
        functionName: "openedAt",
        args: [account],
      });
      if (opened > 0n) {
        router.push(`/book/${account}`);
        return;
      }

      setStep({ s: "busy", label: "Confirm in your wallet…" });
      const hash = await wallet.writeContract({
        address: BOOK.address,
        abi: annalBookAbi,
        functionName: "open",
        account,
        chain: baseSepolia,
      });
      setStep({ s: "busy", label: "Opening your book on Base Sepolia…" });
      const receipt = await reader.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error("The transaction reverted.");
      router.push(`/book/${account}?opened=1`);
    } catch (e) {
      setStep({ s: "error", ...explain(e) });
    }
  }

  const busy = step.s === "busy";
  return (
    <div className="open-flow">
      <button type="button" className="key" onClick={run} disabled={busy} aria-busy={busy}>
        {!busy && <Wallet aria-hidden strokeWidth={2.3} />}
        {busy ? step.label : label}
      </button>
      {step.s === "idle" && hint && <p>One transaction on Base Sepolia. After that, nothing to run: payments print by themselves.</p>}
      {step.s === "error" && (
        <p className="flow-error" role="alert">
          <strong>{step.title}</strong> {step.body}
        </p>
      )}
      {step.s === "mismatch" && (
        <p className="flow-error" role="alert">
          <strong>That&rsquo;s a different wallet.</strong> You&rsquo;re connected as {shortHex(step.account)}; this book
          belongs to {shortHex(forOwner ?? "")}.{" "}
          <a href={`/book/${step.account}`}>Go to your own book</a>
        </p>
      )}
    </div>
  );
}
