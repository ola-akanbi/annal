import { USDC_DECIMALS } from "./annal";

/** 0xa7D5…7444 */
export function shortHex(value: string, head = 4, tail = 4): string {
  if (value.length <= 2 + head + tail + 1) return value;
  return `${value.slice(0, 2 + head)}…${value.slice(-tail)}`;
}

/**
 * How many decimals the whole roll needs so every amount aligns on one decimal tab:
 * at least 2 (receipt convention), more only when some amount has sub-cent precision.
 */
export function decimalsFor(amounts: readonly string[]): number {
  let need = 2;
  for (const raw of amounts) {
    const frac = BigInt(raw) % 10n ** BigInt(USDC_DECIMALS);
    if (frac === 0n) continue;
    const digits = frac.toString().padStart(USDC_DECIMALS, "0").replace(/0+$/, "");
    need = Math.max(need, digits.length);
  }
  return need;
}

/** USDC base units (string) → "1,234.50" with exactly `decimals` places. Never via float. */
export function formatUsdc(raw: string, decimals = 2): string {
  const v = BigInt(raw);
  const base = 10n ** BigInt(USDC_DECIMALS);
  const whole = v / base;
  const frac = (v % base).toString().padStart(USDC_DECIMALS, "0").slice(0, decimals);
  const wholeStr = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decimals > 0 ? `${wholeStr}.${frac}` : wholeStr;
}

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const timeFmt = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

/** Unix seconds → "19 Nov 2026" */
export function formatDate(unix: number): string {
  return dateFmt.format(new Date(unix * 1000));
}

/** Unix seconds → "22:06:34 UTC" */
export function formatTime(unix: number): string {
  return `${timeFmt.format(new Date(unix * 1000))} UTC`;
}

/** Unix seconds → ISO, for <time dateTime>. */
export function iso(unix: number): string {
  return new Date(unix * 1000).toISOString();
}

/** No. 007 */
export function lineNumber(index: number): string {
  return `No. ${String(index + 1).padStart(3, "0")}`;
}
