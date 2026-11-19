// One vocabulary for the book's state, used by the rail, the feed strip and the empty roll alike.

import { SOURCES } from "@/lib/annal";
import type { BookState } from "@/lib/book";

export type WatchState = {
  kind: "unopened" | "waiting" | "watching" | "paused";
  dot: "live" | "idle" | "paused";
  /** The rail's one-line status. */
  status: string;
  /** The strip under the tear, where the next payment prints. */
  feed: string;
  emptyTitle: string;
  emptyBody: string;
  /** Extra honesty when Lasna couldn't be read. */
  note: string | null;
};

const CHAINS = `${SOURCES.slice(0, -1).map((s) => s.name).join(", ")} or ${SOURCES.at(-1)!.name}`;

export function watchState(book: BookState): WatchState {
  const lasnaUnknown = book.reactive.watching === null || book.reactive.debt === null;
  const note = lasnaUnknown ? "Couldn't reach Reactive Lasna just now, so the watcher's health isn't confirmed." : null;

  if (book.openedAt === 0) {
    return {
      kind: "unopened",
      dot: "idle",
      status: "No book opened for this wallet",
      feed: "No book here",
      emptyTitle: "This wallet hasn't opened a book.",
      emptyBody: "If it's yours, open one: Reactive Network starts printing its USDC payments within seconds.",
      note,
    };
  }
  if (book.reactive.debt !== null && BigInt(book.reactive.debt) > 0n) {
    return {
      kind: "paused",
      dot: "paused",
      status: "Paused: the watcher is out of funds",
      feed: "Paused · payments made now won't print",
      emptyTitle: "The watcher is paused.",
      emptyBody: "AnnalReactive owes Reactive Network fees, so it isn't reacting. Anyone can top it up to resume.",
      note,
    };
  }
  if (book.watchingSince === 0) {
    return {
      kind: "waiting",
      dot: "idle",
      status: "Opened · waiting for Reactive to confirm",
      feed: "Waiting for Reactive Network",
      emptyTitle: "Opened. Waiting for Reactive.",
      emptyBody: "Reactive Network confirms within a few seconds that it's watching this wallet on every chain.",
      note,
    };
  }
  return {
    kind: "watching",
    dot: "live",
    status: "Reactive is watching this wallet",
    feed: "Watching · the next payment prints here",
    emptyTitle: "Watching. Nothing printed yet.",
    emptyBody: `Send USDC to this wallet on ${CHAINS}; it prints here seconds after its block.`,
    note,
  };
}
