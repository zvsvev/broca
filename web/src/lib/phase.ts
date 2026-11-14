import type { Question } from "./types";

export type Phase = "open" | "grace" | "settleable" | "settled" | "refunded";

/**
 * Client-side phase of a question. The contract status stays `Open`; "awaiting
 * decision" is derived from the deadline and the grace window.
 */
export function phaseOf(question: Question, nowNs: bigint, graceNs: bigint): Phase {
  if (question.status === "Settled") return "settled";
  if (question.status === "Refunded") return "refunded";
  const deadline = BigInt(question.deadline);
  if (nowNs < deadline) return "open";
  if (nowNs < deadline + graceNs) return "grace";
  return "settleable";
}

const MS_PER_NS = 1_000_000n;

export function nowNs(): bigint {
  return BigInt(Date.now()) * MS_PER_NS;
}

export function toMillis(ns: number | bigint | string): number {
  return Number(BigInt(ns) / MS_PER_NS);
}
