// The link preview, drawn as the product itself: an amber counter with a printed receipt on it.
// Every figure on the receipt is read from AnnalBook (readBookCached); if the read fails, the card
// shows the thesis alone rather than any made-up number.

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SOURCES, sourceByChainId } from "./annal";
import type { BookState } from "./book";
import { formatUsdc, lineNumber, shortHex } from "./format";
import { CHAIN_COLOR } from "@/components/marks";

export const OG_SIZE = { width: 1200, height: 630 };

const INK = "#0E0E0E";
const SUN = "#F7C348";
const PAPER = "#FAF8F3";
const SOFT = "#4A3A0E"; // --sun-text-soft, 7:1 on amber
const FAINT = "#6B6B6B";

async function fonts() {
  const dir = join(process.cwd(), "src/app/og-fonts");
  const [archivo, mono, monoBold, doto] = await Promise.all([
    readFile(join(dir, "archivo-expanded-black.woff")),
    readFile(join(dir, "martian-mono-500.woff")),
    readFile(join(dir, "martian-mono-700.woff")),
    readFile(join(dir, "doto-black.woff")),
  ]);
  return [
    { name: "Archivo", data: archivo, weight: 900 as const, style: "normal" as const },
    { name: "Martian", data: mono, weight: 500 as const, style: "normal" as const },
    { name: "Martian", data: monoBold, weight: 700 as const, style: "normal" as const },
    { name: "Doto", data: doto, weight: 900 as const, style: "normal" as const },
  ];
}

function Mark({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size}>
      <rect width="32" height="32" rx="9" fill={INK} />
      <path d="M9 6.5h14v17.2l-2.33 1.8-2.34-1.8-2.33 1.8-2.33-1.8-2.34 1.8L9 23.7z" fill={SUN} />
      <path d="M12 11h8M12 14.5h8M12 18h5" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function Receipt({ book }: { book: BookState }) {
  const newest = [...book.lines].sort((a, b) => b.index - a.index).slice(0, 4);
  const more = book.lines.length - newest.length;
  return (
    <div
      style={{
        width: 470,
        display: "flex",
        flexDirection: "column",
        background: PAPER,
        borderRadius: 10,
        boxShadow: "0 30px 60px rgba(60, 40, 0, 0.35)",
        transform: "rotate(2deg)",
        fontFamily: "Martian",
        color: INK,
      }}
    >
      {/* printer slot */}
      <div style={{ height: 14, background: INK, borderRadius: "10px 10px 0 0" }} />
      <div style={{ display: "flex", flexDirection: "column", padding: "22px 30px 0" }}>
        <div style={{ display: "flex", justifyContent: "center", fontSize: 18, fontWeight: 700, letterSpacing: 6 }}>
          INCOME BOOK
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 6, fontSize: 15, color: FAINT }}>
          {shortHex(book.owner, 6, 4)}
        </div>
        <div style={{ marginTop: 16, borderTop: `2px dashed ${INK}`, opacity: 0.25, display: "flex" }} />
        {newest.map((l) => {
          const s = sourceByChainId(l.originChainId);
          return (
            <div key={l.index} style={{ display: "flex", alignItems: "center", marginTop: 14 }}>
              <div style={{ width: 6, height: 34, borderRadius: 3, background: s ? CHAIN_COLOR[s.key] : INK, marginRight: 14 }} />
              <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 700 }}>{s?.name ?? `Chain ${l.originChainId}`}</div>
                <div style={{ fontSize: 13, color: FAINT }}>
                  {`${lineNumber(l.index)} · from ${shortHex(l.payer)}`}
                </div>
              </div>
              <div style={{ fontFamily: "Doto", fontSize: 34 }}>{formatUsdc(l.amount)}</div>
            </div>
          );
        })}
        {more > 0 && (
          <div style={{ display: "flex", marginTop: 10, fontSize: 13, color: FAINT }}>
            {`+ ${more} earlier ${more === 1 ? "line" : "lines"}`}
          </div>
        )}
        <div style={{ marginTop: 18, borderTop: `3px solid ${INK}`, display: "flex" }} />
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "12px 0 24px" }}>
          <div style={{ fontSize: 14, letterSpacing: 3, paddingBottom: 12 }}>TOTAL RECEIVED</div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <div style={{ fontFamily: "Doto", fontSize: 72, lineHeight: 1 }}>{formatUsdc(book.total)}</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginLeft: 8, paddingBottom: 8 }}>USDC</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * `book` null: the read failed, so the card carries the thesis alone.
 * `kind` "site": the landing preview (thesis left). "book": a shared book (its owner and count left).
 */
export async function ogCard(book: BookState | null, kind: "site" | "book") {
  const chainsUsed = book ? new Set(book.lines.map((l) => l.originChainId)).size : 0;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 70px",
          background: SUN,
          color: INK,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: book ? 590 : 1060 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <Mark size={56} />
            <div style={{ fontFamily: "Archivo", fontSize: 40, marginLeft: 16, letterSpacing: -1 }}>Annal</div>
          </div>
          {kind === "book" && book ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", marginTop: 44, fontFamily: "Martian", fontSize: 20, fontWeight: 700, letterSpacing: 5 }}>
                INCOME BOOK
              </div>
              <div style={{ display: "flex", marginTop: 10, fontFamily: "Doto", fontSize: 64, lineHeight: 1 }}>
                {shortHex(book.owner, 6, 4)}
              </div>
              <div style={{ display: "flex", marginTop: 28, fontFamily: "Archivo", fontSize: 40, lineHeight: 1.05, letterSpacing: -1.5 }}>
                {`${book.lines.length} ${book.lines.length === 1 ? "payment" : "payments"}, ${chainsUsed} ${chainsUsed === 1 ? "chain" : "chains"}, one book.`}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", marginTop: 40, fontFamily: "Archivo", fontSize: book ? 50 : 72, lineHeight: 1.02, letterSpacing: -2 }}>
              {"One income book for every chain you\u2019re paid on."}
            </div>
          )}
          <div style={{ display: "flex", marginTop: 30, fontFamily: "Martian", fontSize: 17, lineHeight: 1.5, color: SOFT }}>
            {`Every line copied by Reactive Network from the payment\u2019s own log, on ${SOURCES.slice(0, -1).map((s) => s.name).join(", ")} and ${SOURCES[SOURCES.length - 1].name}.`}
          </div>
        </div>
        {book && <Receipt book={book} />}
      </div>
    ),
    { ...OG_SIZE, fonts: await fonts() },
  );
}
