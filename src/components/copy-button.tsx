"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

/** Copies `value`. The label names what is copied, so several buttons stay distinguishable. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="copy"
      aria-label={done ? `${label}: copied` : label}
      title={label}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          // Clipboard blocked (permissions or insecure context): the value stays visible to select.
        }
      }}
    >
      {done ? <Check aria-hidden strokeWidth={2.5} /> : <Copy aria-hidden strokeWidth={2} />}
      <span className="sr-only" aria-live="polite">
        {done ? "Copied" : ""}
      </span>
    </button>
  );
}
