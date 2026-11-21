"use client";

import { ArrowUpRightIcon, LightningIcon, PrinterIcon, WalletIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { BOOK, REACTIVE, sourceByChainId, txUrl } from "@/lib/annal";
import type { BookLine } from "@/lib/book";
import { formatUsdc, lineNumber, shortHex } from "@/lib/format";
import { DotNumber } from "./dot-number";
import { CHAIN_COLOR } from "./marks";
import { EASE } from "./motion";
import { useTrail } from "./use-trail";

/** The selected line's journey, drawn to scale in seconds: payment → Reactive → book. */
export function Inspector({ owner, line, newest }: { owner: string; line: BookLine | undefined; newest: boolean }) {
  const trail = useTrail(owner, line);
  if (!line) return null;

  const source = sourceByChainId(line.originChainId);
  const t0 = line.originAt || null;
  const t1 = trail.status === "ready" ? trail.trail.reactiveAt : null;
  const t2 = (trail.status === "ready" ? trail.trail.callbackAt : null) ?? line.writtenAt;
  const span = t0 ? Math.max(1, t2 - t0) : null;
  // Clamped: a Lasna stamp can read a second before the origin block (separate clocks), and it still
  // belongs on the scale between payment and print.
  const pos = (t: number | null) => (t0 && span && t !== null ? Math.min(100, Math.max(0, ((t - t0) / span) * 100)) : null);
  const found = trail.status === "ready";

  const steps = [
    {
      icon: <WalletIcon aria-hidden weight="bold" />,
      title: `Paid on ${source?.short ?? "origin"}`,
      at: t0,
      tx: line.originTxHash as string | null,
      href: source ? txUrl(source.explorer, line.originTxHash) : undefined,
      color: source ? CHAIN_COLOR[source.key] : "var(--ink)",
    },
    {
      icon: <LightningIcon aria-hidden weight="bold" />,
      title: "Read on Lasna",
      at: t1,
      tx: found ? trail.trail.reactiveTx : null,
      href: found && trail.trail.reactiveTx ? txUrl(REACTIVE.explorer, trail.trail.reactiveTx) : undefined,
      color: "var(--ink-raised)",
    },
    {
      icon: <PrinterIcon aria-hidden weight="bold" />,
      title: "Printed on Base",
      at: t2,
      tx: found ? trail.trail.callbackTx : null,
      href: found && trail.trail.callbackTx ? txUrl(BOOK.explorer, trail.trail.callbackTx) : undefined,
      color: "var(--base)",
    },
  ];

  return (
    <section className="trail-card" aria-label={`Inspecting ${lineNumber(line.index)}`} aria-live="polite">
      <div className="inspector-top">
        <span className="inspector-pill">{newest ? "Newest line" : "Inspecting"}</span>
        <span className="inspector-hint">Pick any line</span>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={line.index}
          initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
          transition={{ duration: 0.28, ease: EASE }}
        >
          <h2>
            {lineNumber(line.index)} · {formatUsdc(line.amount)} USDC
          </h2>
          <p className="trail-card-sub">
            {span !== null ? (
              <>
                From payment to printed line in <DotNumber className="trail-card-fig" value={span} suffix=" s" />.
              </>
            ) : (
              "From payment to printed line."
            )}
          </p>
          {span !== null && (
            <div className="trail-scale" aria-hidden>
              <span className="trail-scale-fill" />
              {steps.map((s, i) => {
                const p = pos(s.at);
                return p === null ? null : (
                  <motion.span
                    key={i}
                    className="trail-scale-dot"
                    style={{ background: s.color }}
                    initial={false}
                    animate={{ left: `${p}%` }}
                    transition={{ duration: 0.5, ease: EASE }}
                  />
                );
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
                      {shortHex(s.tx, 6, 4)} <ArrowUpRightIcon aria-hidden weight="bold" />
                    </a>
                  ) : (
                    <small>{trail.status === "error" ? "not found just now" : "finding…"}</small>
                  )}
                </span>
                <span
                  className="trail-t"
                  title={
                    t0 && s.at && i > 0 && s.at <= t0
                      ? "Same second as the payment's block. Each chain keeps its own clock, so a stamp can read up to a second early."
                      : undefined
                  }
                >
                  {!t0 || !s.at ? "" : i === 0 ? "0 s" : s.at <= t0 ? "same s" : `+${s.at - t0} s`}
                </span>
              </li>
            ))}
          </ol>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
