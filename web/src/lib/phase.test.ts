import { describe, expect, it } from "vitest";
import { phaseOf } from "./phase";
import type { Question } from "./types";

const GRACE = 120n * 1_000_000_000n; // 2 minutes in ns
const DEADLINE = 1_700_000_000_000_000_000n;

function question(status: Question["status"], deadline = DEADLINE): Question {
  return {
    id: 0,
    asker: "a.testnet",
    text: "q",
    bounty: "100000000000000000000000",
    boost: "0",
    created_at: 0,
    deadline: Number(deadline),
    status,
    winner_answer_id: null,
    answer_ids: [],
  };
}

describe("phaseOf", () => {
  it("is open before the deadline", () => {
    expect(phaseOf(question("Open"), DEADLINE - 1n, GRACE)).toBe("open");
  });

  it("is grace exactly at the deadline", () => {
    expect(phaseOf(question("Open"), DEADLINE, GRACE)).toBe("grace");
  });

  it("is grace inside the grace window", () => {
    expect(phaseOf(question("Open"), DEADLINE + GRACE - 1n, GRACE)).toBe("grace");
  });

  it("is settleable exactly at deadline + grace", () => {
    expect(phaseOf(question("Open"), DEADLINE + GRACE, GRACE)).toBe("settleable");
  });

  it("is settleable well past the grace window", () => {
    expect(phaseOf(question("Open"), DEADLINE + GRACE + 1_000_000_000n, GRACE)).toBe("settleable");
  });

  it("is settled regardless of time", () => {
    expect(phaseOf(question("Settled"), DEADLINE - 1n, GRACE)).toBe("settled");
    expect(phaseOf(question("Settled"), DEADLINE + GRACE, GRACE)).toBe("settled");
  });

  it("is refunded regardless of time", () => {
    expect(phaseOf(question("Refunded"), DEADLINE - 1n, GRACE)).toBe("refunded");
  });
});
