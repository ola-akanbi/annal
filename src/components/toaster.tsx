"use client";

import { CheckCircleIcon } from "@phosphor-icons/react";
import { Toaster } from "sonner";

/** Copy feedback, set on the app's ink cards. */
export function AppToaster() {
  return (
    <Toaster
      position="bottom-center"
      offset={20}
      icons={{ success: <CheckCircleIcon weight="fill" size={18} color="#F7C348" /> }}
      toastOptions={{
        className: "toast",
        style: {
          background: "#0E0E0E",
          color: "#FAF8F3",
          border: "1px solid #2c2c33",
          borderRadius: "14px",
          fontFamily: "var(--font-read)",
          fontWeight: 600,
          boxShadow: "0 18px 40px -16px rgb(14 14 14 / 0.6)",
        },
      }}
    />
  );
}
