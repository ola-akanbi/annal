"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BookState } from "@/lib/book";

const POLL_MS = 4_000;
const FAST_POLL_MS = 1_500;
const FAST_FOR_MS = 90_000;

/**
 * Starts from the server's read (so the first HTML is already the real book), then re-reads the
 * chain while the tab is visible. `fast` polls quicker for a while, e.g. right after opening.
 */
export function useLiveBook(initial: BookState, fast = false) {
  const [book, setBook] = useState(initial);
  const [fresh, setFresh] = useState<ReadonlySet<number>>(() => new Set());
  const [readError, setReadError] = useState<string | null>(null);
  const seen = useRef(new Set(initial.lines.map((l) => l.index)));

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/book/${initial.owner}`, { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Couldn't read the book.");
      const next = body as BookState;
      const arrived = next.lines.filter((l) => !seen.current.has(l.index)).map((l) => l.index);
      arrived.forEach((i) => seen.current.add(i));
      if (arrived.length > 0) setFresh((f) => new Set([...f, ...arrived]));
      setBook(next);
      setReadError(null);
    } catch (e) {
      setReadError(e instanceof Error ? e.message : "Couldn't read the book.");
    }
  }, [initial.owner]);

  useEffect(() => {
    const started = Date.now();
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;
    const tick = async () => {
      if (document.visibilityState === "visible") await poll();
      if (stopped) return;
      timer = setTimeout(tick, fast && Date.now() - started < FAST_FOR_MS ? FAST_POLL_MS : POLL_MS);
    };
    tick();
    const onVisible = () => {
      if (document.visibilityState === "visible") poll();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [poll, fast]);

  return { book, fresh, readError, refresh: poll };
}
