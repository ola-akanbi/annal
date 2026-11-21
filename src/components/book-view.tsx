"use client";

import Link from "next/link";
import { ArrowUpRightIcon, PrinterIcon, SealCheckIcon, ShieldCheckIcon, TimerIcon, WarningIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { BOOK, DEMO_BOOK, REACTIVE, SAME_ADDRESS_NOTE, SOURCES, addressUrl } from "@/lib/annal";
import type { BookLine, BookState } from "@/lib/book";
import { formatDate, formatTime, shortHex } from "@/lib/format";
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
                <p className="band-kind">Income book{isDemo && " · live demo"}</p>
                <h1 className="band-title">
                  {shortHex(book.owner, 6, 4)}
                  <CopyButton value={book.owner} label="Copy this wallet's address" what="Wallet address copied" />
                </h1>
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

            <ShareCard path={`/book/${book.owner}`} />
          </div>
        </section>

        {/* ───────── the counter: split · printer and roll · trail ───────── */}
        <div className="counter book-counter">
          <aside className="rail rail-left" aria-label="About this book">
            <ChainSplit book={book} />
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
                <Link href={`/book/${DEMO_BOOK}`} className="key key-quiet">
                  See the demo book
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
                for Circle&rsquo;s USDC on {SOURCES.map((s) => s.short).join(", ")}. A token that merely calls itself USDC is
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
