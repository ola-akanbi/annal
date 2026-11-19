// The one place chain IDs, addresses, RPCs and explorers live in the app.
// Mirrors docs/CONTEXT.md; every value there was verified on-chain on 2026-11-19.

import type { Address } from "viem";

export type SourceKey = "ethereum" | "base" | "unichain";

export type Source = {
  key: SourceKey;
  chainId: number;
  /** As a reader sees it. */
  name: string;
  /** Short form for tight spaces. */
  short: string;
  /** Circle's testnet USDC on this chain: the only token Annal records. */
  usdc: Address;
  rpc: string;
  explorer: string;
  /** Blockscout instance used for the explorers'-view comparison (CORS: *). */
  blockscout: string;
};

export const SOURCES: readonly Source[] = [
  {
    key: "ethereum",
    chainId: 11155111,
    name: "Ethereum Sepolia",
    short: "Ethereum",
    usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    rpc: "https://ethereum-sepolia-rpc.publicnode.com",
    explorer: "https://sepolia.etherscan.io",
    blockscout: "https://eth-sepolia.blockscout.com",
  },
  {
    key: "base",
    chainId: 84532,
    name: "Base Sepolia",
    short: "Base",
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    rpc: "https://sepolia.base.org",
    explorer: "https://sepolia.basescan.org",
    blockscout: "https://base-sepolia.blockscout.com",
  },
  {
    key: "unichain",
    chainId: 1301,
    name: "Unichain Sepolia",
    short: "Unichain",
    usdc: "0x31d0220469e10c4E71834a79b1f276d740d3768F",
    rpc: "https://sepolia.unichain.org",
    explorer: "https://sepolia.uniscan.xyz",
    blockscout: "https://unichain-sepolia.blockscout.com",
  },
] as const;

/** The book: AnnalBook on Base Sepolia. */
export const BOOK = {
  chainId: 84532,
  address: "0x653B62A39Aea06998c152b48F150175B2645c8Bd" as Address,
  name: "Base Sepolia",
  rpc: "https://sepolia.base.org",
  explorer: "https://sepolia.basescan.org",
  /** First block the book could have logs in (its deploy block). */
  deployBlock: 61020484n,
} as const;

/** The reactive side: AnnalReactive on Reactive Lasna. */
export const REACTIVE = {
  chainId: 5318007,
  address: "0x653B62A39Aea06998c152b48F150175B2645c8Bd" as Address,
  name: "Reactive Lasna",
  rpc: "https://lasna-rpc.rnk.dev/",
  explorer: "https://lasna.reactscan.net",
  systemContract: "0x8888888888888888888888888888888888888888" as Address,
  deployBlock: 8762495n,
} as const;

/** A real book with real payments, used for `/`. */
export const DEMO_BOOK: Address = "0xa7D557BF0C7312EAF186a6A81159a3650aA77444";

export const USDC_DECIMALS = 6;

export function sourceByChainId(chainId: number): Source | undefined {
  return SOURCES.find((s) => s.chainId === chainId);
}

export function isSourceToken(chainId: number, token: string): boolean {
  const s = sourceByChainId(chainId);
  return !!s && s.usdc.toLowerCase() === token.toLowerCase();
}

export const txUrl = (explorer: string, hash: string) => `${explorer}/tx/${hash}`;
export const addressUrl = (explorer: string, address: string) => `${explorer}/address/${address}`;
