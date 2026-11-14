const YOCTO = 1_000_000_000_000_000_000_000_000n;

export function formatNear(yocto: string | number | bigint): string {
  const value = BigInt(yocto);
  const whole = value / YOCTO;
  const fraction = (value % YOCTO).toString().padStart(24, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : `${whole}`;
}

export function nearToYocto(near: string): string {
  const [whole, fraction = ""] = near.trim().split(".");
  const padded = (fraction + "0".repeat(24)).slice(0, 24);
  return (BigInt(whole || "0") * YOCTO + BigInt(padded || "0")).toString();
}

export function timeLeft(deadlineNs: number | string): string {
  const millis = Number(BigInt(deadlineNs) / 1_000_000n) - Date.now();
  if (millis <= 0) return "closed";
  const seconds = Math.floor(millis / 1000);
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m ${seconds % 60}s left`;
}

export function truncate(value: string, head = 8, tail = 6): string {
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}
