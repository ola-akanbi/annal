// Drawn marks for the three source chains and GitHub. Each chain's colour is its identity
// everywhere in the app: line chips, subtotals, the flow diagram.

import type { SourceKey } from "@/lib/annal";

export const CHAIN_COLOR: Record<SourceKey, string> = {
  ethereum: "#627EEA",
  base: "#0052FF",
  unichain: "#F50DB4",
};

type MarkProps = { size?: number; className?: string; title?: string };

function EthereumGlyph() {
  return (
    <g fill="#fff">
      <path d="M12 4.2 7.6 12l4.4 2.6 4.4-2.6z" opacity=".95" />
      <path d="m7.6 12.9 4.4 6.9 4.4-6.9-4.4 2.6z" opacity=".7" />
    </g>
  );
}

function BaseGlyph() {
  // Base's mark: a disc with a flat bar cut from its left edge.
  return <path fill="#fff" d="M12.3 6.2a5.8 5.8 0 1 1-5.75 6.55h7.7v-1.5h-7.7A5.8 5.8 0 0 1 12.3 6.2z" />;
}

function UnichainGlyph() {
  // A four-point spark.
  return <path fill="#fff" d="M12 4.5c.6 3.9 3.6 6.9 7.5 7.5-3.9.6-6.9 3.6-7.5 7.5-.6-3.9-3.6-6.9-7.5-7.5 3.9-.6 6.9-3.6 7.5-7.5z" />;
}

/** A chain's mark: its colour as a rounded tile with a white glyph. */
export function ChainMark({ chain, size = 20, className, title }: MarkProps & { chain: SourceKey }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <rect width="24" height="24" rx="7" fill={CHAIN_COLOR[chain]} />
      {chain === "ethereum" && <EthereumGlyph />}
      {chain === "base" && <BaseGlyph />}
      {chain === "unichain" && <UnichainGlyph />}
    </svg>
  );
}

/** Annal's mark: a receipt with a torn foot and three printed lines. */
export function AnnalMark({ size = 30, className }: MarkProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden>
      <rect width="32" height="32" rx="9" fill="var(--ink)" />
      <path
        d="M9 6.5h14v17.2l-2.33 1.8-2.34-1.8-2.33 1.8-2.33-1.8-2.34 1.8L9 23.7z"
        fill="var(--sun)"
      />
      <path d="M12 11h8M12 14.5h8M12 18h5" stroke="var(--ink)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
