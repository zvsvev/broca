export const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID ?? "broca.testnet";
export const NETWORK = (import.meta.env.VITE_NETWORK ?? "testnet") as "testnet" | "mainnet";
export const RPC_URL = import.meta.env.VITE_RPC_URL ?? "https://rpc.testnet.near.org";

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
