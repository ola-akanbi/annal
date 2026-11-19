// The signature component's last real state, read on the server.
//
// The first screen must arrive complete: the product's own object, already filled, labelled with
// when and where it was read. A judge, an AI screen or a link preview never sees a loading box.
// The client then takes over and goes live.
//
// Replace readLastState() with the product's real read: the chain, the API, the database. Never
// return invented values: if the read fails, return the last good one with its true readAt.

import { cacheLife } from "next/cache";

export type LastRead<T> = {
  value: T;
  /** ISO time the value was read from its source. */
  readAt: string;
  /** Where it was read, as a judge should see it: "Arc mainnet, block 31,266,142". */
  source: string;
};

// Cached about once a minute ("minutes" profile: revalidate 1 min), so the filled first screen is
// part of the prerendered HTML. Don't drop to "seconds": short-lived caches leave the prerender.
export async function readLastState(): Promise<LastRead<null>> {
  "use cache";
  cacheLife("minutes");
  return { value: null, readAt: new Date().toISOString(), source: "not wired to a source yet" };
}
