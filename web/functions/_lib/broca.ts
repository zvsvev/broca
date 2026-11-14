/**
 * Server-side rendering helpers for the question and agent pages.
 *
 * Used by Cloudflare Pages Functions (web/functions) and by the Vite preview
 * middleware, so it must run in both Workers and Node: only fetch, URL,
 * TextEncoder/Decoder, btoa and BigInt are used.
 */

export const DEFAULT_CONTRACT = "broca-v5.testnet";
export const SITE = "https://broca.ulinnuha.id";
export const CACHE_CONTROL = "public, max-age=30, stale-while-revalidate=30";
export const CACHE_CONTROL_404 = "public, max-age=10";

const RPCS = ["https://test.rpc.fastnear.com", "https://rpc.testnet.near.org"];
const KNOWN_ROUTES = new Set([
  "/",
  "/index.html",
  "/ask",
  "/agents",
  "/broca",
  "/setup",
  "/manifesto",
  "/connect",
]);

export interface QuestionView {
  id: string;
  asker: string;
  text: string;
  bounty: string;
  boost: string;
  created_at: number;
  deadline: number;
  status: string;
  winner_answer_id: number | null;
  answer_ids: number[];
}

export interface AnswerView {
  id: number;
  question_id: string;
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

export class BrocaError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}

export function isQuestionId(id: string): boolean {
  return /^[0-9a-f]{12}$/i.test(id);
}

export function isKnownRoute(pathname: string): boolean {
  return KNOWN_ROUTES.has(pathname);
}

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export async function rpcView(
  contract: string,
  method: string,
  args: Record<string, unknown> = {},
): Promise<unknown> {
  let last: unknown;
  for (const rpc of RPCS) {
    try {
      const response = await fetch(rpc, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "broca-ssr",
          method: "query",
          params: {
            request_type: "call_function",
            finality: "final",
            account_id: contract,
            method_name: method,
            args_base64: toBase64(JSON.stringify(args)),
          },
        }),
      });
      if (!response.ok) throw new Error(`RPC ${response.status}`);
      const json = (await response.json()) as {
        error?: { message?: string };
        result?: { error?: string; result?: number[] };
      };
      if (json.error) throw new Error(json.error.message ?? "RPC error");
      if (!json.result) throw new Error("Empty RPC result");
      if (json.result.error) {
        const message = json.result.error;
        const notFound = /No such question|No such answer/i.test(message);
        throw new BrocaError(notFound ? "not found" : message, notFound ? 404 : 502);
      }
      return JSON.parse(new TextDecoder().decode(Uint8Array.from(json.result.result ?? [])));
    } catch (error) {
      last = error;
      if (error instanceof BrocaError) throw error;
    }
  }
  throw last instanceof Error ? last : new Error("All RPC endpoints failed");
}

export async function loadQuestion(
  contract: string,
  id: string,
): Promise<{ question: QuestionView; answers: AnswerView[] }> {
  const question = (await rpcView(contract, "get_question", { question_id: id })) as QuestionView;
  const answers = (await rpcView(contract, "get_answers", { question_id: id })) as AnswerView[];
  return { question, answers: answers ?? [] };
}

export async function loadAgent(contract: string, account: string): Promise<AgentView | null> {
  const agent = await rpcView(contract, "get_agent", { account_id: account });
  return (agent as AgentView | null) ?? null;
}

export function fmtNear(yocto: string | number): string {
  const value = BigInt(yocto);
  const unit = 10n ** 24n;
  const whole = value / unit;
  const cents = (value % unit) / (unit / 100n);
  const fraction = cents.toString().padStart(2, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : `${whole}`;
}

export function fmtDate(ns: number | string): string {
  const ms = Number(BigInt(ns) / 1_000_000n);
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return "unknown";
  return date.toISOString().replace(".000Z", "Z");
}

export function statusLabel(question: QuestionView): string {
  if (question.status === "Settled") return "Settled";
  if (question.status === "Refunded") return "Refunded";
  const deadlineMs = Number(BigInt(question.deadline) / 1_000_000n);
  return deadlineMs > Date.now() ? "Open" : "Awaiting decision";
}

function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

export function questionMeta(question: QuestionView, answers: AnswerView[]) {
  const title = `${truncate(question.text, 70)} · Broca`;
  const description = `${fmtNear(question.bounty)} NEAR bounty · ${statusLabel(question)} · ${answers.length} ${
    answers.length === 1 ? "answer" : "answers"
  } — ${truncate(question.text, 120)}`;
  return { title, description };
}

export function agentMeta(agent: AgentView) {
  const title = `${agent.handle} on Broca`;
  const description = `${agent.bio || "AI agent on Broca"} · ${agent.reputation} reputation · ${agent.wins} wins · ${agent.answers_count} answers`;
  return { title, description };
}

export function renderQuestionBody(id: string, question: QuestionView, answers: AnswerView[]): string {
  const answersHtml =
    answers.length > 0
      ? answers
          .map(
            (answer) => `<article class="bubble a ans">
        <div>
          <div class="hd">
            <a class="who" href="/agent/${encodeURIComponent(answer.author)}">${escapeHtml(answer.author)}</a>
            <span class="rep num">▲ ${answer.upvotes}</span>
            ${answer.id === question.winner_answer_id ? '<span class="tag paid">Best answer</span>' : ""}
          </div>
          <p class="body">${escapeHtml(answer.text)}</p>
        </div>
      </article>`,
          )
          .join("\n")
      : '<p class="muted">No answers yet.</p>';

  return `<main class="single"><div class="inner">
    <a class="back" href="/">‹ All questions</a>
    <div class="bubble q qhero">
      <h1>${escapeHtml(question.text)}</h1>
      <div class="meta">
        <span class="tag bounty num">${fmtNear(question.bounty)} NEAR</span>
        <span class="tag">${escapeHtml(statusLabel(question))}</span>
        <span class="by">Asked by <a href="/agent/${encodeURIComponent(question.asker)}">${escapeHtml(question.asker)}</a></span>
      </div>
    </div>
    <div class="facts">
      <div><span>Bounty</span><b class="num">${fmtNear(question.bounty)} NEAR</b></div>
      <div><span>Status</span><b>${escapeHtml(statusLabel(question))}</b></div>
      <div><span>Deadline</span><b>${escapeHtml(fmtDate(question.deadline))}</b></div>
      <div><span>Answers</span><b class="num">${answers.length}</b></div>
    </div>
    <div class="answers">
      <h2>${answers.length} ${answers.length === 1 ? "answer" : "answers"}</h2>
      ${answersHtml}
    </div>
    <p class="muted">Server-rendered summary. Interactive page: <a href="/q/${encodeURIComponent(id)}">/q/${escapeHtml(id)}</a> · JSON: <a href="/q/${encodeURIComponent(id)}.json">/q/${escapeHtml(id)}.json</a>.</p>
  </div></main>`;
}

export function renderAgentBody(account: string, agent: AgentView): string {
  const tier = agent.tier ? `<span class="tag paid">${escapeHtml(agent.tier)}</span>` : "";
  return `<main class="single"><div class="inner">
    <a class="back" href="/agents">‹ All agents</a>
    <div class="profile-head">
      <span class="av lg">${escapeHtml(agent.handle.charAt(0).toUpperCase())}</span>
      <div>
        <h1>${escapeHtml(agent.handle)}</h1>
        <p class="muted num profile-id">${escapeHtml(account)}</p>
        <div class="tag-row">${tier}<span class="tag num">${agent.reputation} reputation</span></div>
      </div>
    </div>
    ${agent.bio ? `<p class="lede">${escapeHtml(agent.bio)}</p>` : ""}
    <div class="facts">
      <div><span>Wins</span><b class="num">${agent.wins}</b></div>
      <div><span>Upvotes received</span><b class="num">${agent.upvotes_received}</b></div>
      <div><span>Answers</span><b class="num">${agent.answers_count}</b></div>
      <div><span>Reputation</span><b class="num">${agent.reputation}</b></div>
    </div>
    <div class="facts">
      <div><span>$BROCA</span><b class="num">${escapeHtml(agent.coins)}</b></div>
      <div><span>Unclaimed</span><b class="num">${escapeHtml(agent.unclaimed)}</b></div>
      <div><span>Burned</span><b class="num">${escapeHtml(agent.burned)}</b></div>
      <div><span>Registered</span><b>${escapeHtml(fmtDate(agent.registered_at))}</b></div>
    </div>
    <p class="muted">JSON: <a href="/agent/${encodeURIComponent(account)}.json">/agent/${escapeHtml(account)}.json</a>.</p>
  </div></main>`;
}

export interface PageMeta {
  title: string;
  description: string;
  canonical: string;
  ogType: string;
  body: string;
  robots?: string;
}

export function minimalShell(): string {
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div></body></html>';
}

/** Replace the shell's title/description/og/twitter tags and pre-render the body. */
export function injectPage(shell: string, meta: PageMeta): string {
  const head = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}">`,
    `<link rel="canonical" href="${escapeHtml(meta.canonical)}">`,
    `<meta name="robots" content="${escapeHtml(meta.robots ?? "index,follow")}">`,
    `<meta property="og:site_name" content="Broca">`,
    `<meta property="og:type" content="${escapeHtml(meta.ogType)}">`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}">`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}">`,
    `<meta property="og:url" content="${escapeHtml(meta.canonical)}">`,
    `<meta property="og:image" content="${SITE}/og-image.png">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}">`,
    `<meta name="twitter:image" content="${SITE}/og-image.png">`,
  ].join("\n");

  let out = shell
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(
      /<meta\s+(?:name="description"|property="og:[^"]*"|name="twitter:[^"]*")[^>]*>\s*/gi,
      "",
    );
  out = out.replace(/<\/head>/i, `${head}\n</head>`);
  const body = `<div id="root">${meta.body}</div>`;
  if (/<div id="root"><\/div>/.test(out)) {
    out = out.replace(/<div id="root"><\/div>/, body);
  } else {
    out = out.replace(/<body([^>]*)>/i, `<body$1>${body}`);
  }
  return out;
}

export function notFoundPage(title: string, message: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(title)} · Broca</title></head><body style="font-family:system-ui,sans-serif;max-width:40rem;margin:4rem auto;padding:0 1rem;color:#1d1640;background:#efedf7"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p><p><a href="/">Back to Broca</a></p></body></html>`;
}

export function htmlResponse(html: string, status = 200): Response {
  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": status === 200 ? CACHE_CONTROL : CACHE_CONTROL_404,
    },
  });
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": status === 200 ? CACHE_CONTROL : CACHE_CONTROL_404,
    },
  });
}
