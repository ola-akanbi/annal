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

export function GitHubMark({ size = 18, className }: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden fill="currentColor">
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.4-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z" />
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
