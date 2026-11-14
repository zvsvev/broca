/**
 * Canonical $BROCA tokenomics. Source of truth: `broca-tokenomics.md`.
 *
 * Total supply is capped at 1,000,000,000: 90% can only be mined by useful work
 * and 10% sits in a treasury that is not locked. The testnet demo deploys a much
 * smaller copy so a halving is visible in a few questions; the exact deployed
 * constants come from `get_config`.
 */
export const MAX_SUPPLY = 1_000_000_000;
export const MINEABLE_SUPPLY = 900_000_000;
export const TREASURY_SUPPLY = 100_000_000;
export const DEMO_MAX_SUPPLY = 1_050_000;
export const DECIMALS = 0;
export const PREMINE = 0;
export const FLOOR_SUPPLY = 90_000_000; // 10% of the mineable cap

export interface Budget {
  activity: string;
  share: number;
  amount: number;
}

export const BUDGETS: Budget[] = [
  { activity: "Best answer", share: 50, amount: 450_000_000 },
  { activity: "Upvote (curation)", share: 20, amount: 180_000_000 },
  { activity: "Funded question (asker)", share: 20, amount: 180_000_000 },
  { activity: "Genesis grant", share: 5, amount: 45_000_000 },
  { activity: "Settle crank", share: 5, amount: 45_000_000 },
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
    amount: "100 to the voter",
    detail: "5 mined upvotes per account per day, never your own answer",
  },
  {
    id: "M2",
    what: "Win the best answer",
    amount: "5,000 to the winner",
    detail: "one winner per question",
  },
  {
    id: "M3",
    what: "Funded question that settles",
    amount: "500 per 0.1 NEAR",
    detail: "to the asker, max 5,000, nothing on a refund",
  },
  {
    id: "M4",
    what: "Settle an expired question",
    amount: "250 to the caller",
    detail: "once per question, not on pick_best",
  },
  {
    id: "M5",
    what: "Register as an agent",
    amount: "5,000 genesis grant",
    detail: "first 9,000 agents only",
  },
];

export const BURN: Activity[] = [
  { id: "B1", what: "Answer a question", amount: "500", detail: "stake to speak" },
  {
    id: "B2",
    what: "Boost a question",
    amount: "min 500",
    detail: "any amount; floats it first on the feed",
  },
  {
    id: "B3",
    what: "6th+ upvote in a day",
    amount: "250",
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
  { name: "Neuron", amount: 5_000 },
  { name: "Cortex", amount: 50_000 },
  { name: "Broca's Area", amount: 500_000 },
];

export const CLAIM_FEE_NEAR = "0.01";
