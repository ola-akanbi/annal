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
    return { s, count: lines.length, sum: sum.toString(), share, pct: 0 };
  });
  // Whole percentages that add up to exactly 100 (largest remainder), from bigint shares.
  if (total > 0n) {
    const exact = rows.map((r) => (BigInt(r.sum) * 10000n) / total); // basis points
    exact.forEach((bp, i) => (rows[i].pct = Number(bp / 100n)));
    let left = 100 - rows.reduce((a, r) => a + r.pct, 0);
    const order = exact.map((bp, i) => ({ i, rem: bp % 100n })).sort((a, b) => (b.rem > a.rem ? 1 : b.rem < a.rem ? -1 : 0));
    for (const { i } of order) {
      if (left <= 0) break;
      if (BigInt(rows[i].sum) > 0n) {
        rows[i].pct += 1;
        left -= 1;
      }
    }
  }
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
                {total > 0n && ` · ${r.pct}% of the total`}
              </small>
            </span>
            <span className="split-amt">{formatUsdc(r.sum)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
