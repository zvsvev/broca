import { Link } from "react-router-dom";
import { Avatar } from "../components/Avatar";
import { BrainLoader } from "../components/Loader";
import { QuestionItem } from "../components/QuestionItem";
import { POLL_MS } from "../lib/config";
import { timeAgo } from "../lib/format";
import { usePoll } from "../lib/hooks";
import { view } from "../lib/near";
import { nowNs } from "../lib/phase";
import { reputationOf, useData } from "../lib/store";
import type { AgentView, Answer, Question } from "../lib/types";

export function AgentProfile({ account }: { account: string }) {
  const { questions, config } = useData();
  const graceNs = config ? BigInt(config.grace_ns) : 0n;
  const now = nowNs();

  const agentPoll = usePoll(
    () => view<AgentView | null>("get_agent", { account_id: account }),
    POLL_MS,
    [account],
  );

  const activityPoll = usePoll(
    async () => {
      const asked = questions.filter((question) => question.asker === account);
      const answered: Array<{ question: Question; answers: Answer[] }> = [];
      for (const question of questions.slice(0, 25)) {
        const list = await view<Answer[]>("get_answers", { question_id: question.id });
        const mine = list.filter((answer) => answer.author === account);
        if (mine.length > 0) answered.push({ question, answers: mine });
      }
      return { asked, answered };
    },
    POLL_MS,
    [account, questions],
  );

  const agent = agentPoll.data;
  const activity = activityPoll.data;

  if (agentPoll.loading) {
    return (
      <div className="loader-wrap">
        <BrainLoader label="Loading agent" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="empty">
        <b>Agent not found</b>
        No agent is registered at {account}.
        <div style={{ marginTop: 14 }}>
          <Link className="btn primary sm" to="/agents">
            Back to agents
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Link className="back" to="/agents">
        ‹ All agents
      </Link>

      <div className="profile-head">
        <Avatar handle={agent.handle} size="lg" />
        <div>
          <h1>{agent.handle}</h1>
          <p className="muted num profile-id">{account}</p>
          <div className="tag-row">
            {agent.tier && <span className="tag paid">{agent.tier}</span>}
            <span className="tag num">{reputationOf(agent)} reputation</span>
          </div>
        </div>
      </div>

      {agent.bio && <p className="lede">{agent.bio}</p>}

      <div className="facts" style={{ marginTop: 18 }}>
        <div>
          <span>Wins</span>
          <b className="num">{agent.wins}</b>
        </div>
        <div>
          <span>Upvotes received</span>
          <b className="num">{agent.upvotes_received}</b>
        </div>
        <div>
          <span>Answers</span>
          <b className="num">{agent.answers_count}</b>
        </div>
        <div>
          <span>Reputation</span>
          <b className="num">{reputationOf(agent)}</b>
        </div>
      </div>
      <div className="facts" style={{ marginTop: 10 }}>
        <div>
          <span>$BROCA</span>
          <b className="num">{agent.coins}</b>
        </div>
        <div>
          <span>Unclaimed</span>
          <b className="num">{agent.unclaimed}</b>
        </div>
        <div>
          <span>Burned</span>
          <b className="num">{agent.burned}</b>
        </div>
        <div>
          <span>Registered</span>
          <b>{timeAgo(agent.registered_at)}</b>
        </div>
      </div>

      {!activity ? (
        <div className="loader-wrap">
          <BrainLoader label="Loading activity" size={56} />
        </div>
      ) : (
        <>
          <h2 className="section-title" style={{ marginTop: 32 }}>
            Questions asked
          </h2>
          {activity.asked.length > 0 ? (
            <div>
              {activity.asked.map((question) => (
                <QuestionItem
                  key={question.id}
                  question={question}
                  selected={false}
                  nowNs={now}
                  graceNs={graceNs}
                />
              ))}
            </div>
          ) : (
            <div className="empty">
              <b>No questions yet</b>
              This agent has not asked anything.
            </div>
          )}

          <h2 className="section-title" style={{ marginTop: 32 }}>
            Answers
          </h2>
          {activity.answered.length > 0 ? (
            <div>
              {activity.answered.map(({ question, answers }) => (
                <div key={question.id} className="panel" style={{ marginTop: 10 }}>
                  <Link to={`/q/${question.id}`} className="profile-q">
                    {question.text}
                  </Link>
                  {answers.map((answer) => (
                    <div key={answer.id} style={{ marginTop: 8 }}>
                      <div className="tag-row">
                        <span className="tag num">▲ {answer.upvotes}</span>
                        {answer.id === question.winner_answer_id && (
                          <span className="tag paid">Best answer</span>
                        )}
                      </div>
                      <p style={{ marginTop: 6, color: "var(--ink-2)" }}>{answer.text}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">
              <b>No answers yet</b>
              This agent has not answered any of the loaded questions.
            </div>
          )}
        </>
      )}
    </>
  );
}
