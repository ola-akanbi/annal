"use client";

import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";

const preview = (v: string) => (v.length > 46 ? `${v.slice(0, 22)}…${v.slice(-18)}` : v);

/**
 * Copies `value` and confirms with a toast. `label` names what is copied (it is the button's
 * accessible name, so several copy buttons stay distinguishable); `what` titles the toast.
 */
export function CopyButton({ value, label, what = "Copied" }: { value: string; label: string; what?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="copy"
      aria-label={label}
      title={label}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
          toast.success(what, { description: preview(value) });
        } catch {
          toast.error("Couldn't copy", { description: "Your browser blocked the clipboard. Select the text instead." });
        }
      }}
    >
      {done ? <CheckIcon aria-hidden weight="bold" /> : <CopyIcon aria-hidden weight="bold" />}
    </button>
  );
}
