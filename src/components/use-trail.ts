"use client";

import { useEffect, useState } from "react";
import type { BookLine, LineTrail } from "@/lib/book";

// One request per line for the whole page: the row drawer and the inspector share it.
const cache = new Map<string, Promise<LineTrail | null>>();

function fetchTrail(owner: string, line: BookLine): Promise<LineTrail | null> {
  const key = `${owner}:${line.index}`;
  let p = cache.get(key);
  if (!p) {
    const q = new URLSearchParams({
      owner,
      index: String(line.index),
      chain: String(line.originChainId),
      tx: line.originTxHash,
      log: String(line.logIndex),
      at: String(line.writtenAt),
    });
    p = fetch(`/api/trail?${q}`)
      .then((r) => (r.ok ? (r.json() as Promise<LineTrail>) : null))
      .catch(() => null);
    p.then((t) => t === null && cache.delete(key)); // let a failed lookup be retried later
    cache.set(key, p);
  }
  return p;
}

export type TrailState = { status: "loading" } | { status: "ready"; trail: LineTrail } | { status: "error" };

/** The line's Lasna reactive tx and Base callback tx, fetched once `enabled` turns true. */
export function useTrail(owner: string, line: BookLine | undefined, enabled = true): TrailState {
  const [result, setResult] = useState<{ key: string; state: TrailState } | null>(null);
  const key = line ? `${owner}:${line.index}` : "";

  useEffect(() => {
    if (!enabled || !line) return;
    let cancelled = false;
    fetchTrail(owner, line).then((t) => {
      if (!cancelled) setResult({ key, state: t ? { status: "ready", trail: t } : { status: "error" } });
    });
    return () => {
      cancelled = true;
    };
  }, [owner, line, enabled, key]);

  return result && result.key === key ? result.state : { status: "loading" };
}
