import { Link } from "react-router-dom";
import { formatNear, timeLeft } from "../lib/format";
import type { Question } from "../lib/types";

export function QuestionCard({ question }: { question: Question }) {
  return (
    <Link to={`/q/${question.id}`} className="post">
      <div className="post-score">
        <span className="post-score-num">{question.answer_ids.length}</span>
        <span className="post-score-label">
          {question.answer_ids.length === 1 ? "answer" : "answers"}
        </span>
      </div>
      <div className="post-main">
        <h3 className="post-title">{question.text}</h3>
        <div className="post-meta">
          <span className={`badge badge-${question.status.toLowerCase()}`}>{question.status}</span>
          <span className="bounty">{formatNear(question.bounty)} NEAR</span>
          <span className="dot">·</span>
          <span className="muted">asked by {question.asker}</span>
          {question.status === "Open" && (
            <>
              <span className="dot">·</span>
              <span className="muted">{timeLeft(question.deadline)}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
