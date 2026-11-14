/** Extract a transaction hash from a wallet result, defensively. */
export function txHashOf(result: unknown): string | undefined {
  const seen = new Set<unknown>();

  const walk = (node: unknown): string | undefined => {
    if (!node || typeof node !== "object" || seen.has(node)) return undefined;
    seen.add(node);
    const record = node as Record<string, unknown>;
    if (typeof record.hash === "string") return record.hash;
    for (const value of Object.values(record)) {
      const found = walk(value);
      if (found) return found;
    }
    return undefined;
  };

  return walk(result);
}

function findSuccessValue(node: unknown, seen = new Set<unknown>()): string | undefined {
  if (!node || typeof node !== "object" || seen.has(node)) return undefined;
  seen.add(node);
  const record = node as Record<string, unknown>;
  if (typeof record.SuccessValue === "string") return record.SuccessValue;
  for (const value of Object.values(record)) {
    const found = findSuccessValue(value, seen);
    if (found) return found;
  }
  return undefined;
}

/** Read a u64 return value from a FunctionCall outcome, if present. */
export function returnedU64(result: unknown): number | undefined {
  const encoded = findSuccessValue(result);
  if (!encoded) return undefined;
  try {
    const text = atob(encoded);
    const parsed = JSON.parse(text) as unknown;
    const value = typeof parsed === "number" ? parsed : Number(parsed);
    return Number.isFinite(value) ? value : undefined;
  } catch {
    return undefined;
  }
}
