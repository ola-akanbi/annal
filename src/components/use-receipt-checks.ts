"use client";

import { useEffect, useRef, useState } from "react";
import type { BookState } from "@/lib/book";
import { checkLine, type CheckState } from "@/lib/check";

const CONCURRENCY = 4;

/**
 * Checks every line against its origin receipt, in the reader's browser, four at a time.
 * A line is queued once; a live re-read that re-runs the effect never cancels checks in flight.
 */
export function useReceiptChecks(book: BookState): Record<number, CheckState> {
  const [checks, setChecks] = useState<Record<number, CheckState>>({});
  const queued = useRef(new Set<number>());
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    const pending = book.lines.filter((l) => !queued.current.has(l.index));
    if (pending.length === 0) return;
    pending.forEach((l) => queued.current.add(l.index));
    const queue = [...pending];
    const worker = async () => {
      while (queue.length > 0) {
        const line = queue.shift()!;
        const result = await checkLine(book.owner, line);
        if (mounted.current) setChecks((c) => ({ ...c, [line.index]: result }));
      }
    };
    for (let i = 0; i < CONCURRENCY; i++) void worker();
  }, [book.lines, book.owner]);

  return checks;
}
