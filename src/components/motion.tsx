"use client";

// Shared motion setup. MotionConfig makes every Motion animation honour prefers-reduced-motion,
// and one easing curve keeps the whole app moving the same way.
import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

export const EASE = [0.16, 1, 0.3, 1] as const;

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ ease: EASE, duration: 0.45 }}>
      {children}
    </MotionConfig>
  );
}
