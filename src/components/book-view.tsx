"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BOOK, REACTIVE, SOURCES, addressUrl } from "@/lib/annal";
import type { BookState } from "@/lib/book";
import { shortHex } from "@/lib/format";
import site from "@/lib/site.json";
import { OpenBook } from "./open-book";
import { Roll } from "./roll";
import { useLiveBook } from "./use-live-book";
import { watchState } from "./watch";

function lreact(wei: string | null): string {
  if (wei === null) return "unknown";
  const v = BigInt(wei);
  const whole = v / 10n ** 18n;
  const frac = ((v % 10n ** 18n) / 10n ** 16n).toString().padStart(2, "0");
  return `${whole}.${frac} lREACT`;
}

export function BookView({ initial, demo, fast }: { initial: BookState; demo: boolean; fast: boolean }) {
  const { book, fresh, readError } = useLiveBook(initial, fast);
  const watch = watchState(book);
  const debt = book.reactive.debt === null ? null : BigInt(book.reactive.debt);

  return (
    <main className="counter">
      <aside className="rail rail-left" aria-label="About this book">
        <Link href="/" className="wordmark">
          Annal
        </Link>
        <h1 className="thesis">{site.thesis}</h1>
        <p className="lede">{site.lede}</p>

        <div className="watch">
          <div className="watch-status" aria-live="polite">
            <span className="live-dot" data-state={watch.dot} aria-hidden />
            {watch.status}
          </div>
          <ul className="watch-chains" aria-label="Chains this book watches">
            {SOURCES.map((s) => {
              const n = book.lines.filter((l) => l.originChainId === s.chainId).length;
              return (
                <li key={s.key}>
                  <span>{s.name}</span>
                  <span>
                    {n} {n === 1 ? "line" : "lines"}
                  </span>
                </li>
              );
            })}
          </ul>
          {watch.note && <p className="watch-note">{watch.note}</p>}
        </div>

        {demo ? (
          <OpenBook />
        ) : watch.kind === "unopened" ? (
          <OpenBook forOwner={book.owner} label="Open this book" />
        ) : (
          <div className="open-flow">
            <Link href="/" className="key key-quiet">
              See the demo book
            </Link>
          </div>
        )}
      </aside>

      <Roll book={book} fresh={fresh} readError={readError} />

      <aside className="rail rail-right notes" aria-label="How to trust it">
        <section>
          <h2>Why you can trust it</h2>
          <p>
            Nobody types in this book, including its owner. Lines arrive only from one Reactive Network contract, and only
            for Circle&rsquo;s USDC on {SOURCES.map((s) => s.short).join(", ")}. A token that merely calls itself USDC is
            never printed.
          </p>
        </section>
        <section>
          <h2>Check any line</h2>
          <p>
            Open a line to see the payment, the Reactive transaction that read it and the callback that wrote it. Your
            browser fetches each payment&rsquo;s receipt from its own chain and ticks the line only if every field matches.
          </p>
        </section>
        <section>
          <h2>The machine</h2>
          <dl className="machine">
            <div>
              <dt>AnnalReactive · {REACTIVE.name}</dt>
              <dd>
                <a href={addressUrl(REACTIVE.explorer, REACTIVE.address)} target="_blank" rel="noreferrer">
                  {shortHex(REACTIVE.address, 6, 4)}
                  <ArrowUpRight aria-hidden strokeWidth={2} />
                </a>
                <br />
                {debt === null
                  ? "Health unknown right now."
                  : debt > 0n
                    ? `Owes fees: paused until topped up.`
                    : `Funded with ${lreact(book.reactive.balance)}, owes nothing.`}
              </dd>
            </div>
            <div>
              <dt>AnnalBook · {BOOK.name}</dt>
              <dd>
                <a href={addressUrl(BOOK.explorer, BOOK.address)} target="_blank" rel="noreferrer">
                  {shortHex(BOOK.address, 6, 4)}
                  <ArrowUpRight aria-hidden strokeWidth={2} />
                </a>
                <br />
                No owner, no admin. Writes only through Reactive&rsquo;s callback proxy.
              </dd>
            </div>
          </dl>
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
    </main>
  );
}
