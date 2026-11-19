// Runs in the reader's browser: asks each chain's Blockscout what token transfers reached this
// wallet, and lists the ones the book did not print, with the reason. Explorers show a look-alike
// "USDC" as USDC; the book never does.

import { SOURCES, isSourceToken } from "./annal";
import type { BookLine } from "./book";

export type Unprinted = {
  key: string;
  chainName: string;
  explorer: string;
  txHash: string;
  token: string;
  symbol: string;
  from: string;
  value: string;
  decimals: number;
  timestamp: number;
  kind: "not-usdc" | "before" | "printing" | "missing";
};

type BlockscoutTransfer = {
  log_index: number;
  transaction_hash: string;
  timestamp: string;
  from?: { hash?: string };
  to?: { hash?: string };
  token?: { address_hash?: string | null; symbol?: string | null };
  total?: { value?: string; decimals?: string | null };
};

const PRINTING_GRACE_S = 60;

export async function findUnprinted(
  owner: string,
  lines: readonly BookLine[],
  openedAt: number,
  nowS: number,
): Promise<{ items: Unprinted[]; reached: string[]; failed: string[] }> {
  const printed = new Set(lines.map((l) => `${l.originChainId}:${l.originTxHash.toLowerCase()}:${l.logIndex}`));
  const reached: string[] = [];
  const failed: string[] = [];
  const items: Unprinted[] = [];

  await Promise.all(
    SOURCES.map(async (s) => {
      try {
        const res = await fetch(
          `${s.blockscout}/api/v2/addresses/${owner}/token-transfers?type=ERC-20&filter=to`,
          { cache: "no-store" },
        );
        if (!res.ok) throw new Error(String(res.status));
        const body = (await res.json()) as { items?: BlockscoutTransfer[] };
        reached.push(s.name);
        for (const t of body.items ?? []) {
          if (t.to?.hash?.toLowerCase() !== owner.toLowerCase()) continue;
          const token = t.token?.address_hash ?? "";
          const key = `${s.chainId}:${t.transaction_hash.toLowerCase()}:${t.log_index}`;
          if (printed.has(key)) continue;
          const ts = Math.floor(Date.parse(t.timestamp) / 1000);
          const kind: Unprinted["kind"] = !isSourceToken(s.chainId, token)
            ? "not-usdc"
            : openedAt === 0 || ts < openedAt
              ? "before"
              : nowS - ts < PRINTING_GRACE_S
                ? "printing"
                : "missing";
          items.push({
            key,
            chainName: s.name,
            explorer: s.explorer,
            txHash: t.transaction_hash,
            token,
            symbol: t.token?.symbol ?? "?",
            from: t.from?.hash ?? "",
            value: t.total?.value ?? "0",
            decimals: Number(t.total?.decimals ?? 0),
            timestamp: ts,
            kind,
          });
        }
      } catch {
        failed.push(s.name);
      }
    }),
  );

  items.sort((a, b) => b.timestamp - a.timestamp);
  return { items: items.slice(0, 8), reached, failed };
}

/** Raw token units → display string, without floats. */
export function formatUnitsPlain(raw: string, decimals: number, places = 2): string {
  const v = BigInt(raw);
  if (decimals === 0) return v.toString();
  const base = 10n ** BigInt(decimals);
  const whole = (v / base).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const frac = (v % base).toString().padStart(decimals, "0").slice(0, places);
  return places > 0 ? `${whole}.${frac}` : whole;
}
