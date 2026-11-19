"use client";

import { useState } from "react";
import type { LastRead } from "@/lib/last-read";

// Client half: starts from the server's last read, then goes live.
// Subscribe or poll here and call setState with fresh reads; keep the "as of" label true.
export function SignatureLive<T>({ initial, label }: { initial: LastRead<T>; label: string }) {
  const [state] = useState(initial);

  return (
    <section aria-label="Signature component" className="mt-12 rounded-lg border border-current/15 p-6">
      <p className="text-base">
        {state.value === null
          ? "The signature component goes here: the product's own object, drawn in its domain's notation."
          : String(state.value)}
      </p>
      <p className="mt-4 text-sm opacity-70">
        <time dateTime={state.readAt}>{label}</time>
      </p>
    </section>
  );
}
