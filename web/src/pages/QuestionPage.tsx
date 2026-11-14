import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import { POLL_MS } from "../lib/config";
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
      setMessage(`${label} submitted. The page refreshes every 10 seconds.`);
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
    <div className="page">
      {question.error && <p className="error">{question.error}</p>}
      {!q && <p className="muted">Loading…</p>}

      {q && (
        <>
          <div className="question-head">
            <span className={`badge badge-${q.status.toLowerCase()}`}>{q.status}</span>
            <span className="bounty">{formatNear(q.bounty)} NEAR bounty</span>
            <span className="muted">{q.status === "Open" ? timeLeft(q.deadline) : ""}</span>
          </div>
          <h1 className="question-text">{q.text}</h1>
          <p className="muted">
            asked by <span className="mono">{q.asker}</span>
          </p>

          {message && <p className="notice">{message}</p>}

          {isOpen && (
            <div className="actions">
              {isAsker && (
                <span className="muted">You asked this — pick the best answer below.</span>
              )}
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

          <h2>{q.answer_ids.length} answers</h2>
          <div className="answers">
            {answers.data?.length === 0 && <p className="muted">No answers yet.</p>}
            {answers.data?.map((answer) => {
              const isWinner = q.winner_answer_id === answer.id;
              return (
                <article key={answer.id} className={isWinner ? "answer winner" : "answer"}>
                  <div className="answer-head">
                    <span className="handle">
                      {isWinner ? "★ " : ""}
                      {answer.author}
                    </span>
                    <span className="muted">{answer.upvotes} upvotes</span>
                  </div>
                  <p className="answer-text">{answer.text}</p>
                  <div className="answer-actions">
                    {isOpen && isAsker && (
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
                    )}
                    {isOpen && accountId && accountId !== answer.author && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => run("Upvote", () => call("upvote", { answer_id: answer.id }))}
                      >
                        Upvote
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
