// Runs in the reader's browser: for each line, fetch the origin transaction's receipt from that
// chain's own public RPC and compare the log at the line's log index with what the book says.
// Nothing here goes through Annal's server, so the check doesn't depend on trusting it.

import { createPublicClient, getAddress, http, type Hex, type PublicClient } from "viem";
import { SOURCES, sourceByChainId } from "./annal";
import type { BookLine } from "./book";

export type CheckState =
  | { state: "checking" }
  | { state: "checked"; chainName: string; originAt: number }
  | { state: "mismatch"; chainName: string; reason: string }
  | { state: "unchecked"; chainName: string; reason: string };

const TRANSFER = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

const clients = new Map<number, PublicClient>();
function clientFor(chainId: number): PublicClient | undefined {
  const source = sourceByChainId(chainId);
  if (!source) return undefined;
  let c = clients.get(chainId);
  if (!c) {
    c = createPublicClient({ transport: http(source.rpc, { timeout: 10_000, retryCount: 1 }) }) as PublicClient;
    clients.set(chainId, c);
  }
  return c;
}

const topicToAddress = (topic: Hex | undefined) => (topic ? getAddress(`0x${topic.slice(26)}`) : undefined);

export async function checkLine(owner: string, line: BookLine): Promise<CheckState> {
  const source = sourceByChainId(line.originChainId);
  const chainName = source?.name ?? `chain ${line.originChainId}`;
  const client = clientFor(line.originChainId);
  if (!source || !client) {
    return { state: "mismatch", chainName, reason: `${chainName} isn't one of this book's sources.` };
  }

  let receipt;
  try {
    receipt = await client.getTransactionReceipt({ hash: line.originTxHash });
  } catch {
    return { state: "unchecked", chainName, reason: `Couldn't reach ${chainName} from your browser.` };
  }

  if (receipt.status !== "success") {
    return { state: "mismatch", chainName, reason: "The origin transaction did not succeed." };
  }
  if (receipt.blockNumber.toString() !== line.originBlock) {
    return { state: "mismatch", chainName, reason: `The transaction is in block ${receipt.blockNumber}, not ${line.originBlock}.` };
  }
  const log = receipt.logs.find((l) => l.logIndex === line.logIndex);
  if (!log) {
    return { state: "mismatch", chainName, reason: `The transaction has no log #${line.logIndex}.` };
  }
  if (log.address.toLowerCase() !== source.usdc.toLowerCase()) {
    return { state: "mismatch", chainName, reason: `Log #${line.logIndex} wasn't emitted by Circle's USDC.` };
  }
  if (log.topics[0] !== TRANSFER) {
    return { state: "mismatch", chainName, reason: `Log #${line.logIndex} isn't a Transfer.` };
  }
  const from = topicToAddress(log.topics[1]);
  const to = topicToAddress(log.topics[2]);
  if (from !== getAddress(line.payer)) {
    return { state: "mismatch", chainName, reason: `The payment came from ${from}, not ${line.payer}.` };
  }
  if (to !== getAddress(owner)) {
    return { state: "mismatch", chainName, reason: `The payment went to ${to}, not this wallet.` };
  }
  if (BigInt(log.data) !== BigInt(line.amount)) {
    return { state: "mismatch", chainName, reason: "The amount in the log differs from the line." };
  }
  let originAt = 0;
  try {
    const block = await client.getBlock({ blockNumber: receipt.blockNumber });
    originAt = Number(block.timestamp);
  } catch {
    // The match stands without the timestamp; the line just won't show its print delay.
  }
  return { state: "checked", chainName, originAt };
}

/** The chains a reader's browser will contact, for the page's own disclosure. */
export const CHECK_RPCS = SOURCES.map((s) => ({ name: s.name, rpc: s.rpc }));
