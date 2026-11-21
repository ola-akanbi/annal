"use client";

import { LinkSimpleIcon, PrinterIcon, ShareNetworkIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import { encode } from "uqr";

/** The book's link as a dot-matrix QR code: finder squares stay square so phones still read it. */
function DotQr({ text }: { text: string }) {
  const qr = useMemo(() => encode(text, { border: 0 }), [text]);
  const n = qr.size;
  const isFinder = (x: number, y: number) =>
    (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
  return (
    <svg viewBox={`-1 -1 ${n + 2} ${n + 2}`} className="qr" role="img" aria-label="QR code linking to this book">
      <rect x="-1" y="-1" width={n + 2} height={n + 2} rx="2" fill="#fff" />
      {qr.data.flatMap((row, y) =>
        row.map((on, x) =>
          on && !isFinder(x, y) ? <circle key={`${x}-${y}`} cx={x + 0.5} cy={y + 0.5} r="0.46" fill="#0e0e10" /> : null,
        ),
      )}
      {[
        [0, 0],
        [n - 7, 0],
        [0, n - 7],
      ].map(([fx, fy]) => (
        <g key={`${fx}-${fy}`}>
          <rect x={fx + 0.5} y={fy + 0.5} width="6" height="6" rx="1.6" fill="none" stroke="#0e0e10" strokeWidth="1" />
          <rect x={fx + 2} y={fy + 2} width="3" height="3" rx="0.8" fill="#0e0e10" />
        </g>
      ))}
    </svg>
  );
}

export function ShareCard({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    // The link is only known in the browser (production, preview or local origin).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(`${window.location.origin}${path}`);
    setCanShare(typeof navigator.share === "function");
  }, [path]);

  return (
    <aside className="share" aria-label="Share this book">
      <div className="share-qr">{url ? <DotQr text={url} /> : <div className="qr qr-pending" />}</div>
      <div className="share-body">
        <h2>Share this book</h2>
        <p>Anyone with the link can check every line against the chain it came from. No wallet needed.</p>
        <div className="share-actions">
          <button
            type="button"
            className="pill"
            onClick={async () => {
              if (!url) return;
              try {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 1600);
                toast.success("Book link copied", { description: "Send it to anyone who needs to check your income." });
              } catch {
                toast.error("Couldn't copy the link", { description: "Your browser blocked the clipboard. Use the QR code instead." });
              }
            }}
          >
            <LinkSimpleIcon aria-hidden weight="bold" />
            {copied ? "Link copied" : "Copy link"}
          </button>
          {canShare && (
            <button type="button" className="pill" onClick={() => url && navigator.share({ title: "My income book", url }).catch(() => {})}>
              <ShareNetworkIcon aria-hidden weight="bold" />
              Share
            </button>
          )}
          <button type="button" className="pill" onClick={() => window.print()}>
            <PrinterIcon aria-hidden weight="bold" />
            Print
          </button>
        </div>
      </div>
    </aside>
  );
}
