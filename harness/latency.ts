// Latency harness: sends real Circle USDC payments to an opened book, round-robin across the three
// origin chains, and measures each loop from the chain's own timestamps.
//
//   ANNAL_ACCOUNT=annal-deployer ANNAL_PW_FILE=~/.config/annal/deployer.pw \
//     npm run harness:latency -- --runs 21 --to 0x219B05463962bCc922f1ce3d7fB0374BD501bDD5
//
// Signing goes through Foundry's keystore (`cast send --account --password-file`), so no key ever
// enters this process, an env value or a log. Every read uses the RPCs in src/lib/annal.ts.
//
// Per payment it records: origin tx, block and timestamp; the Lasna reactive tx (AnnalReactive's
// `Copied`); the Base Sepolia callback (AnnalBook's `LineWritten`) and the line's `writtenAt`; and
// whether every field of the printed line equals the origin receipt. A payment that never prints
// within the timeout is recorded as missed, never dropped.

import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { createPublicClient, decodeEventLog, erc20Abi, getAddress, http, isAddress, type Address, type Hex } from "viem";
import { annalBookAbi, annalReactiveAbi } from "../src/lib/abi.ts";
import { BOOK, REACTIVE, SOURCES, type Source } from "../src/lib/annal.ts";

const run = promisify(execFile);

// ---------- arguments ----------

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
}

const runs = Number(arg("runs", "21"));
const to = arg("to", "");
const chainKeys = (arg("chains", "base,unichain,ethereum") ?? "").split(",");
const timeoutSec = Number(arg("timeout", "180"));
const account = process.env.ANNAL_ACCOUNT;
const pwFile = process.env.ANNAL_PW_FILE?.replace(/^~(?=\/)/, process.env.HOME ?? "~");

if (!account || !pwFile) throw new Error("Set ANNAL_ACCOUNT and ANNAL_PW_FILE (Foundry keystore account and its password file).");
if (!to || !isAddress(to)) throw new Error("--to <opened book owner address> is required.");
if (!Number.isSafeInteger(runs) || runs < 1) throw new Error("--runs must be a positive integer.");
const chains = chainKeys.map((k) => {
  const s = SOURCES.find((x) => x.key === k);
  if (!s) throw new Error(`Unknown chain "${k}". Use: ${SOURCES.map((x) => x.key).join(",")}`);
  return s;
});
const owner = getAddress(to);

// ---------- clients ----------

const client = (rpc: string) => createPublicClient({ transport: http(rpc, { timeout: 20_000, retryCount: 3 }) });
const base = client(BOOK.rpc);
const lasna = client(REACTIVE.rpc);
const origin = new Map(SOURCES.map((s) => [s.chainId, client(s.rpc)]));

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Public RPCs are load-balanced: a node can lag the one that returned the receipt by a block or two. */
async function retry<T>(fn: () => Promise<T>, tries = 10): Promise<T> {
  for (let n = 1; ; n++) {
    try {
      return await fn();
    } catch (e) {
      if (n >= tries) throw e;
      await sleep(500 * n);
    }
  }
}

async function cast(args: string[]): Promise<string> {
  const { stdout } = await run("cast", [...args, "--account", account!, "--password-file", pwFile!], { maxBuffer: 1 << 24 });
  return stdout.trim();
}

// ---------- one loop ----------

type Row = {
  run: number;
  chain: Source["key"];
  amount: string;
  originTx: Hex;
  originBlock: string;
  originAt: number;
  reactiveTx: Hex | null;
  reactiveAt: number | null;
  callbackTx: Hex | null;
  callbackBlock: string | null;
  writtenAt: number | null;
  /** writtenAt − origin block timestamp, whole seconds (both are block timestamps). */
  delaySec: number | null;
  /** Base-origin only: callback block − origin block, in 200 ms Base Sepolia blocks. */
  baseBlocks: number | null;
  /** Wall clock from `cast send` returning the receipt to the line being readable from AnnalBook. */
  seenAfterMs: number | null;
  index: number | null;
  fieldsMatch: boolean | null;
  mismatch?: string;
  missed?: true;
};

async function loop(i: number, source: Source, payer: Address): Promise<Row> {
  const amount = 10_000n * BigInt(i + 1); // 0.01, 0.02, … USDC: distinct per run
  const before = await base.readContract({ address: BOOK.address, abi: annalBookAbi, functionName: "lineCount", args: [owner] });
  const [baseFrom, lasnaFrom] = await Promise.all([base.getBlockNumber(), lasna.getBlockNumber()]);

  const out = await cast([
    "send",
    source.usdc,
    "transfer(address,uint256)",
    owner,
    amount.toString(),
    "--rpc-url",
    source.rpc,
    "--json",
  ]);
  const receiptAt = Date.now();
  const receipt = JSON.parse(out) as { status: string; transactionHash: Hex; blockNumber: Hex; logs: { address: string; topics: Hex[]; data: Hex; logIndex: Hex }[] };
  if (BigInt(receipt.status) !== 1n) throw new Error(`run ${i}: transfer reverted (${receipt.transactionHash})`);

  // The USDC Transfer log to the owner in the receipt cast returned (RPC form: hex fields).
  const transfer = receipt.logs.find((l) => {
    if (l.address.toLowerCase() !== source.usdc.toLowerCase()) return false;
    try {
      const ev = decodeEventLog({ abi: erc20Abi, topics: l.topics as [Hex, ...Hex[]], data: l.data });
      return ev.eventName === "Transfer" && getAddress(ev.args.to) === owner;
    } catch {
      return false;
    }
  });
  if (!transfer) throw new Error(`run ${i}: no USDC Transfer to the book owner in ${receipt.transactionHash}`);
  const logIndex = Number(transfer.logIndex);
  const originBlock = BigInt(receipt.blockNumber);
  const originAt = Number((await retry(() => origin.get(source.chainId)!.getBlock({ blockNumber: originBlock }))).timestamp);

  const row: Row = {
    run: i,
    chain: source.key,
    amount: amount.toString(),
    originTx: receipt.transactionHash,
    originBlock: originBlock.toString(),
    originAt,
    reactiveTx: null,
    reactiveAt: null,
    callbackTx: null,
    callbackBlock: null,
    writtenAt: null,
    delaySec: null,
    baseBlocks: null,
    seenAfterMs: null,
    index: null,
    fieldsMatch: null,
  };

  // Wait for the line to be readable from the book.
  let count = before;
  while (count <= before) {
    if (Date.now() - receiptAt > timeoutSec * 1000) return { ...row, missed: true };
    await sleep(400);
    count = await base.readContract({ address: BOOK.address, abi: annalBookAbi, functionName: "lineCount", args: [owner] });
  }
  row.seenAfterMs = Date.now() - receiptAt;
  row.index = Number(before);

  const line = await base.readContract({ address: BOOK.address, abi: annalBookAbi, functionName: "lineAt", args: [owner, before] });
  row.writtenAt = Number(line.writtenAt);
  row.delaySec = row.writtenAt - originAt;

  const expect: [string, unknown, unknown][] = [
    ["originChainId", line.originChainId, BigInt(source.chainId)],
    ["token", line.token.toLowerCase(), source.usdc.toLowerCase()],
    ["payer", getAddress(line.payer), payer],
    ["amount", line.amount, amount],
    ["originTxHash", line.originTxHash.toLowerCase(), receipt.transactionHash.toLowerCase()],
    ["logIndex", line.logIndex, BigInt(logIndex)],
    ["originBlock", line.originBlock, originBlock],
  ];
  // viem decodes small uints as number and large ones as bigint: compare canonical strings.
  const norm = (v: unknown) => (typeof v === "bigint" || typeof v === "number" ? BigInt(v).toString() : String(v).toLowerCase());
  const bad = expect.filter(([, got, want]) => norm(got) !== norm(want));
  row.fieldsMatch = bad.length === 0;
  if (bad.length) row.mismatch = bad.map(([k, got, want]) => `${k}: book ${String(got)} ≠ origin ${String(want)}`).join("; ");

  // The callback that wrote it, on Base Sepolia.
  const written = await base.getLogs({
    address: BOOK.address,
    event: annalBookAbi.find((x) => x.type === "event" && x.name === "LineWritten")!,
    args: { owner, index: before },
    fromBlock: baseFrom,
    toBlock: await base.getBlockNumber(),
  });
  if (written[0]) {
    row.callbackTx = written[0].transactionHash;
    row.callbackBlock = written[0].blockNumber.toString();
    if (source.key === "base") row.baseBlocks = Number(written[0].blockNumber - originBlock);
  }

  // The reactive transaction that read it, on Lasna.
  const copied = await lasna.getLogs({
    address: REACTIVE.address,
    event: annalReactiveAbi.find((x) => x.type === "event" && x.name === "Copied")!,
    args: { owner, originChainId: BigInt(source.chainId) },
    fromBlock: lasnaFrom,
    toBlock: await lasna.getBlockNumber(),
  });
  const match = copied.find((l) => BigInt(l.args.originTxHash ?? 0n) === BigInt(receipt.transactionHash) && Number(l.args.logIndex) === logIndex);
  if (match) {
    row.reactiveTx = match.transactionHash;
    row.reactiveAt = Number((await retry(() => lasna.getBlock({ blockNumber: match.blockNumber }))).timestamp);
  }
  return row;
}

// ---------- summary ----------

function stats(xs: number[]) {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const q = (p: number) => s[Math.min(s.length - 1, Math.ceil(p * s.length) - 1)];
  const mid = Math.floor(s.length / 2);
  return { n: s.length, min: s[0], median: s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2, p90: q(0.9), max: s[s.length - 1] };
}

function summarise(rows: Row[]) {
  const by = (rs: Row[]) => ({
    sent: rs.length,
    printed: rs.filter((r) => !r.missed).length,
    missed: rs.filter((r) => r.missed).length,
    fieldsMatch: rs.filter((r) => r.fieldsMatch).length,
    delaySec: stats(rs.filter((r) => r.delaySec !== null).map((r) => r.delaySec!)),
    seenAfterMs: stats(rs.filter((r) => r.seenAfterMs !== null).map((r) => r.seenAfterMs!)),
  });
  return {
    all: by(rows),
    ...Object.fromEntries(chains.map((c) => [c.key, by(rows.filter((r) => r.chain === c.key))])),
    baseBlocks: stats(rows.filter((r) => r.baseBlocks !== null).map((r) => r.baseBlocks!)),
  };
}

// ---------- main ----------

async function main() {
  const payer = getAddress(await cast(["wallet", "address"]));
  const opened = await base.readContract({ address: BOOK.address, abi: annalBookAbi, functionName: "openedAt", args: [owner] });
  if (opened === 0n) throw new Error(`${owner} has no open book: open it first, or the payments will never print.`);

  const startedAt = new Date();
  const stamp = startedAt.toISOString().replace(/[:.]/g, "-");
  const dir = new URL("../docs/evidence/harness/", import.meta.url);
  await mkdir(dir, { recursive: true });
  const file = new URL(`latency-${stamp}.json`, dir);

  console.log(`Harness: ${runs} payments to ${owner} from ${payer}, chains ${chains.map((c) => c.key).join(" → ")}`);
  const rows: Row[] = [];
  const save = () =>
    writeFile(
      file,
      JSON.stringify({ startedAt: startedAt.toISOString(), owner, payer, book: BOOK.address, reactive: REACTIVE.address, runs, rows, summary: summarise(rows) }, null, 2) + "\n",
    );

  for (let i = 0; i < runs; i++) {
    const source = chains[i % chains.length];
    let row: Row;
    try {
      row = await loop(i, source, payer);
    } catch (e) {
      console.error(`run ${i} (${source.key}) failed before measuring: ${(e as Error).message}`);
      await save();
      throw e;
    }
    rows.push(row);
    await save(); // after every run, so an interrupted run keeps its evidence
    console.log(
      row.missed
        ? `#${i} ${source.key.padEnd(8)} MISSED after ${timeoutSec}s  origin ${row.originTx}`
        : `#${i} ${source.key.padEnd(8)} ${row.delaySec}s by block time${row.baseBlocks !== null ? ` (${row.baseBlocks} Base blocks)` : ""}, seen ${(row.seenAfterMs! / 1000).toFixed(1)}s after receipt, fields ${row.fieldsMatch ? "match" : `MISMATCH ${row.mismatch}`}`,
    );
  }

  console.log("\nSummary (delay = line writtenAt − origin block timestamp, seconds):");
  console.log(JSON.stringify(summarise(rows), null, 2));
  console.log(`\nEvidence: ${file.pathname}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
