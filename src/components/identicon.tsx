import { keccak256, toBytes } from "viem";

// Brand tones only: an identity mark is not a status, so no chain or signal colours.
const PALETTE = ["#0e0e0e", "#3a3220", "#7a5a10", "#c9921a", "#f7c348", "#5c4a1c"];

/** A deterministic 5×5 mirrored mark for a wallet: the same address always draws the same face. */
export function Identicon({ address, size = 64 }: { address: string; size?: number }) {
  const bytes = toBytes(keccak256(toBytes(address.toLowerCase())));
  const fg = PALETTE[bytes[0] % PALETTE.length];
  const accent = PALETTE[(bytes[1] % (PALETTE.length - 1)) + 1];
  const cells: { x: number; y: number; c: string }[] = [];
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 3; x++) {
      const b = bytes[2 + y * 3 + x];
      if (b % 2 === 0) continue;
      const c = b % 5 === 0 ? accent : fg;
      cells.push({ x, y, c });
      if (x < 2) cells.push({ x: 4 - x, y, c });
    }
  }
  return (
    <svg viewBox="0 0 7 7" width={size} height={size} aria-hidden className="identicon">
      <rect width="7" height="7" rx="1.6" fill="#fff" />
      {cells.map((cell, i) => (
        <rect key={i} x={cell.x + 1} y={cell.y + 1} width="0.92" height="0.92" rx="0.28" fill={cell.c} />
      ))}
    </svg>
  );
}
