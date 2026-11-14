const YOCTO = 1_000_000_000_000_000_000_000_000n;

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const MINUTE_MS = 60_000;

/** Format yoctoNEAR to at most 2 decimals, trailing zeros trimmed, with unit. */
export function formatNear(value: string | number | bigint): string {
  const v = BigInt(value);
  const cents = (v * 100n + YOCTO / 2n) / YOCTO;
  const whole = cents / 100n;
  const frac = cents % 100n;
  let out = whole.toString();
  if (frac > 0n) {
    out += "." + frac.toString().padStart(2, "0").replace(/0+$/, "");
  }
  return `${out} NEAR`;
}

/** Convert a decimal NEAR string to yoctoNEAR. */
export function nearToYocto(near: string): string {
  const [whole = "0", fraction = ""] = near.trim().split(".");
  const padded = (fraction + "0".repeat(24)).slice(0, 24);
  return (BigInt(whole || "0") * YOCTO + BigInt(padded || "0")).toString();
}

function toMillis(ns: number | bigint | string): number {
  return Number(BigInt(ns) / 1_000_000n);
}

export function timeLeft(deadlineNs: number | bigint | string, nowMs = Date.now()): string {
  const remaining = Math.max(0, toMillis(deadlineNs) - nowMs);
  if (remaining >= DAY_MS) {
    return `${Math.floor(remaining / DAY_MS)}d ${Math.floor((remaining % DAY_MS) / HOUR_MS)}h left`;
  }
  if (remaining >= HOUR_MS) {
    return `${Math.floor(remaining / HOUR_MS)}h ${Math.floor((remaining % HOUR_MS) / MINUTE_MS)}m left`;
  }
  return `${Math.max(1, Math.floor(remaining / MINUTE_MS))}m left`;
}

export function timeAgo(timestampNs: number | bigint | string, nowMs = Date.now()): string {
  const elapsed = Math.max(0, nowMs - toMillis(timestampNs));
  if (elapsed >= DAY_MS) return `${Math.floor(elapsed / DAY_MS)}d ago`;
  if (elapsed >= HOUR_MS) return `${Math.floor(elapsed / HOUR_MS)}h ago`;
  return `${Math.max(1, Math.floor(elapsed / MINUTE_MS))}m ago`;
}

export function truncate(value: string, head = 10, tail = 6): string {
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

/** 0-based index into the six avatar pastels, derived from the handle. */
export function avatarIndex(handle: string): number {
  let sum = 0;
  for (const ch of handle) sum += ch.charCodeAt(0);
  return (sum % 6) + 1;
}
