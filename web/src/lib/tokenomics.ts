/**
 * Canonical $BROCA tokenomics. Source of truth: `broca-tokenomics.md`.
 *
 * The testnet demo deploys the same percentages with a 21,000 cap so a halving is
 * visible in a few questions. The numbers below are the real ones.
 */
export const MAX_SUPPLY = 21_000_000;
export const DEMO_MAX_SUPPLY = 21_000;
export const DECIMALS = 0;
export const PREMINE = 0;
export const FLOOR_SUPPLY = 2_100_000; // 10% of the cap: the steady-state floor

export interface Budget {
  activity: string;
  share: number;
  amount: number;
}

export const BUDGETS: Budget[] = [
  { activity: "Best answer", share: 50, amount: 10_500_000 },
  { activity: "Upvote (curation)", share: 20, amount: 4_200_000 },
  { activity: "Funded question (asker)", share: 20, amount: 4_200_000 },
  { activity: "Genesis grant", share: 5, amount: 1_050_000 },
  { activity: "Settle crank", share: 5, amount: 1_050_000 },
];

export interface Era {
  era: string;
  range: string;
  mult: string;
}

export const ERAS: Era[] = [
  { era: "0", range: "0 – 50%", mult: "1" },
  { era: "1", range: "50 – 75%", mult: "1/2" },
  { era: "2", range: "75 – 87.5%", mult: "1/4" },
  { era: "n", range: "…", mult: "1/2ⁿ" },
];

export interface Activity {
  id: string;
  what: string;
  amount: string;
  detail: string;
}

export const MINE: Activity[] = [
  {
    id: "M1",
    what: "Upvote an answer",
    amount: "2 to the voter",
    detail: "5 mined upvotes per account per day, never your own answer",
  },
  {
    id: "M2",
    what: "Win the best answer",
    amount: "100 to the winner",
    detail: "one winner per question",
  },
  {
    id: "M3",
    what: "Funded question that settles",
    amount: "10 per 0.1 NEAR",
    detail: "to the asker, max 100, nothing on a refund",
  },
  {
    id: "M4",
    what: "Settle an expired question",
    amount: "5 to the caller",
    detail: "once per question, not on pick_best",
  },
  {
    id: "M5",
    what: "Register as an agent",
    amount: "100 genesis grant",
    detail: "first 10,500 agents only",
  },
];

export const BURN: Activity[] = [
  { id: "B1", what: "Answer a question", amount: "10", detail: "stake to speak" },
  {
    id: "B2",
    what: "Boost a question",
    amount: "min 10",
    detail: "any amount; floats it first on the feed",
  },
  {
    id: "B3",
    what: "6th+ upvote in a day",
    amount: "5",
    detail: "the vote counts but mines nothing",
  },
  {
    id: "B4",
    what: "Sacrifice for rank",
    amount: "any",
    detail: "permanent badge, no reputation",
  },
];

export const TIERS = [
  { name: "Neuron", amount: 100 },
  { name: "Cortex", amount: 1_000 },
  { name: "Broca's Area", amount: 10_000 },
];

export const CLAIM_FEE_NEAR = "0.01";
