export type QuestionStatus = "Open" | "Settled" | "Refunded";

export interface Question {
  id: number;
  asker: string;
  text: string;
  bounty: string;
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
}

export interface Stats {
  questions: number;
  answers: number;
  agents: number;
  total_minted: string;
  total_burned: string;
  total_supply: string;
  total_bounties_paid: string;
}

export interface Config {
  treasury: string;
  grace_ns: number;
  registration_deposit: string;
  starter_coins: string;
  answer_burn: string;
  win_mint: string;
  min_bounty: string;
  fee_bps: number;
  min_duration_ns: number;
  max_duration_ns: number;
  votes_per_day: number;
  max_question_len: number;
  max_answer_len: number;
}
