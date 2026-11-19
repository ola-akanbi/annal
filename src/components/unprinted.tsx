"use client";

import { useEffect, useState } from "react";
import { txUrl } from "@/lib/annal";
import type { BookLine } from "@/lib/book";
import { findUnprinted, formatUnitsPlain, type Unprinted as Item } from "@/lib/explorers";
import { formatTime, shortHex } from "@/lib/format";

const REASON: Record<Item["kind"], (i: Item) => string> = {
  "not-usdc": (i) => `Not printed · ${shortHex(i.token)} calls itself ${i.symbol}, but it isn't Circle's USDC`,
  before: () => "Not printed · arrived before this book was opened",
  printing: () => "Printing · seen seconds ago, the line should land shortly",
  missing: () => "Missing · real USDC the book didn't print; the watcher may have been paused",
};

type Load = { status: "loading" } | { status: "ready"; items: Item[]; failed: string[] };

/** Compares the explorers' view of this wallet with the book, in the reader's browser. */
export function Unprinted({ owner, lines, openedAt }: { owner: string; lines: BookLine[]; openedAt: number }) {
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const printedKey = lines.map((l) => `${l.originTxHash}:${l.logIndex}`).join(",");

  useEffect(() => {
    let cancelled = false;
    findUnprinted(owner, lines, openedAt, Math.floor(Date.now() / 1000)).then((r) => {
      if (!cancelled) setLoad({ status: "ready", items: r.items, failed: r.failed });
    });
    return () => {
      cancelled = true;
    };
    // re-run when the set of printed lines changes, not on every poll
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner, openedAt, printedKey]);

  return (
    <section className="unprinted" aria-labelledby="unprinted-title">
      <h2 id="unprinted-title">Seen by explorers, not printed</h2>
      <p>Token transfers block explorers list for this wallet that the book left out, and why.</p>
      {load.status === "loading" ? (
        <p>Asking the explorers for Ethereum, Base and Unichain Sepolia…</p>
      ) : load.items.length === 0 ? (
        <p>
          Nothing left out: every token transfer the explorers show for this wallet is a printed line.
          {load.failed.length > 0 && <> (Couldn&rsquo;t reach {load.failed.join(", ")}.)</>}
        </p>
      ) : (
        <>
          <ul>
            {load.items.map((i) => (
              <li key={i.key}>
                <span>
                  <s>
                    {formatUnitsPlain(i.value, i.decimals)} &ldquo;{i.symbol}&rdquo;
                  </s>{" "}
                  · {i.chainName} · from {shortHex(i.from)} ·{" "}
                  <a href={txUrl(i.explorer, i.txHash)} target="_blank" rel="noreferrer">
                    {formatTime(i.timestamp)}
                  </a>
                </span>
                <span className="why" data-kind={i.kind}>
                  {REASON[i.kind](i)}
                </span>
              </li>
            ))}
          </ul>
          {load.failed.length > 0 && <p>Couldn&rsquo;t reach {load.failed.join(", ")} just now.</p>}
        </>
      )}
    </section>
  );
}
