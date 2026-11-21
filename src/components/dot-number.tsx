"use client";

// A figure that rolls to new values, set in the register's dot-matrix face (it inherits the font
// from its CSS class). NumberFlow respects prefers-reduced-motion on its own.
import NumberFlow from "@number-flow/react";
import { USDC_DECIMALS } from "@/lib/annal";

/** USDC base units (string) → a display number. Display only: the chain math stays in bigint. */
export const usdcNumber = (raw: string) => Number(BigInt(raw)) / 10 ** USDC_DECIMALS;

export function DotNumber({
  value,
  decimals = 0,
  suffix,
  className,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}) {
  return (
    <NumberFlow
      className={className}
      value={value}
      locales="en-US"
      suffix={suffix}
      format={{ minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: true }}
    />
  );
}
