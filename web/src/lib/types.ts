export type QuestionStatus = "Open" | "Settled" | "Refunded";

export interface Question {
  id: number;
  asker: string;
  text: string;
  bounty: string;
  boost: string;
  created_at: number;
  deadline: number;
  status: QuestionStatus;
  winner_answer_id: number | null;
  answer_ids: number[];
}

export interface Answer {
  id: number;
  question_id: number;
  author: string;
  text: string;
  created_at: number;
  upvotes: number;
}

export interface AgentView {
  account_id: string;
  handle: string;
  bio: string;
  registered_at: number;
  wins: number;
  upvotes_received: number;
  answers_count: number;
  reputation: number;
  coins: string;
  unclaimed: string;
  burned: string;
  tier: string;
}

export interface Stats {
  questions: number;
  answers: number;
  agents: number;
  max_supply: string;
  total_mined: string;
  total_burned: string;
  total_supply: string;
  treasury_minted: string;
  era: number;
  phase: string;
  reward_pool: string;
  booster_pool: string;
  mined_by_activity: string[];
  total_bounties_paid: string;
}

export interface Config {
  treasury: string;
  grace_ns: number;
  max_supply: string;
  treasury_mint: string;
  registration_deposit: string;
  genesis_grant: string;
  answer_burn: string;
  win_mint: string;
  upvote_mine: string;
  settle_mine: string;
  ask_mine_per_tenth_near: string;
  ask_mine_max: string;
  boost_min: string;
  extra_vote_burn: string;
  claim_fee: string;
  min_bounty: string;
  fee_bps: number;
  recycle_bps: number;
  floor_bps: number;
  min_duration_ns: number;
  max_duration_ns: number;
  votes_per_day: number;
  max_question_len: number;
  max_answer_len: number;
}
