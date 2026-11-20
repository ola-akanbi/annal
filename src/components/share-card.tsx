"use client";

import { Link2, Printer, Share2 } from "lucide-react";
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
        <h2>Hand it over</h2>
        <p>Send this link to a landlord, an accountant or a visa officer. They need no wallet to check it.</p>
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
              } catch {
                /* clipboard blocked: the QR still works */
              }
            }}
          >
            <Link2 aria-hidden strokeWidth={2.3} />
            {copied ? "Link copied" : "Copy link"}
          </button>
          {canShare && (
            <button type="button" className="pill" onClick={() => url && navigator.share({ title: "My income book", url }).catch(() => {})}>
              <Share2 aria-hidden strokeWidth={2.3} />
              Share
            </button>
          )}
          <button type="button" className="pill" onClick={() => window.print()}>
            <Printer aria-hidden strokeWidth={2.3} />
            Print
          </button>
        </div>
      </div>
    </aside>
  );
}
