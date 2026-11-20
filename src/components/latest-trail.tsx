"use client";

import { ArrowUpRight, Printer, Wallet, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { BOOK, REACTIVE, sourceByChainId, txUrl } from "@/lib/annal";
import type { BookLine, LineTrail } from "@/lib/book";
import { formatUsdc, lineNumber, shortHex } from "@/lib/format";
import { CHAIN_COLOR } from "./marks";

/** The newest line's journey, drawn to scale in seconds: payment → Reactive → book. */
export function LatestTrail({ owner, line }: { owner: string; line: BookLine | undefined }) {
  const [trail, setTrail] = useState<LineTrail | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!line) return;
    let cancelled = false;
    const q = new URLSearchParams({
      owner,
      index: String(line.index),
      chain: String(line.originChainId),
      tx: line.originTxHash,
      log: String(line.logIndex),
      at: String(line.writtenAt),
    });
    fetch(`/api/trail?${q}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((t: LineTrail) => !cancelled && setTrail(t))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [owner, line]);

  if (!line) return null;
  const source = sourceByChainId(line.originChainId);
  const t0 = line.originAt || null;
  const t1 = trail?.reactiveAt ?? null;
  const t2 = trail?.callbackAt ?? line.writtenAt;
  const span = t0 ? Math.max(1, t2 - t0) : null;
  const pos = (t: number | null) => (t0 && span && t ? Math.min(100, Math.max(0, ((t - t0) / span) * 100)) : null);

  const steps = [
    {
      icon: <Wallet aria-hidden strokeWidth={2.3} />,
      title: `Paid on ${source?.short ?? "origin"}`,
      at: t0,
      tx: line.originTxHash,
      href: source ? txUrl(source.explorer, line.originTxHash) : undefined,
      color: source ? CHAIN_COLOR[source.key] : "var(--ink)",
    },
    {
      icon: <Zap aria-hidden strokeWidth={2.3} />,
      title: "Read on Lasna",
      at: t1,
      tx: trail?.reactiveTx ?? null,
      href: trail?.reactiveTx ? txUrl(REACTIVE.explorer, trail.reactiveTx) : undefined,
      color: "var(--ink)",
    },
    {
      icon: <Printer aria-hidden strokeWidth={2.3} />,
      title: "Printed on Base",
      at: t2,
      tx: trail?.callbackTx ?? null,
      href: trail?.callbackTx ? txUrl(BOOK.explorer, trail.callbackTx) : undefined,
      color: "var(--base)",
    },
  ];

  return (
    <section className="trail-card" aria-label="The newest line's journey">
      <h2>
        {lineNumber(line.index)} · {formatUsdc(line.amount)} USDC
      </h2>
      <p className="trail-card-sub">
        {span !== null ? (
          <>
            From payment to printed line in <b>{span} s</b>.
          </>
        ) : (
          "From payment to printed line."
        )}
      </p>
      {span !== null && (
        <div className="trail-scale" aria-hidden>
          <span className="trail-scale-fill" style={{ inlineSize: "100%" }} />
          {steps.map((s, i) => {
            const p = pos(s.at);
            return p === null ? null : <span key={i} className="trail-scale-dot" style={{ insetInlineStart: `${p}%`, background: s.color }} />;
          })}
        </div>
      )}
      <ol className="trail-steps">
        {steps.map((s, i) => (
          <li key={i}>
            <span className="trail-icon" style={{ background: s.color }}>
              {s.icon}
            </span>
            <span className="trail-text">
              <b>{s.title}</b>
              {s.tx && s.href ? (
                <a href={s.href} target="_blank" rel="noreferrer">
                  {shortHex(s.tx, 6, 4)} <ArrowUpRight aria-hidden />
                </a>
              ) : (
                <small>{failed ? "not found just now" : "finding…"}</small>
              )}
            </span>
            <span className="trail-t">{t0 && s.at ? `+${s.at - t0} s` : ""}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
