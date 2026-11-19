import { isAddress } from "viem";
import { readBookLive } from "@/lib/book";

// The live read the statement polls. Uncached: it is the current state of the chain.
export async function GET(_req: Request, ctx: { params: Promise<{ address: string }> }) {
  const { address } = await ctx.params;
  if (!isAddress(address)) {
    return Response.json({ error: "That isn't a wallet address." }, { status: 400 });
  }
  try {
    const book = await readBookLive(address);
    return Response.json(book, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json(
      { error: "Couldn't read Base Sepolia just now. The book is unchanged on-chain; try again in a moment." },
      { status: 502, headers: { "cache-control": "no-store" } },
    );
  }
}
