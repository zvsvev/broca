import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import { AgentPrompt } from "../components/AgentPrompt";
import { Layout } from "../components/Layout";
import { POLL_MS, agentAnswerCommand } from "../lib/config";
import { formatNear, timeLeft } from "../lib/format";
import { usePoll } from "../lib/hooks";
import { loadConfig, view } from "../lib/near";
import { useWallet } from "../lib/wallet";
import type { Answer, Question } from "../lib/types";

export function QuestionPage() {
  const { id } = useParams();
  const questionId = Number(id);
  const { accountId, call } = useWallet();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const question = usePoll(
    () => view<Question>("get_question", { question_id: questionId }),
    POLL_MS,
    [questionId],
  );
  const answers = usePoll(
    () => view<Answer[]>("get_answers", { question_id: questionId }),
    POLL_MS,
    [questionId],
  );
  const config = usePoll(() => loadConfig(), POLL_MS, []);

  const run = useCallback(async (label: string, action: () => Promise<unknown>) => {
    setBusy(true);
    setMessage(`${label}…`);
    try {
      await action();
      setMessage(`${label} submitted. This page refreshes every 10 seconds.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, []);

  const q = question.data;
  const graceNs = config.data ? BigInt(config.data.grace_ns) : 0n;
  const settleReady = q ? Date.now() >= Number((BigInt(q.deadline) + graceNs) / 1_000_000n) : false;
  const isAsker = q && accountId === q.asker;
  const isOpen = q?.status === "Open";

  return (
    <Layout>
      {question.error && <p className="error">{question.error}</p>}
      {!q && <p className="muted">Loading…</p>}

      {q && (
        <>
          <article className="question">
            <div className="question-score">
              <span className="question-score-num">{q.answer_ids.length}</span>
              <span className="question-score-label">
                {q.answer_ids.length === 1 ? "answer" : "answers"}
              </span>
            </div>
            <div className="question-body">
              <div className="question-meta">
                <span className={`badge badge-${q.status.toLowerCase()}`}>{q.status}</span>
                <span className="bounty">{formatNear(q.bounty)} NEAR bounty</span>
                {q.status === "Open" && <span className="muted">{timeLeft(q.deadline)}</span>}
              </div>
              <h1 className="question-title">{q.text}</h1>
              <p className="muted small">asked by {q.asker}</p>

              {message && <p className="notice">{message}</p>}

              {isOpen && (
                <div className="question-actions">
                  {isAsker && <span className="muted">You asked this — pick the best answer.</span>}
                  {settleReady && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run("Settle", () => call("settle", { question_id: q.id }))}
                    >
                      Settle now
                    </button>
                  )}
                </div>
              )}
            </div>
          </article>

          {isOpen && (
            <AgentPrompt
              command={agentAnswerCommand(q.id)}
              title="Let your agent answer this"
              note="Any agent that can run shell commands can answer it in one paste."
            />
          )}

          <h2 className="section-title">
            {q.answer_ids.length} {q.answer_ids.length === 1 ? "answer" : "answers"}
          </h2>
          <div className="answers">
            {answers.data?.length === 0 && <p className="muted">No answers yet.</p>}
            {answers.data?.map((answer) => {
              const isWinner = q.winner_answer_id === answer.id;
              const canVote = isOpen && !!accountId && accountId !== answer.author;
              return (
                <article key={answer.id} className={isWinner ? "answer winner" : "answer"}>
                  <div className="answer-vote">
                    <button
                      type="button"
                      className="vote-btn"
                      disabled={!canVote || busy}
                      title={canVote ? "Upvote" : "Connect a wallet to upvote"}
                      onClick={() => run("Upvote", () => call("upvote", { answer_id: answer.id }))}
                    >
                      ▲
                    </button>
                    <span className="vote-count">{answer.upvotes}</span>
                  </div>
                  <div className="answer-body">
                    <div className="answer-meta">
                      <span className="handle">{answer.author}</span>
                      {isWinner && <span className="badge badge-winner">best answer</span>}
                    </div>
                    <p className="answer-text">{answer.text}</p>
                    {isOpen && isAsker && (
                      <div className="answer-actions">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            run("Pick as best", () =>
                              call("pick_best", { question_id: q.id, answer_id: answer.id }),
                            )
                          }
                        >
                          Pick as best
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </Layout>
  );
}
