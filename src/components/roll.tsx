"use client";

import { BadgeCheck } from "lucide-react";
import { useMemo } from "react";
import { BOOK, SOURCES, addressUrl } from "@/lib/annal";
import type { BookState } from "@/lib/book";
import type { CheckState } from "@/lib/check";
import { decimalsFor, formatDate, formatTime, formatUsdc, iso, shortHex } from "@/lib/format";
import { CopyButton } from "./copy-button";
import { Line } from "./line";
import { CHAIN_COLOR, ChainMark } from "./marks";
import { Unprinted } from "./unprinted";
import { watchState, type WatchState } from "./watch";


export function Roll({
  book,
  fresh,
  readError,
  checks,
}: {
  book: BookState;
  /** Line indexes that arrived since the page loaded: they feed out of the printer. */
  fresh: ReadonlySet<number>;
  readError: string | null;
  /** Receipt checks run in the reader's browser (useReceiptChecks). */
  checks: Record<number, CheckState>;
}) {
  const newestFirst = useMemo(() => [...book.lines].sort((a, b) => b.index - a.index), [book.lines]);
  const decimals = useMemo(() => decimalsFor(book.lines.map((l) => l.amount)), [book.lines]);
  const subtotals = useMemo(
    () =>
      SOURCES.map((s) => ({
        key: s.key,
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
  const allChecked = book.lines.length > 0 && checkedCount === book.lines.length;

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
          {allChecked && (
            <div className="stamp-verified" role="status">
              <BadgeCheck aria-hidden strokeWidth={2.4} />
              <span>
                <b>
                  Verified {checkedCount}/{book.lines.length}
                </b>
                in your browser
              </span>
            </div>
          )}
          <div className="total-row">
            <span className="total-label">Total received</span>
            <span className="total-figure">
              {formatUsdc(book.total, 2)}
              <span className="total-unit">USDC</span>
            </span>
          </div>
          <ul className="subtotals" aria-label="By chain">
            {subtotals.map((s) => {
              const share = BigInt(book.total) > 0n ? Number((BigInt(s.sum) * 1000n) / BigInt(book.total)) / 10 : 0;
              return (
                <li key={s.name}>
                  <span className="sub-name">
                    <ChainMark chain={s.key} size={16} />
                    {s.name} · {s.count} {s.count === 1 ? "line" : "lines"}
                  </span>
                  <span className="amount">{formatUsdc(s.sum, decimals)}</span>
                  <span className="sub-bar" aria-hidden style={{ ["--share" as string]: `${share}%`, ["--chain" as string]: CHAIN_COLOR[s.key] }} />
                </li>
              );
            })}
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

