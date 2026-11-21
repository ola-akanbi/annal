"use client";

import { ArrowsInLineVerticalIcon, ArrowsOutLineVerticalIcon, SealCheckIcon } from "@phosphor-icons/react";
import { AnimatePresence, LayoutGroup } from "motion/react";
import { useMemo, useState } from "react";
import { BOOK, SOURCES, addressUrl, type SourceKey } from "@/lib/annal";
import type { BookState } from "@/lib/book";
import type { CheckState } from "@/lib/check";
import { decimalsFor, formatDate, formatTime, formatUsdc, iso, shortHex } from "@/lib/format";
import site from "@/lib/site.json";
import { CopyButton } from "./copy-button";
import { DotNumber, usdcNumber } from "./dot-number";
import { Line } from "./line";
import { CHAIN_COLOR, ChainMark } from "./marks";
import { Unprinted } from "./unprinted";
import { watchState, type WatchState } from "./watch";

type Filter = "all" | SourceKey;

export function Roll({
  book,
  fresh,
  readError,
  checks,
  selected,
  onSelect,
}: {
  book: BookState;
  /** Line indexes that arrived since the page loaded: they feed out of the printer. */
  fresh: ReadonlySet<number>;
  readError: string | null;
  /** Receipt checks run in the reader's browser (useReceiptChecks). */
  checks: Record<number, CheckState>;
  /** The line shown in the inspector panel. */
  selected: number | undefined;
  onSelect: (index: number) => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<ReadonlySet<number>>(() => new Set());

  const newestFirst = useMemo(() => [...book.lines].sort((a, b) => b.index - a.index), [book.lines]);
  const decimals = useMemo(() => decimalsFor(book.lines.map((l) => l.amount)), [book.lines]);
  const perChain = useMemo(
    () =>
      SOURCES.map((s) => {
        const lines = book.lines.filter((l) => l.originChainId === s.chainId);
        return { s, count: lines.length, sum: lines.reduce((a, l) => a + BigInt(l.amount), 0n).toString() };
      }),
    [book.lines],
  );
  const visible = filter === "all" ? newestFirst : newestFirst.filter((l) => SOURCES.find((s) => s.key === filter)?.chainId === l.originChainId);
  const filtered = filter === "all" ? null : perChain.find((p) => p.s.key === filter)!;
  const allVisibleOpen = visible.length > 0 && visible.every((l) => open.has(l.index));
  const checkedCount = Object.values(checks).filter((c) => c.state === "checked").length;
  const watch: WatchState = watchState(book);
  const newestIndex = newestFirst[0]?.index;
  const allChecked = book.lines.length > 0 && checkedCount === book.lines.length;
  const opened = book.openedAt > 0;
  const period = useMemo(() => {
    if (book.lines.length === 0) return null;
    const ts = book.lines.map((l) => l.writtenAt);
    const [a, b] = [formatDate(Math.min(...ts)), formatDate(Math.max(...ts))];
    return a === b ? a : `${a} to ${b}`;
  }, [book.lines]);

  // Filtering keeps the inspector on a line the reader can still see.
  const applyFilter = (f: Filter) => {
    setFilter(f);
    const shown = f === "all" ? newestFirst : newestFirst.filter((l) => SOURCES.find((x) => x.key === f)?.chainId === l.originChainId);
    if (shown.length > 0 && !shown.some((l) => l.index === selected)) onSelect(shown[0].index);
  };

  const toggle = (index: number) =>
    setOpen((o) => {
      const n = new Set(o);
      if (n.has(index)) n.delete(index);
      else n.add(index);
      return n;
    });
  const setAll = (expand: boolean) =>
    setOpen((o) => {
      const n = new Set(o);
      for (const l of visible) {
        if (expand) n.add(l.index);
        else n.delete(l.index);
      }
      return n;
    });

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
            <CopyButton value={book.owner} label="Copy this wallet's address" what="Wallet address copied" />
          </div>
          <p className="roll-meta">
            {book.openedAt > 0 ? (
              <>
                Opened <time dateTime={iso(book.openedAt)}>{formatDate(book.openedAt)}</time>,{" "}
                {formatTime(book.openedAt)} · kept on {BOOK.name}
                {period && (
                  <>
                    <br />
                    Statement period: {period}
                  </>
                )}
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

        {book.lines.length > 0 && (
          <div className="register-bar">
            <div className="filters" role="group" aria-label="Show lines from">
              <button type="button" className="filter" aria-pressed={filter === "all"} onClick={() => applyFilter("all")}>
                All <span className="filter-n">({book.lines.length})</span>
              </button>
              {perChain.map(({ s, count }) => (
                <button
                  key={s.key}
                  type="button"
                  className="filter"
                  aria-pressed={filter === s.key}
                  disabled={count === 0}
                  onClick={() => applyFilter(s.key)}
                >
                  <ChainMark chain={s.key} size={14} />
                  {s.short} <span className="filter-n">({count})</span>
                </button>
              ))}
            </div>
            <button type="button" className="bulk" onClick={() => setAll(!allVisibleOpen)} aria-label={allVisibleOpen ? "Collapse all visible lines" : "Expand all visible lines"}>
              {allVisibleOpen ? <ArrowsInLineVerticalIcon aria-hidden weight="bold" /> : <ArrowsOutLineVerticalIcon aria-hidden weight="bold" />}
              {allVisibleOpen ? "Collapse all" : "Expand all"}
            </button>
          </div>
        )}

        {book.lines.length === 0 ? (
          <div className="roll-empty">
            <strong>{watch.emptyTitle}</strong>
            {watch.emptyBody}
          </div>
        ) : (
          <LayoutGroup>
            <ol className="lines" reversed aria-label="Lines, newest first">
              <AnimatePresence initial={false}>
                {visible.map((l, i) => (
                  <Line
                    key={l.index}
                    owner={book.owner}
                    line={l}
                    decimals={decimals}
                    check={checks[l.index] ?? { state: "checking" }}
                    newest={l.index === newestIndex}
                    fresh={fresh.has(l.index)}
                    open={open.has(l.index)}
                    selected={l.index === selected}
                    shade={i % 2 === 1}
                    onActivate={() => {
                      toggle(l.index);
                      onSelect(l.index);
                    }}
                  />
                ))}
              </AnimatePresence>
            </ol>
          </LayoutGroup>
        )}

        {filtered && (
          <p className="filtered-sub" role="status">
            <ChainMark chain={filtered.s.key} size={14} />
            Filtered subtotal · {filtered.s.name}: <b>{formatUsdc(filtered.sum)} USDC</b>
            <span>The total below is the whole book.</span>
          </p>
        )}

        {opened && (
        <div className="total" data-stamped={allChecked || undefined}>
          {allChecked && (
            <div className="stamp-verified" role="status">
              <SealCheckIcon aria-hidden weight="fill" />
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
              <DotNumber value={usdcNumber(book.total)} decimals={2} />
              <span className="total-unit">USDC</span>
            </span>
          </div>
          <ul className="subtotals" aria-label="By chain">
            {perChain.map(({ s, count, sum }) => {
              const share = BigInt(book.total) > 0n ? Number((BigInt(sum) * 1000n) / BigInt(book.total)) / 10 : 0;
              return (
                <li key={s.key}>
                  <span className="sub-name">
                    <ChainMark chain={s.key} size={16} />
                    {s.name} · {count} {count === 1 ? "line" : "lines"}
                  </span>
                  <span className="amount">{formatUsdc(sum, decimals)}</span>
                  <span className="sub-bar" aria-hidden style={{ ["--share" as string]: `${share}%`, ["--chain" as string]: CHAIN_COLOR[s.key] }} />
                </li>
              );
            })}
          </ul>
        </div>
        )}

        <footer className="roll-foot">
          <p>
            {book.lines.length} {book.lines.length === 1 ? "line" : "lines"} ·{" "}
            {book.lines.length === 0
              ? "nothing to check yet"
              : `${checkedCount} of ${book.lines.length} checked against the origin chain from your browser`}
          </p>
          <p>
            {site.thesis} Reactive Network does the copying, on{" "}
            {SOURCES.slice(0, -1)
              .map((x) => x.name)
              .join(", ")}{" "}
            and {SOURCES[SOURCES.length - 1].name}. Nobody can write in this book, including its owner.
          </p>
          <p className="asof">
            {readError ? (
              <>Last read failed: {readError}</>
            ) : (
              <>
                As of {BOOK.name} block {Number(book.block).toLocaleString("en-US")} ·{" "}
                <time dateTime={iso(book.readAt)}>
                  {formatDate(book.readAt)}, {formatTime(book.readAt)}
                </time>
              </>
            )}
          </p>
        </footer>

        <hr className="perf" />

        {/* With no book, every transfer would be "not printed": nothing to compare against. */}
        {opened && <Unprinted owner={book.owner} lines={book.lines} openedAt={book.openedAt} />}

        <div className="roll-end" aria-hidden="true" />
      </article>
    </section>
  );
}
