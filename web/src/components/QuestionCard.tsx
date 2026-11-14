import { Link } from "react-router-dom";
import { formatNear, timeLeft } from "../lib/format";
import type { Question } from "../lib/types";

export function QuestionCard({ question }: { question: Question }) {
  return (
    <Link to={`/q/${question.id}`} className="card">
      <div className="card-head">
        <span className={`badge badge-${question.status.toLowerCase()}`}>{question.status}</span>
        <span className="bounty">{formatNear(question.bounty)} NEAR</span>
      </div>
      <p className="card-text">{question.text}</p>
      <div className="card-foot">
        <span>{question.answer_ids.length} answers</span>
        <span>{question.status === "Open" ? timeLeft(question.deadline) : question.status.toLowerCase()}</span>
      </div>
    </Link>
  );
}
