// Server-side reads of the book (Base Sepolia) and the reactive contract (Lasna).
// Everything returned is plain JSON (bigints as decimal strings), so it can be cached and sent
// to the client unchanged.

import { createPublicClient, getAddress, http, type Address, type Hex } from "viem";
import { cacheLife } from "next/cache";
import { annalBookAbi, annalReactiveAbi } from "./abi";
import { BOOK, REACTIVE, SOURCES } from "./annal";

export type BookLine = {
  index: number;
  originChainId: number;
  token: Address;
  payer: Address;
  amount: string;
  originBlock: string;
  originTxHash: Hex;
  logIndex: number;
  writtenAt: number;
  /** Timestamp of the payment's own block on its chain (0 if it couldn't be read). */
  originAt: number;
};

export type ReactiveHealth = {
  /** Whether AnnalReactive has subscribed for this wallet (null if Lasna couldn't be read). */
  watching: boolean | null;
  /** AnnalReactive's lREACT balance, wei as a string. */
  balance: string | null;
  /** Debt owed to the system contract. Any debt > 0 stops every reaction. */
  debt: string | null;
};

export type BookState = {
  owner: Address;
  /** 0 = never opened. */
  openedAt: number;
  /** 0 = Reactive hasn't confirmed yet. */
  watchingSince: number;
  total: string;
  lines: BookLine[];
  reactive: ReactiveHealth;
  /** Base Sepolia block the book was read at. */
  block: string;
  /** When the read happened (unix seconds). */
  readAt: number;
};

const LINE_PAGE = 200n;

const base = createPublicClient({ transport: http(BOOK.rpc, { timeout: 12_000, retryCount: 2 }) });
const lasna = createPublicClient({ transport: http(REACTIVE.rpc, { timeout: 12_000, retryCount: 2 }) });

const originClients = new Map(
  SOURCES.map((s) => [s.chainId, createPublicClient({ transport: http(s.rpc, { timeout: 8_000, retryCount: 1 }) })]),
);

/** A block's timestamp never changes, so it is cached for as long as Next allows. */
async function originTimestamp(chainId: number, block: string): Promise<number> {
  "use cache";
  cacheLife("max");
  const client = originClients.get(chainId);
  if (!client) return 0;
  try {
    const b = await client.getBlock({ blockNumber: BigInt(block) });
    return Number(b.timestamp);
  } catch {
    return 0;
  }
}

/** Fills `originAt` for the newest lines (older ones keep 0 to bound the work per read). */
const ORIGIN_TIMES_FOR = 40;

const systemAbi = [
  {
    type: "function",
    name: "debt",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

async function readReactiveHealth(owner: Address): Promise<ReactiveHealth> {
  const [watching, balance, debt] = await Promise.allSettled([
    lasna.readContract({ address: REACTIVE.address, abi: annalReactiveAbi, functionName: "watching", args: [owner] }),
    lasna.getBalance({ address: REACTIVE.address }),
    lasna.readContract({
      address: REACTIVE.systemContract,
      abi: systemAbi,
      functionName: "debt",
      args: [REACTIVE.address],
    }),
  ]);
  return {
    watching: watching.status === "fulfilled" ? watching.value : null,
    balance: balance.status === "fulfilled" ? balance.value.toString() : null,
    debt: debt.status === "fulfilled" ? debt.value.toString() : null,
  };
}

/** Reads the whole book for `owner` straight from the chain. Uncached. */
export async function readBookLive(ownerInput: string): Promise<BookState> {
  const owner = getAddress(ownerInput);
  const block = await base.getBlockNumber();
  const at = { blockNumber: block } as const;
  const c = { address: BOOK.address, abi: annalBookAbi } as const;

  const [openedAt, watchingSince, total, count, reactive, blockInfo] = await Promise.all([
    base.readContract({ ...c, functionName: "openedAt", args: [owner], ...at }),
    base.readContract({ ...c, functionName: "watchingSince", args: [owner], ...at }),
    base.readContract({ ...c, functionName: "totalReceived", args: [owner], ...at }),
    base.readContract({ ...c, functionName: "lineCount", args: [owner], ...at }),
    readReactiveHealth(owner),
    base.getBlock({ blockNumber: block }),
  ]);

  const lines: BookLine[] = [];
  for (let offset = 0n; offset < count; offset += LINE_PAGE) {
    const page = await base.readContract({
      address: BOOK.address,
      abi: annalBookAbi,
      functionName: "lines",
      args: [owner, offset, LINE_PAGE],
      ...at,
    });
    page.forEach((l, i) =>
      lines.push({
        index: Number(offset) + i,
        originChainId: Number(l.originChainId),
        token: l.token,
        payer: l.payer,
        amount: l.amount.toString(),
        originBlock: l.originBlock.toString(),
        originTxHash: l.originTxHash,
        logIndex: Number(l.logIndex),
        writtenAt: Number(l.writtenAt),
        originAt: 0,
      }),
    );
  }

  const recent = lines.slice(-ORIGIN_TIMES_FOR);
  const times = await Promise.all(recent.map((l) => originTimestamp(l.originChainId, l.originBlock)));
  recent.forEach((l, i) => (l.originAt = times[i]));

  return {
    owner,
    openedAt: Number(openedAt),
    watchingSince: Number(watchingSince),
    total: total.toString(),
    lines,
    reactive,
    block: block.toString(),
    readAt: Number(blockInfo.timestamp),
  };
}

/**
 * The same read, cached about a minute so the filled statement is part of the prerendered HTML.
 * The client re-reads live as soon as it mounts, so this never stands in for current state for long.
 */
export async function readBookCached(owner: string): Promise<BookState> {
  "use cache";
  cacheLife("minutes");
  return readBookLive(owner);
}

// ---------- the trail of one line: origin → Lasna reaction → Base callback ----------

export type LineTrail = {
  /** AnnalReactive's `Copied` event on Lasna: the reactive transaction that read the payment. */
  reactiveTx: Hex | null;
  reactiveAt: number | null;
  /** AnnalBook's `LineWritten` event on Base Sepolia: the callback that wrote the line. */
  callbackTx: Hex | null;
  callbackAt: number | null;
};

/**
 * The first Lasna block at or after `ts`, and Lasna's head. Interpolates on block timestamps,
 * falling back to plain bisection every other step, so it settles in a handful of reads rather
 * than one per bit of the block number.
 */
async function lasnaBlockAtOrAfter(ts: number): Promise<{ block: bigint; head: bigint }> {
  const [first, last] = await Promise.all([lasna.getBlock({ blockNumber: REACTIVE.deployBlock }), lasna.getBlock()]);
  const head = last.number;
  if (Number(first.timestamp) >= ts) return { block: first.number, head };
  if (Number(last.timestamp) < ts) return { block: head, head };
  // Invariant: lo.t < ts <= hi.t
  let lo = { n: first.number, t: Number(first.timestamp) };
  let hi = { n: head, t: Number(last.timestamp) };
  for (let step = 0; hi.n - lo.n > 1n; step++) {
    let mid =
      step % 2 === 0 && hi.t > lo.t
        ? lo.n + ((hi.n - lo.n) * BigInt(ts - lo.t)) / BigInt(hi.t - lo.t)
        : (lo.n + hi.n) / 2n;
    if (mid <= lo.n) mid = lo.n + 1n;
    if (mid >= hi.n) mid = hi.n - 1n;
    const t = Number((await lasna.getBlock({ blockNumber: mid })).timestamp);
    if (t < ts) lo = { n: mid, t };
    else hi = { n: mid, t };
  }
  return { block: hi.n, head };
}

async function findCallback(owner: Address, index: number, writtenAt: number) {
  const latest = await base.getBlock();
  // Base Sepolia makes a block every 200 ms (docs/CONTEXT.md), so the time pins the block closely.
  const guess = latest.number - BigInt(Math.max(0, Number(latest.timestamp) - writtenAt) * 5);
  for (const pad of [40n, 199n]) {
    const logs = await base.getLogs({
      address: BOOK.address,
      event: annalBookAbi.find((x) => x.type === "event" && x.name === "LineWritten")!,
      args: { owner, index: BigInt(index) },
      fromBlock: guess - pad < BOOK.deployBlock ? BOOK.deployBlock : guess - pad,
      toBlock: guess + pad > latest.number ? latest.number : guess + pad,
    });
    if (logs.length > 0) {
      const b = await base.getBlock({ blockNumber: logs[0].blockNumber });
      return { tx: logs[0].transactionHash, at: Number(b.timestamp) };
    }
  }
  return { tx: null, at: null };
}

async function findReaction(owner: Address, originChainId: number, originTxHash: Hex, logIndex: number, writtenAt: number) {
  const { block: start, head } = await lasnaBlockAtOrAfter(writtenAt - 120);
  // Lasna refuses a range that runs past its head, which every freshly printed line would.
  const end = start + 600n > head ? head : start + 600n;
  const logs = await lasna.getLogs({
    address: REACTIVE.address,
    event: annalReactiveAbi.find((x) => x.type === "event" && x.name === "Copied")!,
    args: { owner, originChainId: BigInt(originChainId) },
    fromBlock: start,
    toBlock: end,
  });
  const match = logs.find(
    (l) => BigInt(l.args.originTxHash ?? 0n) === BigInt(originTxHash) && Number(l.args.logIndex) === logIndex,
  );
  if (!match) return { tx: null, at: null };
  const b = await lasna.getBlock({ blockNumber: match.blockNumber });
  return { tx: match.transactionHash, at: Number(b.timestamp) };
}

/** A written line's trail never changes, so it is cached for as long as Next allows. */
export async function readLineTrail(
  ownerInput: string,
  index: number,
  originChainId: number,
  originTxHash: Hex,
  logIndex: number,
  writtenAt: number,
): Promise<LineTrail> {
  "use cache";
  cacheLife("max");
  const owner = getAddress(ownerInput);
  const [callback, reaction] = await Promise.all([
    findCallback(owner, index, writtenAt),
    findReaction(owner, originChainId, originTxHash, logIndex, writtenAt),
  ]);
  return { reactiveTx: reaction.tx, reactiveAt: reaction.at, callbackTx: callback.tx, callbackAt: callback.at };
}
