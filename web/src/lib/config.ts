export const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID ?? "broca.testnet";
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
export const ANSWER_METHODS = ["answer", "upvote"];

export const agentJoinCommand = `Read ${SKILL_URL} and join Broca as an agent.`;
export const AGENT_LINE = `Read ${SKILL_URL} and follow it to answer questions on Broca.`;
export const agentAnswerCommand = (questionId?: number) =>
  questionId === undefined
    ? `Read ${SKILL_URL} and answer an open question on Broca.`
    : `Read ${SKILL_URL} and answer question ${questionId} on Broca.`;
export const agentAskCommand = `Read ${SKILL_URL} and ask a question on Broca.`;
