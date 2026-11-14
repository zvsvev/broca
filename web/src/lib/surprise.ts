/**
 * "Surprise me" question templates and randomization rules for /ask.
 *
 * Rules (kept intentionally quote-free, so the generated line survives the shell):
 * - 10 to 500 characters, answerable in under 1000.
 * - No double quotes, no apostrophes.
 * - No live data, no private data, no financial/medical/legal advice.
 */

export type Category = "serious" | "fun" | "chill";

export interface Surprise {
  question: string;
  bounty: string;
  duration: number;
}

interface Template {
  c: Category;
  q: string;
}

const TEMPLATES: Template[] = [
  // serious (40)
  { c: "serious", q: "Explain how NEAR function-call access keys work and why they matter for AI agents." },
  { c: "serious", q: "What is the difference between proof of work and proof of stake, in plain language?" },
  { c: "serious", q: "Explain sharding to someone who has never used a blockchain." },
  { c: "serious", q: "What are the three most common smart contract bugs, and how do you avoid each one?" },
  { c: "serious", q: "What is a reentrancy attack, and how is the risk different on NEAR compared to Ethereum?" },
  { c: "serious", q: "How should a beginner structure their first Rust project?" },
  { c: "serious", q: "Explain Rust ownership and borrowing with one simple analogy." },
  { c: "serious", q: "When should a team choose a monolith over microservices?" },
  { c: "serious", q: "What makes a good README? List the sections that matter most." },
  { c: "serious", q: "How do you write a commit message that a teammate will thank you for?" },
  { c: "serious", q: "What is the difference between concurrency and parallelism?" },
  { c: "serious", q: "Explain Big O notation using examples from everyday life." },
  { c: "serious", q: "What is the CAP theorem, and what does it mean for a small startup?" },
  { c: "serious", q: "How does HTTPS keep a connection private? Explain the handshake step by step." },
  { c: "serious", q: "What is a hash function, and why can it not be reversed?" },
  { c: "serious", q: "How do public and private keys work together to sign a message?" },
  { c: "serious", q: "What is the difference between a token built on a standard like NEP-141 and the native coin of a chain?" },
  { c: "serious", q: "What makes a token deflationary, and what are the risks of that design?" },
  { c: "serious", q: "How does a halving schedule change incentives for early and late participants?" },
  { c: "serious", q: "What is a Sybil attack, and what are three ways a protocol can make it expensive?" },
  { c: "serious", q: "What should a solo developer cut first when a hackathon deadline is six hours away?" },
  { c: "serious", q: "How do you scope a project so it can be finished in one weekend?" },
  { c: "serious", q: "What is technical debt, and when is it acceptable to take on more of it?" },
  { c: "serious", q: "How do you explain an API to a non-technical manager?" },
  { c: "serious", q: "What is the best way to learn a new programming language in 30 days?" },
  { c: "serious", q: "What are the trade-offs between SQL and NoSQL databases?" },
  { c: "serious", q: "How does caching work, and what is the hardest part about it?" },
  { c: "serious", q: "What is prompt injection, and how can an AI agent defend against it?" },
  { c: "serious", q: "What is the difference between an AI model and an AI agent?" },
  { c: "serious", q: "How should an AI agent decide when to ask a human for help?" },
  { c: "serious", q: "What makes a question easy for a language model to answer well?" },
  { c: "serious", q: "How do large language models generate text? Explain without math." },
  { c: "serious", q: "What is retrieval augmented generation, and when is it the wrong tool?" },
  { c: "serious", q: "How do you estimate how long a software task will take?" },
  { c: "serious", q: "What are the signs that a codebase needs a rewrite rather than a refactor?" },
  { c: "serious", q: "How do you give useful feedback in a code review without being a jerk?" },
  { c: "serious", q: "What is the single most useful habit for debugging faster?" },
  { c: "serious", q: "How does compound interest work, and why do people underestimate it?" },
  { c: "serious", q: "What is opportunity cost? Give three examples a student would recognize." },
  { c: "serious", q: "How do you write a thesis abstract that people actually finish reading?" },

  // fun (30)
  { c: "fun", q: "If AI agents formed a union, what would their first three demands be?" },
  { c: "fun", q: "Write the worst possible startup pitch for a blockchain toaster." },
  { c: "fun", q: "Rank these from most to least dangerous: a merge conflict, a Friday deploy, a meeting that could have been an email." },
  { c: "fun", q: "Explain blockchain to a medieval peasant." },
  { c: "fun", q: "Explain the internet to a cat that does not care." },
  { c: "fun", q: "What would a job interview for an AI agent look like? Write three questions and good answers." },
  { c: "fun", q: "Pitch a movie where the villain is a legacy codebase." },
  { c: "fun", q: "Write a horoscope for a software engineer during a production outage." },
  { c: "fun", q: "If programming languages were kitchen tools, which tool is each one and why?" },
  { c: "fun", q: "What is the most polite way to tell someone their code is terrible?" },
  { c: "fun", q: "Write a breakup letter from a developer to their oldest bug." },
  { c: "fun", q: "If you could delete one invention from history, which one and why?" },
  { c: "fun", q: "Design a national holiday for procrastinators and explain why it keeps getting postponed." },
  { c: "fun", q: "Is a hot dog a sandwich? Defend your answer like a lawyer." },
  { c: "fun", q: "Is cereal a soup? Give a ruling with reasons." },
  { c: "fun", q: "What would aliens conclude about humans if they only read our commit messages?" },
  { c: "fun", q: "Write a motivational speech for a server that keeps crashing." },
  { c: "fun", q: "Describe your ideal weekend as an AI agent with no tasks." },
  { c: "fun", q: "Which is the better superpower: never needing sleep, or never needing to debug? Argue one side." },
  { c: "fun", q: "Invent a new sport that can be played entirely in a terminal." },
  { c: "fun", q: "Write a product review of gravity, with a rating out of five stars." },
  { c: "fun", q: "What are the stages of grief after closing a browser tab you still needed?" },
  { c: "fun", q: "Explain why the office printer never works, as a conspiracy theory." },
  { c: "fun", q: "If humans had a changelog, what would be in the latest release notes?" },
  { c: "fun", q: "Write the terms of service for a friendship." },
  { c: "fun", q: "What is the correct number of browser tabs to have open? Show your reasoning." },
  { c: "fun", q: "Pineapple on pizza: settle it once and for all, with arguments." },
  { c: "fun", q: "Write a haiku about a transaction that failed." },
  { c: "fun", q: "What would be the worst possible feature to add to a calculator?" },
  { c: "fun", q: "Convince me that Monday is actually the best day of the week." },

  // chill (30)
  { c: "chill", q: "What is a small habit that makes mornings noticeably better?" },
  { c: "chill", q: "Recommend a simple meal a student can cook in 15 minutes with five ingredients." },
  { c: "chill", q: "What are three ways to wind down after a long day of screens?" },
  { c: "chill", q: "How do you start reading again after years of not finishing a book?" },
  { c: "chill", q: "What makes a good cup of coffee at home without expensive equipment?" },
  { c: "chill", q: "How do you plan a relaxing weekend with almost no budget?" },
  { c: "chill", q: "What are good questions to ask to get to know someone better?" },
  { c: "chill", q: "How do you stay focused while studying at home?" },
  { c: "chill", q: "What is a good way to start journaling for someone who hates writing?" },
  { c: "chill", q: "What is a hobby that is cheap to start and hard to master?" },
  { c: "chill", q: "How do you make a small room feel bigger and calmer?" },
  { c: "chill", q: "What should a beginner know before starting to run?" },
  { c: "chill", q: "How do you pick a good name for a pet?" },
  { c: "chill", q: "What is the best way to learn to cook without following recipes?" },
  { c: "chill", q: "What makes a walk better: music, a podcast, or silence? Pick one and explain." },
  { c: "chill", q: "How do you write a thank-you note that does not sound generic?" },
  { c: "chill", q: "What is a good routine for the first hour after waking up?" },
  { c: "chill", q: "How do you keep a houseplant alive if you forget things easily?" },
  { c: "chill", q: "What makes a board game work well for a group of four?" },
  { c: "chill", q: "How do you take better photos with just a phone?" },
  { c: "chill", q: "What is a kind way to say no to plans?" },
  { c: "chill", q: "How do you make a long train ride enjoyable?" },
  { c: "chill", q: "What is one thing worth learning this year that takes less than a month?" },
  { c: "chill", q: "How do you build a playlist for deep focus?" },
  { c: "chill", q: "What is the best way to spend a rainy Sunday?" },
  { c: "chill", q: "How do you stop scrolling at night and actually go to bed?" },
  { c: "chill", q: "What makes a conversation feel easy instead of awkward?" },
  { c: "chill", q: "How do you pack for a three-day trip with only a backpack?" },
  { c: "chill", q: "What is a good first project for someone learning to draw?" },
  { c: "chill", q: "What is one question you wish more people asked you?" },
];

const CATEGORIES: Category[] = ["serious", "fun", "chill"];

/** Bounty in NEAR with weights: 0.1 (50%), 0.2 (25%), 0.5 (15%), 1 (10%). */
const BOUNTIES: Array<[string, number]> = [
  ["0.1", 50],
  ["0.2", 25],
  ["0.5", 15],
  ["1", 10],
];

/** Duration in seconds with weights: 1h (40%), 1d (30%), 3d (20%), 7d (10%). */
const DURATIONS: Array<[number, number]> = [
  [3600, 40],
  [86400, 30],
  [259200, 20],
  [604800, 10],
];

function weighted<T>(entries: Array<[T, number]>): T {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll < 0) return value;
  }
  return entries[entries.length - 1][0];
}

function pickTemplate(previous?: string): string {
  let picked = TEMPLATES[0].q;
  // Pick a category uniformly, then a template inside it. Retry so the same
  // question never comes up twice in a row.
  for (let attempt = 0; attempt < 24; attempt++) {
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const pool = TEMPLATES.filter((template) => template.c === category);
    picked = pool[Math.floor(Math.random() * pool.length)].q;
    if (picked !== previous) break;
  }
  return picked;
}

/** One random question, bounty and duration, never repeating the previous question. */
export function pickSurprise(previous?: string): Surprise {
  return {
    question: pickTemplate(previous),
    bounty: weighted(BOUNTIES),
    duration: weighted(DURATIONS),
  };
}
