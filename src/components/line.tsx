"use client";

import { ArrowUpRight, Check, ChevronDown, Ellipsis, Minus, X } from "lucide-react";
import { useState } from "react";
import { BOOK, REACTIVE, sourceByChainId, txUrl } from "@/lib/annal";
import type { BookLine, LineTrail } from "@/lib/book";
import type { CheckState } from "@/lib/check";
import { formatTime, formatUsdc, iso, lineNumber, shortHex } from "@/lib/format";
import { CopyButton } from "./copy-button";

type TrailLoad = { status: "idle" | "loading" | "error" } | { status: "ready"; trail: LineTrail };

function Mark({ check }: { check: CheckState }) {
  const label =
    check.state === "checked"
      ? "Checked against the origin receipt"
      : check.state === "mismatch"
        ? "Does not match the origin receipt"
        : check.state === "unchecked"
          ? "Not checked: origin chain unreachable"
          : "Checking the origin receipt";
  return (
    <span className="mark" data-check={check.state} role="img" aria-label={label} title={label}>
      {check.state === "checked" && <Check aria-hidden strokeWidth={2.75} />}
      {check.state === "mismatch" && <X aria-hidden strokeWidth={2.75} />}
      {check.state === "unchecked" && <Minus aria-hidden strokeWidth={2.5} />}
      {check.state === "checking" && <Ellipsis aria-hidden strokeWidth={2.5} />}
    </span>
  );
}

function TxLink({ explorer, hash, label }: { explorer: string; hash: string; label: string }) {
  return (
    <>
      <a href={txUrl(explorer, hash)} target="_blank" rel="noreferrer" title={hash}>
        tx {shortHex(hash, 6, 4)}
        <ArrowUpRight aria-hidden strokeWidth={2} />
        <span className="sr-only">(opens {label} in a new tab)</span>
      </a>
      <CopyButton value={hash} label={`Copy the ${label} hash`} />
    </>
  );
}

export function Line({
  owner,
  line,
  decimals,
  check,
  newest,
  fresh,
}: {
  owner: string;
  line: BookLine;
  decimals: number;
  check: CheckState;
  newest: boolean;
  fresh: boolean;
}) {
  const [trail, setTrail] = useState<TrailLoad>({ status: "idle" });
  const source = sourceByChainId(line.originChainId);
  const chainName = source?.name ?? `Chain ${line.originChainId}`;

  async function loadTrail() {
    if (trail.status === "loading" || trail.status === "ready") return;
    setTrail({ status: "loading" });
    const q = new URLSearchParams({
      owner,
      index: String(line.index),
      chain: String(line.originChainId),
      tx: line.originTxHash,
      log: String(line.logIndex),
      at: String(line.writtenAt),
    });
    try {
      const res = await fetch(`/api/trail?${q}`);
      if (!res.ok) throw new Error();
      setTrail({ status: "ready", trail: (await res.json()) as LineTrail });
    } catch {
      setTrail({ status: "error" });
    }
  }

  const delay =
    check.state === "checked" && check.originAt > 0 ? Math.max(0, line.writtenAt - check.originAt) : null;

  return (
    <li className="line" data-newest={newest || undefined} data-fresh={fresh || undefined} value={line.index + 1}>
      <details onToggle={(e) => (e.currentTarget as HTMLDetailsElement).open && loadTrail()}>
        <summary>
          <span className="line-no">
            <ChevronDown aria-hidden strokeWidth={2.25} />
            {lineNumber(line.index)}
          </span>
          <span className="line-what">
            <span className="line-chain">{chainName}</span>
            <span className="line-sub">
              from {shortHex(line.payer)} · <time dateTime={iso(line.writtenAt)}>{formatTime(line.writtenAt)}</time>
              {delay !== null && <> · printed in {delay} s</>}
            </span>
          </span>
          <span className="amount">{formatUsdc(line.amount, decimals)}</span>
          <Mark check={check} />
        </summary>

        <div className="trail">
          <ol>
            <li>
              <div className="trail-step">Paid on {chainName}</div>
              <div className="trail-detail">
                {source && <TxLink explorer={source.explorer} hash={line.originTxHash} label={`${chainName} payment`} />}
                <span>
                  block {Number(line.originBlock).toLocaleString("en-US")} · log #{line.logIndex}
                </span>
              </div>
            </li>
            <li>
              <div className="trail-step">Read by Reactive Network on Lasna</div>
              <div className="trail-detail">
                {trail.status === "ready" && trail.trail.reactiveTx ? (
                  <>
                    <TxLink explorer={REACTIVE.explorer} hash={trail.trail.reactiveTx} label="Reactive transaction" />
                    {trail.trail.reactiveAt && <span>{formatTime(trail.trail.reactiveAt)}</span>}
                  </>
                ) : (
                  <span>
                    {trail.status === "loading" || trail.status === "idle"
                      ? "finding the reactive transaction…"
                      : "couldn't find it just now"}
                  </span>
                )}
              </div>
            </li>
            <li>
              <div className="trail-step">Written to this book on {BOOK.name}</div>
              <div className="trail-detail">
                {trail.status === "ready" && trail.trail.callbackTx ? (
                  <TxLink explorer={BOOK.explorer} hash={trail.trail.callbackTx} label="callback" />
                ) : (
                  <span>
                    {trail.status === "loading" || trail.status === "idle"
                      ? "finding the callback…"
                      : "couldn't find it just now"}
                  </span>
                )}
                <span>{formatTime(line.writtenAt)}</span>
              </div>
            </li>
          </ol>

          <p className="verdict" data-check={check.state}>
            {check.state === "checked" && (
              <>
                <strong>Checked in your browser.</strong> {chainName}&rsquo;s receipt holds log #{line.logIndex}: a
                Circle USDC transfer of {formatUsdc(line.amount, decimals)} from {shortHex(line.payer)} to this wallet.
                {delay !== null && <> Printed {delay === 0 ? "within the same second as" : `${delay} s after`} its block.</>}
              </>
            )}
            {check.state === "mismatch" && (
              <>
                <strong>Doesn&rsquo;t match.</strong> {check.reason}
              </>
            )}
            {check.state === "unchecked" && (
              <>
                <strong>Not checked.</strong> {check.reason} Open the payment above to check it on the explorer.
              </>
            )}
            {check.state === "checking" && <>Fetching {chainName}&rsquo;s receipt for this payment…</>}
          </p>
        </div>
      </details>
    </li>
  );
}
