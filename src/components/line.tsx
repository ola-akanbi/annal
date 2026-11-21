"use client";

import { ArrowUpRightIcon, CaretDownIcon, CheckIcon, DotsThreeIcon, MinusIcon, XIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { BOOK, REACTIVE, sourceByChainId, txUrl } from "@/lib/annal";
import type { BookLine } from "@/lib/book";
import type { CheckState } from "@/lib/check";
import { formatDate, formatTime, formatUsdc, iso, lineNumber, shortHex } from "@/lib/format";
import { CopyButton } from "./copy-button";
import { CHAIN_COLOR, ChainMark } from "./marks";
import { EASE } from "./motion";
import { useTrail } from "./use-trail";

function Mark({ check }: { check: CheckState }) {
  const label =
    check.state === "checked"
      ? "Checked against the origin receipt"
      : check.state === "mismatch"
        ? "Does not match the origin receipt"
        : check.state === "unchecked"
          ? "Not checked yet: no public RPC returned the origin receipt"
          : "Checking the origin receipt";
  return (
    <span className="mark" data-check={check.state} role="img" aria-label={label} title={label}>
      {check.state === "checked" && <CheckIcon aria-hidden weight="bold" />}
      {check.state === "mismatch" && <XIcon aria-hidden weight="bold" />}
      {check.state === "unchecked" && <MinusIcon aria-hidden weight="bold" />}
      {check.state === "checking" && <DotsThreeIcon aria-hidden weight="bold" />}
    </span>
  );
}

function TxLink({ explorer, hash, label }: { explorer: string; hash: string; label: string }) {
  return (
    <>
      <a href={txUrl(explorer, hash)} target="_blank" rel="noreferrer" title={hash}>
        tx {shortHex(hash, 6, 4)}
        <ArrowUpRightIcon aria-hidden weight="bold" />
        <span className="sr-only">(opens {label} in a new tab)</span>
      </a>
      <CopyButton value={hash} label={`Copy the ${label} hash`} what="Transaction hash copied" />
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
  open,
  selected,
  onActivate,
  shade,
}: {
  owner: string;
  line: BookLine;
  decimals: number;
  check: CheckState;
  newest: boolean;
  /** Arrived after the page loaded: it feeds out of the printer. */
  fresh: boolean;
  open: boolean;
  /** Shown in the inspector panel. */
  selected: boolean;
  /** Header pressed: toggles the drawer and selects the line for the inspector. */
  onActivate: () => void;
  /** Alternate ledger band tint. */
  shade: boolean;
}) {
  const source = sourceByChainId(line.originChainId);
  const chainName = source?.name ?? `Chain ${line.originChainId}`;
  const trail = useTrail(owner, line, open);
  const delay =
    check.state === "checked" && check.originAt > 0
      ? Math.max(0, line.writtenAt - check.originAt)
      : line.originAt > 0
        ? Math.max(0, line.writtenAt - line.originAt)
        : null;
  const drawerId = `line-${line.index}-proof`;

  return (
    <motion.li
      layout="position"
      className="line"
      data-newest={newest || undefined}
      data-selected={selected || undefined}
      data-open={open || undefined}
      data-shade={shade || undefined}
      style={{ ["--chain" as string]: source ? CHAIN_COLOR[source.key] : "var(--ink)" }}
      initial={fresh ? { opacity: 0, y: -28, clipPath: "inset(0 0 100% 0)" } : false}
      animate={{ opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.6, ease: EASE }}
      value={line.index + 1}
    >
      <button type="button" className="line-head" aria-expanded={open} aria-controls={drawerId} onClick={onActivate}>
        <span className="line-no">
          <CaretDownIcon aria-hidden weight="bold" />
          {lineNumber(line.index)}
        </span>
        <span className="line-what">
          <span className="line-chain">
            {source && <ChainMark chain={source.key} size={18} />}
            {chainName}
            {selected && <span className="inspecting">Inspecting</span>}
          </span>
          <span className="line-sub">
            from {shortHex(line.payer)} ·{" "}
            <time dateTime={iso(line.writtenAt)}>
              {formatDate(line.writtenAt)}, {formatTime(line.writtenAt)}
            </time>
            {delay !== null && <> · printed in {delay} s</>}
          </span>
          <span className="line-sub print-only">
            {chainName} tx {line.originTxHash} · log #{line.logIndex}
          </span>
        </span>
        <span className="amount">{formatUsdc(line.amount, decimals)}</span>
        <Mark check={check} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={drawerId}
            className="drawer"
            role="region"
            aria-label={`Proof for ${lineNumber(line.index)}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.38, ease: EASE }}
          >
            <div className="drawer-inner">
              <ol className="proof-steps">
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
                      <span>{trail.status === "loading" ? "finding the reactive transaction…" : "couldn't find it just now"}</span>
                    )}
                  </div>
                </li>
                <li>
                  <div className="trail-step">Written to this book on {BOOK.name}</div>
                  <div className="trail-detail">
                    {trail.status === "ready" && trail.trail.callbackTx ? (
                      <TxLink explorer={BOOK.explorer} hash={trail.trail.callbackTx} label="callback" />
                    ) : (
                      <span>{trail.status === "loading" ? "finding the callback…" : "couldn't find it just now"}</span>
                    )}
                    <span>{formatTime(line.writtenAt)}</span>
                  </div>
                </li>
              </ol>

              <p className="verdict" data-check={check.state}>
                {check.state === "checked" && (
                  <>
                    <CheckIcon aria-hidden weight="bold" />
                    <span>
                      <strong>Checked in your browser.</strong> {chainName}&rsquo;s receipt holds log #{line.logIndex}: a Circle
                      USDC transfer of {formatUsdc(line.amount, decimals)} from {shortHex(line.payer)} to this wallet.
                      {delay !== null && <> Printed {delay === 0 ? "within the same second as" : `${delay} s after`} its block.</>}
                    </span>
                  </>
                )}
                {check.state === "mismatch" && (
                  <>
                    <XIcon aria-hidden weight="bold" />
                    <span>
                      <strong>Doesn&rsquo;t match.</strong> {check.reason}
                    </span>
                  </>
                )}
                {check.state === "unchecked" && (
                  <>
                    <MinusIcon aria-hidden weight="bold" />
                    <span>
                      <strong>Not checked.</strong> {check.reason} Open the payment above to check it on the explorer.
                    </span>
                  </>
                )}
                {check.state === "checking" && (
                  <>
                    <DotsThreeIcon aria-hidden weight="bold" />
                    <span>Fetching {chainName}&rsquo;s receipt for this payment…</span>
                  </>
                )}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}
