"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AirplaneTiltIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  BookOpenIcon,
  BroadcastIcon,
  CalculatorIcon,
  CheckIcon,
  HouseIcon,
  InfoIcon,
  LightningIcon,
  PrinterIcon,
  ProhibitIcon,
  ShieldCheckIcon,
  TimerIcon,
  WalletIcon,
} from "@phosphor-icons/react";
import { BOOK, DEMO_BOOK, REACTIVE, SAME_ADDRESS_NOTE, SOURCES, addressUrl, sourceByChainId, txUrl } from "@/lib/annal";
import type { BookLine, BookState } from "@/lib/book";
import { findUnprinted, formatUnitsPlain, type Unprinted } from "@/lib/explorers";
import { formatTime, formatUsdc, lineNumber, shortHex } from "@/lib/format";
import site from "@/lib/site.json";
import { CopyButton } from "./copy-button";
import { DotNumber, usdcNumber } from "./dot-number";
import { AnnalMark, CHAIN_COLOR, ChainMark } from "./marks";
import { OpenBook } from "./open-book";
import { useLiveBook } from "./use-live-book";
import { useTrail } from "./use-trail";
import { watchState } from "./watch";

const delayOf = (l: BookLine) => (l.originAt > 0 ? Math.max(0, l.writtenAt - l.originAt) : null);

function median(xs: number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

function ago(seconds: number): string {
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}\u00a0s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}\u00a0min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}\u00a0h ago`;
  return `${Math.floor(seconds / 86400)}\u00a0d ago`;
}

/** Hides only blocks below the fold at load, then reveals each as it enters view. */
function Reveals() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const els = [...document.querySelectorAll<HTMLElement>(".reveal")];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          const delay = Number(el.dataset.revealIndex ?? 0) * 90;
          setTimeout(() => (el.dataset.reveal = "in"), delay);
          io.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    let n = 0;
    for (const el of els) {
      if (el.getBoundingClientRect().top < window.innerHeight) continue; // already visible: leave it
      el.dataset.reveal = "pending";
      el.dataset.revealIndex = String(n++ % 3);
      io.observe(el);
    }
    return () => io.disconnect();
  }, []);
  return null;
}

function Stat({ value, decimals = 0, unit, label, icon }: { value: number; decimals?: number; unit?: string; label: string; icon: React.ReactNode }) {
  return (
    <div className="stat reveal">
      <span className="stat-icon">{icon}</span>
      <span className="stat-value">
        <DotNumber value={value} decimals={decimals} />
        {unit && <small>{unit}</small>}
      </span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function FlowDiagram() {
  // Three chain lanes merge into Reactive (Lasna), which writes into the book (Base Sepolia).
  const lanes = [
    { key: "ethereum" as const, y: 70, d: "M150 70 C 330 70, 360 210, 520 210" },
    { key: "base" as const, y: 210, d: "M150 210 C 330 210, 360 210, 520 210" },
    { key: "unichain" as const, y: 350, d: "M150 350 C 330 350, 360 210, 520 210" },
  ];
  const out = "M640 210 C 720 210, 760 210, 850 210";
  return (
    <svg className="flow" viewBox="0 0 1060 420" role="img" aria-label="Payments on Ethereum, Base and Unichain Sepolia flow into Reactive Network on Lasna, which writes each one into the book on Base Sepolia.">
      {lanes.map((l) => (
        <g key={l.key}>
          <path d={l.d} className="flow-path" style={{ stroke: CHAIN_COLOR[l.key] }} />
          <circle r="7" className="flow-dot" style={{ fill: CHAIN_COLOR[l.key] }}>
            <animateMotion dur={l.key === "ethereum" ? "3.6s" : l.key === "base" ? "2.6s" : "3.1s"} repeatCount="indefinite" path={l.d} />
          </circle>
          <foreignObject x="0" y={l.y - 26} width="150" height="52">
            <div className="flow-chain">
              <ChainMark chain={l.key} size={26} />
              <span>{SOURCES.find((s) => s.key === l.key)!.short}</span>
            </div>
          </foreignObject>
        </g>
      ))}
      <path d={out} className="flow-path flow-out" />
      <circle r="8" className="flow-dot flow-dot-out">
        <animateMotion dur="1.4s" repeatCount="indefinite" path={out} />
      </circle>
      <g className="flow-node">
        <rect x="520" y="150" width="120" height="120" rx="28" />
        <foreignObject x="520" y="150" width="120" height="120">
          <div className="flow-node-inner">
            <LightningIcon aria-hidden weight="bold" />
            <b>Reactive</b>
            <span>Lasna</span>
          </div>
        </foreignObject>
      </g>
      <g className="flow-book">
        <rect x="850" y="120" width="190" height="180" rx="10" />
        <foreignObject x="850" y="120" width="190" height="180">
          <div className="flow-book-inner">
            <AnnalMark size={34} />
            <b>Your book</b>
            <span>Base Sepolia</span>
          </div>
        </foreignObject>
      </g>
    </svg>
  );
}

export function Landing({ initial }: { initial: BookState }) {
  const { book } = useLiveBook(initial);
  const [now, setNow] = useState<number | null>(null);
  const [unprinted, setUnprinted] = useState<Unprinted[]>([]);
  const watch = watchState(book);

  useEffect(() => {
    const tick = () => setNow(Math.floor(Date.now() / 1000));
    tick();
    const t = setInterval(tick, 5000);
    return () => clearInterval(t);
  }, []);

  const newestFirst = useMemo(() => [...book.lines].sort((a, b) => b.index - a.index), [book.lines]);
  const newest = newestFirst[0];
  const newestSource = newest ? sourceByChainId(newest.originChainId) : undefined;
  const newestDelay = newest ? delayOf(newest) : null;
  const delays = book.lines.map(delayOf).filter((d): d is number => d !== null);
  const med = median(delays);
  // Shared, de-duplicated lookup: a live re-read must not re-request a trail that never changes.
  const trailState = useTrail(book.owner, newest);
  const trail = trailState.status === "ready" ? trailState.trail : null;
  const printedKey = book.lines.map((l) => l.originTxHash + l.logIndex).join(",");

  useEffect(() => {
    let cancelled = false;
    findUnprinted(book.owner, book.lines, book.openedAt, Math.floor(Date.now() / 1000)).then((r) => {
      if (!cancelled) setUnprinted(r.items);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.owner, book.openedAt, printedKey]);


  const tickerItems = [
    ...newestFirst.map((l) => {
      const s = sourceByChainId(l.originChainId);
      const d = delayOf(l);
      return (
        <span className="tick-item" key={`l${l.index}`}>
          {s && <ChainMark chain={s.key} size={16} />}
          <b>{lineNumber(l.index)}</b> {s?.name} · {formatUsdc(l.amount)} USDC
          {d !== null && <> · printed in {d} s</>}
          <CheckIcon aria-hidden weight="bold" className="tick-ok" />
        </span>
      );
    }),
    ...unprinted
      .filter((u) => u.kind === "not-usdc")
      .map((u) => (
        <span className="tick-item tick-hot" key={u.key}>
          <ProhibitIcon aria-hidden weight="bold" />
          <s>
            {formatUnitsPlain(u.value, u.decimals)} &ldquo;{u.symbol}&rdquo;
          </s>{" "}
          on {u.chainName} · not printed: not Circle&rsquo;s USDC
        </span>
      )),
  ];

  const fake = unprinted.find((u) => u.kind === "not-usdc");

  return (
    <>
      <Reveals />
      {/* ───────── hero ───────── */}
      <section className="hero">
        <div className="hero-glow" aria-hidden />
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="live-pill" aria-live="polite">
              <span className="live-dot" data-state={watch.dot} aria-hidden />
              {watch.kind === "watching" ? "Live · Reactive is watching" : watch.status}
              <span className="live-pill-block">block {Number(book.block).toLocaleString("en-US")}</span>
            </p>
            {newest && newestSource ? (
              <h1 className="hero-h1">
                <span className="hero-amount">
                  <DotNumber value={usdcNumber(newest.amount)} decimals={2} />
                  <span className="hero-unit">USDC</span>
                </span>
                <span className="hero-line">
                  landed in the book{" "}
                  <span className="hero-chip" style={{ background: CHAIN_COLOR[newestSource.key] }}>
                    <ChainMark chain={newestSource.key} size={30} />
                    {newestDelay !== null ? <DotNumber value={newestDelay} suffix=" s" /> : newestSource.short}
                  </span>{" "}
                  {newestDelay !== null ? "after its block." : "from its own log."}
                </span>
              </h1>
            ) : (
              <h1 className="hero-h1">
                <span className="hero-line">{site.thesis}</span>
              </h1>
            )}
            <p className="hero-sub">
              <strong>{site.thesis}</strong>{" "}
              {newest && newestSource && (
                <>
                  That one came from {newestSource.name}
                  {now !== null ? `, ${ago(now - newest.writtenAt)}` : ` at ${formatTime(newest.writtenAt)}`}.
                </>
              )}
            </p>
            <div className="hero-actions">
              <Link href="#open" className="btn btn-ink">
                <WalletIcon aria-hidden weight="bold" />
                Open your book
              </Link>
              <Link href={`/book/${DEMO_BOOK}`} className="btn btn-glass">
                See the live book
                <ArrowRightIcon aria-hidden weight="bold" />
              </Link>
            </div>
          </div>

          <Link href={`/book/${DEMO_BOOK}`} className="hero-roll" aria-label="Open the live demo book">
            <div className="mini-roll">
              <div className="mini-head">
                <b>Income book</b>
                <span>{shortHex(book.owner, 6, 4)}</span>
              </div>
              <div className="mini-feed">
                <BroadcastIcon aria-hidden weight="bold" />
                {watch.feed}
              </div>
              <ol className="mini-lines">
                {newestFirst.slice(0, 4).map((l, i) => {
                  const s = sourceByChainId(l.originChainId);
                  const d = delayOf(l);
                  return (
                    <li key={l.index} style={{ ["--i" as string]: i }}>
                      {s && <ChainMark chain={s.key} size={26} />}
                      <span className="mini-what">
                        <b>{s?.name}</b>
                        <small>
                          {lineNumber(l.index)} · {d !== null ? `printed in ${d} s` : formatTime(l.writtenAt)}
                        </small>
                      </span>
                      <span className="mini-amt">{formatUsdc(l.amount)}</span>
                      <CheckIcon aria-hidden weight="bold" className="mini-ok" />
                    </li>
                  );
                })}
              </ol>
              <div className="mini-total">
                <span>Total received</span>
                <b>
                  <DotNumber value={usdcNumber(book.total)} decimals={2} />
                  <small>USDC</small>
                </b>
              </div>
              <div className="mini-open">
                Open the full book <ArrowUpRightIcon aria-hidden weight="bold" />
              </div>
            </div>
          </Link>
        </div>

        <div className="ticker" aria-label="Recent lines">
          <div className="ticker-track">
            {tickerItems}
            <span aria-hidden className="ticker-dup">
              {tickerItems}
            </span>
          </div>
        </div>
      </section>

      {/* ───────── stats ───────── */}
      <section className="stats" aria-label="Live numbers from the demo book">
        <Stat value={book.lines.length} label="lines printed" icon={<PrinterIcon aria-hidden weight="bold" />} />
        <Stat value={usdcNumber(book.total)} decimals={2} unit="USDC" label="received, every line checkable" icon={<BookOpenIcon aria-hidden weight="bold" />} />
        <Stat value={med ?? 0} unit="s" label={med === null ? "median print time (measuring)" : "median print time, payment to line"} icon={<TimerIcon aria-hidden weight="bold" />} />
        <Stat value={SOURCES.length} label="chains, one book" icon={<LightningIcon aria-hidden weight="bold" />} />
      </section>

      {/* ───────── how it works ───────── */}
      <section className="how" id="how">
        <div className="section-head reveal">
          <h2>
            Three chains in.
            <br />
            One book out.
          </h2>
          <p>
            You open your book once. From then on Reactive Network watches Circle&rsquo;s USDC on every chain for payments to
            you, and copies each one into the book within seconds. No server of ours sits in between.
          </p>
        </div>
        <div className="how-grid">
          <div className="how-flow reveal">
            <FlowDiagram />
          </div>
          <ol className="steps">
            <li className="step reveal">
              <span className="step-icon">
                <WalletIcon aria-hidden weight="bold" />
              </span>
              <div>
                <h3>A client pays you</h3>
                <p>USDC on Ethereum, Base or Unichain Sepolia, to your normal wallet. They don&rsquo;t need to know Annal exists.</p>
                {newest && newestSource && (
                  <a className="proof" href={txUrl(newestSource.explorer, newest.originTxHash)} target="_blank" rel="noreferrer">
                    {newestSource.short} tx {shortHex(newest.originTxHash, 6, 4)} <ArrowUpRightIcon aria-hidden weight="bold" />
                  </a>
                )}
              </div>
            </li>
            <li className="step reveal">
              <span className="step-icon">
                <LightningIcon aria-hidden weight="bold" />
              </span>
              <div>
                <h3>Reactive reads the log</h3>
                <p>An ownerless reactive contract on Lasna sees the transfer&rsquo;s log the moment it&rsquo;s final and asks for a callback.</p>
                {trail?.reactiveTx && (
                  <a className="proof" href={txUrl(REACTIVE.explorer, trail.reactiveTx)} target="_blank" rel="noreferrer">
                    Lasna tx {shortHex(trail.reactiveTx, 6, 4)} <ArrowUpRightIcon aria-hidden weight="bold" />
                  </a>
                )}
              </div>
            </li>
            <li className="step reveal">
              <span className="step-icon">
                <PrinterIcon aria-hidden weight="bold" />
              </span>
              <div>
                <h3>The line prints</h3>
                <p>The callback writes payer, amount, chain, tx hash and log index into your book on Base Sepolia. Nobody can type there.</p>
                {trail?.callbackTx && (
                  <a className="proof" href={txUrl(BOOK.explorer, trail.callbackTx)} target="_blank" rel="noreferrer">
                    Base tx {shortHex(trail.callbackTx, 6, 4)} <ArrowUpRightIcon aria-hidden weight="bold" />
                  </a>
                )}
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* ───────── trust: the look-alike ───────── */}
      <section className="trust" id="trust">
        <div className="section-head reveal">
          <h2>
            Explorers said {fake ? formatUnitsPlain(fake.value, fake.decimals, 0) : "500"} USDC.
            <br />
            Annal printed nothing.
          </h2>
          <p>
            Anyone can deploy a token called &ldquo;USD Coin&rdquo;. Wallets and explorers list it like the real thing. Annal only
            watches Circle&rsquo;s USDC contracts, so a look-alike never becomes a line. This one was sent to the demo wallet.
          </p>
        </div>
        <div className="versus">
          <div className="versus-card versus-explorer reveal">
            <div className="versus-label">
              <ShieldCheckIcon aria-hidden weight="bold" />
              What an explorer lists
            </div>
            <ul>
              {fake && (
                <li className="vs-fake">
                  <span className="vs-token">USDC</span>
                  <span>
                    {formatUnitsPlain(fake.value, fake.decimals)} <small>from {shortHex(fake.from)}</small>
                  </span>
                </li>
              )}
              {newestFirst.slice(0, 3).map((l) => (
                <li key={l.index}>
                  <span className="vs-token">USDC</span>
                  <span>
                    {formatUsdc(l.amount)} <small>from {shortHex(l.payer)}</small>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="versus-card versus-book reveal">
            <div className="versus-label">
              <AnnalMark size={22} />
              What the book printed
            </div>
            <ul>
              {fake && (
                <li className="vs-fake">
                  <s>{formatUnitsPlain(fake.value, fake.decimals)} &ldquo;USDC&rdquo;</s>
                  <span className="stamp">
                    <ProhibitIcon aria-hidden weight="bold" />
                    Not printed
                  </span>
                </li>
              )}
              {newestFirst.slice(0, 3).map((l) => {
                const s = sourceByChainId(l.originChainId);
                return (
                  <li key={l.index}>
                    <span className="vs-line">
                      {s && <ChainMark chain={s.key} size={18} />}
                      {formatUsdc(l.amount)} · {s?.short}
                    </span>
                    <CheckIcon aria-hidden weight="bold" className="vs-ok" />
                  </li>
                );
              })}
            </ul>
            {fake && (
              <p className="versus-why">
                {shortHex(fake.token)} calls itself USDC. It isn&rsquo;t Circle&rsquo;s contract on {fake.chainName}, so Reactive never
                even sees it.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ───────── who it's for ───────── */}
      <section className="who">
        <div className="section-head reveal">
          <h2>Hand it to anyone who needs proof.</h2>
          <p>Paid in USDC on three chains? Send one link. The reader needs no wallet and no trust in you.</p>
        </div>
        <div className="who-grid">
          {[
            { icon: <HouseIcon aria-hidden weight="bold" />, title: "Your landlord", body: "Sees six months of income in one statement, each line ticked against its own chain." },
            { icon: <CalculatorIcon aria-hidden weight="bold" />, title: "Your accountant", body: "Gets payer, amount, date and chain for every payment, with the transaction behind it." },
            { icon: <AirplaneTiltIcon aria-hidden weight="bold" />, title: "A visa officer", body: "Reads a record the applicant couldn't have edited, and can check any line in a click." },
          ].map((w) => (
            <article className="who-card reveal" key={w.title}>
              <span className="who-icon">{w.icon}</span>
              <h3>{w.title}</h3>
              <p>{w.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ───────── the machine ───────── */}
      <section className="machine-sec">
        <div className="section-head reveal">
          <h2>Two contracts. No owner.</h2>
          <p>Nothing here asks you to trust us. Read the contracts, or ask the chain yourself.</p>
        </div>
        <div className="machine-grid">
          <div className="contract reveal">
            <span className="contract-tag">Reactive Lasna</span>
            <h3>AnnalReactive</h3>
            <p>Subscribes to Circle USDC transfers to every opened wallet on all three chains, and asks for a callback for each one.</p>
            <a href={addressUrl(REACTIVE.explorer, REACTIVE.address)} target="_blank" rel="noreferrer" title={SAME_ADDRESS_NOTE}>
              {shortHex(REACTIVE.address, 8, 6)} <ArrowUpRightIcon aria-hidden weight="bold" />
            </a>
          </div>
          <div className="contract reveal">
            <span className="contract-tag">Base Sepolia</span>
            <h3>AnnalBook</h3>
            <p>Accepts lines only from the callback proxy on behalf of AnnalReactive, and only for Circle&rsquo;s USDC. No admin function.</p>
            <a href={addressUrl(BOOK.explorer, BOOK.address)} target="_blank" rel="noreferrer" title={SAME_ADDRESS_NOTE}>
              {shortHex(BOOK.address, 8, 6)} <ArrowUpRightIcon aria-hidden weight="bold" />
            </a>
          </div>
          
          <div className="verify reveal">
            <div className="verify-head">
              <span>Verify it yourself</span>
              <CopyButton value={`cast call ${BOOK.address} "lineCount(address)(uint256)" ${DEMO_BOOK} --rpc-url ${BOOK.rpc}`} label="Copy the command" what="Command copied" />
            </div>
            <pre>
              <code>
                {`cast call ${shortHex(BOOK.address, 6, 4)} \\
  "lineCount(address)(uint256)" \\
  ${shortHex(DEMO_BOOK, 6, 4)} \\
  --rpc-url ${BOOK.rpc}

→ ${book.lines.length}`}
              </code>
            </pre>
          </div>
          <p className="same-address reveal">
            <InfoIcon aria-hidden weight="bold" />
            {SAME_ADDRESS_NOTE}
          </p>
        </div>
      </section>

      {/* ───────── final call ───────── */}
      <section className="final" id="open">
        <div className="final-inner reveal">
          <h2>
            Open your book.
            <br />
            Then forget about it.
          </h2>
          <p>One transaction on Base Sepolia. After that, every USDC payment to your wallet prints itself.</p>
          <div className="final-actions">
            <OpenBook label="Open my book" hint={false} />
            <Link href={`/book/${DEMO_BOOK}`} className="btn btn-glass">
              See the live book
              <ArrowRightIcon aria-hidden weight="bold" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="foot">
        <div className="foot-inner">
          <div className="foot-brand">
            <AnnalMark size={34} />
            <div>
              <b>Annal</b>
              <p>{site.thesis}</p>
            </div>
          </div>
          <nav className="foot-links" aria-label="Footer">
            <Link href={`/book/${DEMO_BOOK}`}>Live book</Link>
            <Link href="/#how">How it works</Link>
          </nav>
          <p className="foot-note">
            Built on Reactive Network · testnet only (Lasna, Ethereum, Base and Unichain Sepolia) · USDC only · MIT licensed
          </p>
        </div>
      </footer>
    </>
  );
}
