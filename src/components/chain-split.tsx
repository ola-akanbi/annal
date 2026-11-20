import { SOURCES } from "@/lib/annal";
import type { BookState } from "@/lib/book";
import { formatUsdc } from "@/lib/format";
import { CHAIN_COLOR, ChainMark } from "./marks";

/** Where the money came from: one bar, one colour per chain. */
export function ChainSplit({ book }: { book: BookState }) {
  const total = BigInt(book.total);
  const rows = SOURCES.map((s) => {
    const lines = book.lines.filter((l) => l.originChainId === s.chainId);
    const sum = lines.reduce((a, l) => a + BigInt(l.amount), 0n);
    const share = total > 0n ? Number((sum * 1000n) / total) / 10 : 0;
    return { s, count: lines.length, sum: sum.toString(), share };
  });
  return (
    <section className="split" aria-label="Received by chain">
      <h2>Where it came from</h2>
      <div className="split-bar" aria-hidden>
        {total > 0n ? (
          rows.map((r) => (r.share > 0 ? <span key={r.s.key} style={{ flexGrow: r.share, background: CHAIN_COLOR[r.s.key] }} /> : null))
        ) : (
          <span className="split-empty" />
        )}
      </div>
      <ul>
        {rows.map((r) => (
          <li key={r.s.key}>
            <ChainMark chain={r.s.key} size={22} />
            <span className="split-name">
              {r.s.name}
              <small>
                {r.count} {r.count === 1 ? "line" : "lines"}
                {total > 0n && ` · ${r.share.toFixed(0)}%`}
              </small>
            </span>
            <span className="split-amt">{formatUsdc(r.sum)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
