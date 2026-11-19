import { isAddress, isHex } from "viem";
import { readLineTrail } from "@/lib/book";

// One line's trail: the Lasna reactive transaction that read the payment and the Base Sepolia
// callback that wrote it. A written line never changes, so readLineTrail caches the answer.
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const owner = q.get("owner") ?? "";
  const tx = q.get("tx") ?? "";
  const index = Number(q.get("index"));
  const chain = Number(q.get("chain"));
  const log = Number(q.get("log"));
  const at = Number(q.get("at"));
  if (!isAddress(owner) || !isHex(tx) || tx.length !== 66 || ![index, chain, log, at].every(Number.isSafeInteger)) {
    return Response.json({ error: "Malformed trail request." }, { status: 400 });
  }
  try {
    const trail = await readLineTrail(owner, index, chain, tx, log, at);
    return Response.json(trail);
  } catch {
    return Response.json({ error: "Couldn't reach Lasna or Base Sepolia to trace this line." }, { status: 502 });
  }
}
