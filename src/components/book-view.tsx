"use client";

import Link from "next/link";
import { ArrowUpRightIcon, PrinterIcon, SealCheckIcon, ShieldCheckIcon, TimerIcon, WarningIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { BOOK, DEMO_BOOK, REACTIVE, SAME_ADDRESS_NOTE, SOURCES, addressUrl } from "@/lib/annal";
import type { BookLine, BookState } from "@/lib/book";
import { formatDate, formatTime, formatUsdc, shortHex } from "@/lib/format";
import { ChainSplit } from "./chain-split";
import { CopyButton } from "./copy-button";
import { Identicon } from "./identicon";
import { DotNumber, usdcNumber } from "./dot-number";
import { Inspector } from "./inspector";
import { OpenBook } from "./open-book";
import { PrinterHead } from "./printer";
import { Roll } from "./roll";
import { ShareCard } from "./share-card";
import { SiteNav } from "./site-nav";
import { useLiveBook } from "./use-live-book";
import { useReceiptChecks } from "./use-receipt-checks";
import { watchState } from "./watch";

function lreact(wei: string | null): string {
  if (wei === null) return "unknown";
  const v = BigInt(wei);
  const whole = v / 10n ** 18n;
  const frac = ((v % 10n ** 18n) / 10n ** 16n).toString().padStart(2, "0");
  return `${whole}.${frac} lREACT`;
}

const names = (xs: readonly { name: string }[], joiner: string) =>
  xs.length <= 1 ? (xs[0]?.name ?? "") : `${xs.slice(0, -1).map((x) => x.name).join(", ")} ${joiner} ${xs[xs.length - 1].name}`;

const CHAIN_LIST_OR = names(SOURCES, "or");

/** One plain sentence for a reader with no wallet: how much, from where, over what dates, and that it's testnet. */
function bookSummary(book: BookState, isDemo: boolean): string {
  const testnet = "Testnet: these are test USDC with no cash value.";
  if (book.openedAt === 0) return "No book has been opened for this wallet, so nothing is recorded here.";
  if (book.lines.length === 0) return `Nothing received yet. ${testnet}`;
  const used = SOURCES.filter((s) => book.lines.some((l) => l.originChainId === s.chainId));
  const first = Math.min(...book.lines.map((l) => l.writtenAt));
  const last = Math.max(...book.lines.map((l) => l.writtenAt));
  const when = formatDate(first) === formatDate(last) ? `on ${formatDate(first)}` : `between ${formatDate(first)} and ${formatDate(last)}`;
  const count = `${book.lines.length} ${book.lines.length === 1 ? "payment" : "payments"}`;
  return `${isDemo ? "The live demo book. " : ""}${formatUsdc(book.total)} USDC received in ${count} on ${names(used, "and")}, ${when}. ${testnet}`;
}

const delayOf = (l: BookLine) => (l.originAt > 0 ? Math.max(0, l.writtenAt - l.originAt) : null);

function medianDelay(lines: BookLine[]): number | null {
  const xs = lines.map(delayOf).filter((d): d is number => d !== null).sort((a, b) => a - b);
  if (xs.length === 0) return null;
  const m = Math.floor(xs.length / 2);
  return xs.length % 2 ? xs[m] : Math.round((xs[m - 1] + xs[m]) / 2);
}

export function BookView({ initial, demo, fast }: { initial: BookState; demo: boolean; fast: boolean }) {
  const { book, fresh, readError } = useLiveBook(initial, fast);
  const checks = useReceiptChecks(book);
  const watch = watchState(book);
  const debt = book.reactive.debt === null ? null : BigInt(book.reactive.debt);
  const isDemo = demo || book.owner.toLowerCase() === DEMO_BOOK.toLowerCase();
  const newest = book.lines.reduce<BookLine | undefined>((a, l) => (!a || l.index > a.index ? l : a), undefined);
  const verified = Object.values(checks).filter((c) => c.state === "checked").length;
  const mismatches = Object.values(checks).filter((c) => c.state === "mismatch").length;
  const med = medianDelay(book.lines);
  const opened = book.openedAt > 0;
  const summary = bookSummary(book, isDemo);
  const [picked, setPicked] = useState<number | undefined>(undefined);
  const selected = picked !== undefined && book.lines.some((l) => l.index === picked) ? picked : newest?.index;
  const selectedLine = book.lines.find((l) => l.index === selected);

  return (
    <>
      <SiteNav />
      <main className="book-page">
        {/* ───────── the band: who, how much, and how to hand it over ───────── */}
        <section className="book-band" aria-label="This book">
          <div className="band-inner">
            <div className="band-id">
              <Identicon address={book.owner} size={76} />
              <div>
                <h1 className="band-title">
                  <span className="sr-only">Income book of </span>
                  {shortHex(book.owner, 6, 4)}
                  <CopyButton value={book.owner} label="Copy this wallet's address" what="Wallet address copied" />
                </h1>
                <p className="band-summary">{summary}</p>
                <p className="band-status" aria-live="polite">
                  <span className="live-dot" data-state={watch.dot} aria-hidden />
                  {watch.status}
                  {book.watchingSince > 0 && (
                    <span className="band-since">
                      since {formatDate(book.watchingSince)}, {formatTime(book.watchingSince)}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {opened && (
            <dl className="band-stats">
              <div className="bstat bstat-total">
                <dt>Total received</dt>
                <dd>
                  <DotNumber className="dotnum" value={usdcNumber(book.total)} decimals={2} />
                  <small>USDC</small>
                </dd>
              </div>
              <div className="bstat">
                <dt>
                  <PrinterIcon aria-hidden weight="bold" /> Lines
                </dt>
                <dd>
                  <DotNumber className="dotnum" value={book.lines.length} />
                </dd>
              </div>
              <div className="bstat">
                <dt>
                  {mismatches > 0 ? <WarningIcon aria-hidden weight="bold" /> : <SealCheckIcon aria-hidden weight="bold" />}{" "}
                  Verified here
                </dt>
                <dd>
                  <DotNumber className="dotnum" value={verified} />
                  <small>/ {book.lines.length}</small>
                </dd>
              </div>
              <div className="bstat">
                <dt>
                  <TimerIcon aria-hidden weight="bold" /> Median print
                </dt>
                <dd>
                  {med === null ? <span className="dotnum">–</span> : <DotNumber className="dotnum" value={med} />}
                  {med !== null && <small>s</small>}
                </dd>
              </div>
            </dl>
            )}

            {opened && <ShareCard path={`/book/${book.owner}`} />}
          </div>
        </section>

        {/* ───────── the counter: split · printer and roll · trail ───────── */}
        <div className="counter book-counter">
          <aside className="rail rail-left" aria-label="About this book">
            {opened && <ChainSplit book={book} />}
            {watch.note && <p className="watch-note">{watch.note}</p>}
            {isDemo ? (
              <div className="rail-cta">
                <h2>Want one like this?</h2>
                <OpenBook label="Open your own book" />
              </div>
            ) : watch.kind === "unopened" ? (
              <div className="rail-cta">
                <h2>Is this your wallet?</h2>
                <OpenBook forOwner={book.owner} label="Open this book" />
              </div>
            ) : (
              <div className="rail-cta">
                <h2>How a line gets here</h2>
                <p className="rail-cta-body">
                  Any Circle USDC payment to this wallet on {CHAIN_LIST_OR} prints here on its own, seconds after its
                  block. Nobody types it in.
                </p>
                <p className="rail-cta-addr">
                  <code title={book.owner}>{shortHex(book.owner, 8, 6)}</code>
                  <CopyButton value={book.owner} label="Copy this wallet's address" what="Wallet address copied" />
                </p>
                <Link href={`/book/${DEMO_BOOK}`} className="rail-cta-link">
                  See a book with lines on every chain
                  <ArrowUpRightIcon aria-hidden weight="bold" />
                </Link>
              </div>
            )}
          </aside>

          <div className="press">
            <PrinterHead watch={watch} block={book.block} />
            <Roll book={book} fresh={fresh} readError={readError} checks={checks} selected={selected} onSelect={setPicked} />
          </div>

          <aside className="rail rail-right notes" aria-label="How to trust it">
            <Inspector owner={book.owner} line={selectedLine} newest={selectedLine?.index === newest?.index} />
            <section>
              <h2>
                <ShieldCheckIcon aria-hidden weight="bold" /> Why you can trust it
              </h2>
              <p>
                Nobody types in this book, including its owner. Lines arrive only from one Reactive Network contract, and only
                for Circle&rsquo;s USDC on {names(SOURCES, "and")}. A token that merely calls itself USDC is
                never printed.
              </p>
            </section>
            <section>
              <h2>The machine</h2>
              <dl className="machine">
                <div>
                  <dt>AnnalReactive · {REACTIVE.name}</dt>
                  <dd>
                    <a href={addressUrl(REACTIVE.explorer, REACTIVE.address)} target="_blank" rel="noreferrer" title={SAME_ADDRESS_NOTE}>
                      {shortHex(REACTIVE.address, 6, 4)}
                      <ArrowUpRightIcon aria-hidden weight="bold" />
                    </a>{" "}
                    ·{" "}
                    <a href={REACTIVE.source} target="_blank" rel="noreferrer">
                      verified source
                      <ArrowUpRightIcon aria-hidden weight="bold" />
                    </a>
                    <br />
                    {debt === null
                      ? "Health unknown right now."
                      : debt > 0n
                        ? "Owes fees: paused until topped up."
                        : `Funded with ${lreact(book.reactive.balance)}, owes nothing.`}
                  </dd>
                </div>
                <div>
                  <dt>AnnalBook · {BOOK.name}</dt>
                  <dd>
                    <a href={addressUrl(BOOK.explorer, BOOK.address)} target="_blank" rel="noreferrer" title={SAME_ADDRESS_NOTE}>
                      {shortHex(BOOK.address, 6, 4)}
                      <ArrowUpRightIcon aria-hidden weight="bold" />
                    </a>{" "}
                    ·{" "}
                    <a href={BOOK.source} target="_blank" rel="noreferrer">
                      verified source
                      <ArrowUpRightIcon aria-hidden weight="bold" />
                    </a>
                    <br />
                    No owner, no admin. Writes only through Reactive&rsquo;s callback proxy.
                  </dd>
                </div>
              </dl>
              <p className="same-address">{SAME_ADDRESS_NOTE}</p>
            </section>
            <section>
              <h2>Limits</h2>
              <ul>
                <li>Testnet only.</li>
                <li>USDC only. Plain ETH transfers leave no log to copy.</li>
                <li>If the watcher runs out of funds, payments made meanwhile aren&rsquo;t printed. The status says so.</li>
              </ul>
            </section>
          </aside>
        </div>
      </main>
    </>
  );
}
