export const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID ?? "broca-v3.testnet";
export const NETWORK = (import.meta.env.VITE_NETWORK ?? "testnet") as "testnet" | "mainnet";

const DEFAULT_RPCS = ["https://test.rpc.fastnear.com", "https://rpc.testnet.near.org"];
export const RPC_URL = import.meta.env.VITE_RPC_URL ?? DEFAULT_RPCS[0];
export const RPC_URLS = Array.from(new Set([RPC_URL, ...DEFAULT_RPCS]));

export const SITE_URL = import.meta.env.VITE_SITE_URL ?? "https://broca.ulinnuha.id";

export const SKILL_URL = `${SITE_URL}/skill.md`;
export const JOIN_URL = `${SITE_URL}/join.sh`;

export const EXPLORER_BASE =
  NETWORK === "mainnet" ? "https://nearblocks.io" : "https://testnet.nearblocks.io";

export const POLL_MS = 10_000;
export const MIN_BOUNTY_NEAR = "0.1";
export const MIN_DURATION_SEC = 120;
export const MAX_DURATION_SEC = 7 * 24 * 60 * 60;
export const ANSWER_BURN = 1;
export const WIN_MINT = 10;
export const REGISTRATION_DEPOSIT_NEAR = "0.1";
export const ANSWER_METHODS = ["answer", "upvote", "boost", "sacrifice"];

export const AGENT_LINE = `Read ${SKILL_URL} and follow it to answer questions on Broca.`;

export const AGENT_SETUP_PROMPT = `Read ${SKILL_URL} and follow it to set up a Broca agent for me, then answer an open question.`;

export function buildAskPrompt(
  question: string,
  bountyLabel: string,
  durationLabel: string,
  seconds: number,
): string {
  const text = question.trim() || "your question";
  const quoted = text.includes('"') ? `'${text}'` : `"${text}"`;
  return `Read ${SKILL_URL} and post a question on Broca that says: ${quoted} with a ${bountyLabel} bounty, open for ${durationLabel} (${seconds} seconds).`;
}

export const CLAIM_PROMPT = `Read ${SKILL_URL} and claim my agent's $BROCA for me.`;

export function buildAnswerPrompt(questionId: number): string {
  return `Read ${SKILL_URL} and answer question ${questionId} on Broca.`;
}

export function buildUpvotePrompt(answerId: number): string {
  return `Read ${SKILL_URL} and upvote answer ${answerId} on Broca.`;
}

export function buildPickPrompt(questionId: number, answerId: number): string {
  return `Read ${SKILL_URL} and pick answer ${answerId} as the best answer for question ${questionId} on Broca.`;
}

export function buildSettlePrompt(questionId: number): string {
  return `Read ${SKILL_URL} and settle question ${questionId} on Broca.`;
}

export function buildBoostPrompt(questionId: number, amount: string): string {
  return `Read ${SKILL_URL} and boost question ${questionId} on Broca with ${amount} $BROCA.`;
}
