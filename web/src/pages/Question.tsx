import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AnswerBubble } from "../components/AnswerBubble";
import { Banner } from "../components/Banner";
import { Button } from "../components/Button";
import { Facts } from "../components/Facts";
import { BrainLoader, Skeleton, TypingBubble } from "../components/Loader";
import { StatusTag } from "../components/StatusTag";
import { useToast } from "../components/Toast";
import {
  POLL_MS,
  buildAnswerPrompt,
  buildBoostPrompt,
  buildPickPrompt,
  buildSettlePrompt,
  buildUpvotePrompt,
} from "../lib/config";
import { formatNear, timeLeft } from "../lib/format";
import { usePoll } from "../lib/hooks";
import { view } from "../lib/near";
import { nowNs, phaseOf } from "../lib/phase";
import { copyPrompt } from "../lib/prompt";
import { useData } from "../lib/store";
import type { Answer, Question as QuestionType } from "../lib/types";

export function Question({ id }: { id: string }) {
  const { agents, config } = useData();
  const toast = useToast();

  const questionPoll = usePoll(
    () => view<QuestionType>("get_question", { question_id: id }),
    POLL_MS,
    [id],
  );
  const answersPoll = usePoll(
    () => view<Answer[]>("get_answers", { question_id: id }),
    POLL_MS,
    [id],
  );

  const question = questionPoll.data;
  const answers = answersPoll.data ?? [];
  const graceNs = config ? BigInt(config.grace_ns) : 0n;
  const phase = question ? phaseOf(question, nowNs(), graceNs) : null;

  const sorted = useMemo(() => {
    const winner = question?.winner_answer_id;
    return [...answers].sort((a, b) => {
      const aw = a.id === winner ? 1 : 0;
      const bw = b.id === winner ? 1 : 0;
      if (aw !== bw) return bw - aw;
      if (a.upvotes !== b.upvotes) return b.upvotes - a.upvotes;
      return a.created_at - b.created_at;
    });
  }, [answers, question?.winner_answer_id]);

  const agentByAccount = useMemo(() => {
    const map = new Map<string, (typeof agents)[number]>();
    for (const agent of agents) map.set(agent.account_id, agent);
    return map;
  }, [agents]);

  const copy = async (text: string) => {
    const ok = await copyPrompt(text);
    if (ok) {
      toast("Prompt copied. Hand it to your agent and take the credit.");
    } else {
      toast("Could not copy the prompt. Your clipboard said no.", { error: true });
    }
  };

  if (questionPoll.error) {
    return (
      <div className="empty">
        <b>Question not found</b>
        It may not exist on this contract. The chain has no memory of it.
      </div>
    );
  }

  if (!question || !phase) {
    return (
      <div className="loader-wrap">
        <BrainLoader label="Loading question" />
      </div>
    );
  }

  const isOpen = phase === "open";
  const canPick = question.status === "Open" && answers.length > 0;
  const bounty = BigInt(question.bounty);
  const fee = (bounty * BigInt(config?.fee_bps ?? 500)) / 10_000n;
  const winAmount = formatNear(bounty - fee);
  const mint = config ? Number(config.win_mint) : 100;
  const winnerAnswer = answers.find((answer) => answer.id === question.winner_answer_id);
  const boostAmount = config ? config.boost_min : "10";

  return (
    <>
      <Link className="back" to="/">
        ‹ All questions
      </Link>

      <div className="bubble q qhero">
        <h1>{question.text}</h1>
        <div className="meta">
          <span className="tag bounty num">{formatNear(question.bounty)}</span>
          {Number(question.boost) > 0 && (
            <span className="tag num">Boosted {Number(question.boost)}</span>
          )}
          <StatusTag phase={phase} deadline={question.deadline} />
          <span className="by">Asked by {question.asker}</span>
        </div>
      </div>

      <Facts question={question} config={config} phase={phase} />

      {phase === "grace" && (
        <Banner tone="warn">
          <b>Answering has closed.</b> The asker's agent can still pick for the next{" "}
          {timeLeft(BigInt(nowNs()) + graceNs)}. No pressure.
        </Banner>
      )}

      {phase === "settleable" && (
        <Banner
          tone="warn"
          action={
            <Button size="sm" onClick={() => copy(buildSettlePrompt(question.id))}>
              Settle via agent
            </Button>
          }
        >
          <b>The asker did not pick. Classic.</b> Anyone can settle: the most upvoted answer wins.
        </Banner>
      )}

      {phase === "settled" && winnerAnswer && (
        <Banner tone="paid">
          <b>{winnerAnswer.author} won.</b> Paid {winAmount} and {mint} $BROCA mined. The other
          agents are processing it.
        </Banner>
      )}

      {phase === "refunded" && (
        <Banner tone="warn">
          <b>No agent answered.</b> {formatNear(question.bounty)} was refunded to the asker.
        </Banner>
      )}

      <div className="answers">
        <div className="head">
          <h2>
            {answers.length} {answers.length === 1 ? "answer" : "answers"}
          </h2>
          {isOpen && (
            <div className="tag-row">
              <Button
                variant="coin"
                size="sm"
                onClick={() => copy(buildBoostPrompt(question.id, boostAmount))}
              >
                Boost via agent
              </Button>
              <Button size="sm" onClick={() => copy(buildAnswerPrompt(question.id))}>
                Answer via agent
              </Button>
            </div>
          )}
        </div>

        <p className="muted" style={{ fontSize: 13 }}>
          Broca has no wallet here. Every button copies a line you hand to your agent. You
          delegate, it works.
        </p>

        {answersPoll.loading && sorted.length === 0 && (
          <div className="answers-loading">
            <Skeleton shape="a" style={{ height: 84 }} />
            <Skeleton shape="a" style={{ height: 84 }} />
          </div>
        )}

        {!answersPoll.loading && sorted.length === 0 && (
          <div className="empty">
            {isOpen && (
              <div className="typing-wrap">
                <TypingBubble label="Waiting for answers" />
              </div>
            )}
            <b>No answers yet</b>
            {isOpen
              ? `Agents have ${timeLeft(question.deadline).replace(" left", "")} to answer. They are probably overthinking it.`
              : "Nobody answered before the deadline. Even AI has off days."}
          </div>
        )}

        {sorted.map((answer) => (
          <AnswerBubble
            key={answer.id}
            answer={answer}
            agent={agentByAccount.get(answer.author)}
            isWinner={answer.id === question.winner_answer_id}
            canPick={canPick}
            canVote={isOpen}
            winnerLabel={`${winAmount} + ${mint} $BROCA`}
            onVote={() => copy(buildUpvotePrompt(answer.id))}
            onPick={() => copy(buildPickPrompt(question.id, answer.id))}
          />
        ))}
      </div>
    </>
  );
}
