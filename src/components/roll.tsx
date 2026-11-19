"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BOOK, SOURCES, addressUrl } from "@/lib/annal";
import type { BookState } from "@/lib/book";
import { checkLine, type CheckState } from "@/lib/check";
import { decimalsFor, formatDate, formatTime, formatUsdc, iso, shortHex } from "@/lib/format";
import { CopyButton } from "./copy-button";
import { Line } from "./line";
import { Unprinted } from "./unprinted";
import { watchState, type WatchState } from "./watch";

const CHECK_CONCURRENCY = 4;

export function Roll({
  book,
  fresh,
  readError,
}: {
  book: BookState;
  /** Line indexes that arrived since the page loaded: they feed out from under the tear. */
  fresh: ReadonlySet<number>;
  readError: string | null;
}) {
  const [checks, setChecks] = useState<Record<number, CheckState>>({});
  // A line is queued once; a poll that re-runs the effect must not cancel checks already in flight.
  const queued = useRef(new Set<number>());
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // ---- receipt checks, in the browser ----
  useEffect(() => {
    const pending = book.lines.filter((l) => !queued.current.has(l.index));
    if (pending.length === 0) return;
    pending.forEach((l) => queued.current.add(l.index));
    const queue = [...pending];
    const worker = async () => {
      while (queue.length > 0) {
        const line = queue.shift()!;
        const result = await checkLine(book.owner, line);
        if (mounted.current) setChecks((c) => ({ ...c, [line.index]: result }));
      }
    };
    for (let i = 0; i < CHECK_CONCURRENCY; i++) void worker();
  }, [book.lines, book.owner]);

  const newestFirst = useMemo(() => [...book.lines].sort((a, b) => b.index - a.index), [book.lines]);
  const decimals = useMemo(() => decimalsFor(book.lines.map((l) => l.amount)), [book.lines]);
  const subtotals = useMemo(
    () =>
      SOURCES.map((s) => ({
        name: s.name,
        count: book.lines.filter((l) => l.originChainId === s.chainId).length,
        sum: book.lines
          .filter((l) => l.originChainId === s.chainId)
          .reduce((acc, l) => acc + BigInt(l.amount), 0n)
          .toString(),
      })),
    [book.lines],
  );
  const checkedCount = Object.values(checks).filter((c) => c.state === "checked").length;
  const watch: WatchState = watchState(book);
  const newestIndex = newestFirst[0]?.index;

  return (
    <section aria-label="Signature component" className="roll-wrap">
      <article className="roll" aria-labelledby="roll-title">
        <header className="roll-head">
          <h2 id="roll-title" className="roll-title">
            Income book
          </h2>
          <div className="roll-owner">
            <a href={addressUrl(BOOK.explorer, book.owner)} title={book.owner}>
              {shortHex(book.owner, 6, 4)}
            </a>
            <CopyButton value={book.owner} label="Copy this wallet's address" />
          </div>
          <p className="roll-meta">
            {book.openedAt > 0 ? (
              <>
                Opened <time dateTime={iso(book.openedAt)}>{formatDate(book.openedAt)}</time>,{" "}
                {formatTime(book.openedAt)} · kept on {BOOK.name}
              </>
            ) : (
              <>No book has been opened for this wallet.</>
            )}
          </p>
        </header>

        <hr className="perf" />

        <div className="feed" data-state={watch.dot} aria-live="polite">
          {watch.feed}
        </div>

        {book.lines.length === 0 ? (
          <div className="roll-empty">
            <strong>{watch.emptyTitle}</strong>
            {watch.emptyBody}
          </div>
        ) : (
          <ol className="lines" reversed aria-label="Lines, newest first">
            {newestFirst.map((l) => (
              <Line
                key={l.index}
                owner={book.owner}
                line={l}
                decimals={decimals}
                check={checks[l.index] ?? { state: "checking" }}
                newest={l.index === newestIndex}
                fresh={fresh.has(l.index)}
              />
            ))}
          </ol>
        )}

        <div className="total">
          <div className="total-row">
            <span className="total-label">Total received</span>
            <span className="total-figure">
              {formatUsdc(book.total, 2)}
              <span className="total-unit">USDC</span>
            </span>
          </div>
          <ul className="subtotals" aria-label="By chain">
            {subtotals.map((s) => (
              <li key={s.name}>
                <span>
                  {s.name} · {s.count} {s.count === 1 ? "line" : "lines"}
                </span>
                <span className="amount">{formatUsdc(s.sum, decimals)}</span>
              </li>
            ))}
          </ul>
        </div>

        <footer className="roll-foot">
          <p>
            {book.lines.length} {book.lines.length === 1 ? "line" : "lines"} ·{" "}
            {book.lines.length === 0
              ? "nothing to check yet"
              : `${checkedCount} of ${book.lines.length} checked against the origin chain from your browser`}
          </p>
          <p>Nobody can write in this book, including its owner. Every line was copied by Reactive Network from the payment&rsquo;s own log.</p>
          <p className="asof">
            {readError ? (
              <>Last read failed: {readError}</>
            ) : (
              <>
                As of {BOOK.name} block {Number(book.block).toLocaleString("en-US")} ·{" "}
                <time dateTime={iso(book.readAt)}>{formatTime(book.readAt)}</time>
              </>
            )}
          </p>
        </footer>

        <hr className="perf" />

        <Unprinted owner={book.owner} lines={book.lines} openedAt={book.openedAt} />

        <div className="roll-end" aria-hidden="true" />
      </article>
    </section>
  );
}

