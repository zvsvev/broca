import { Link } from "react-router-dom";
import { formatNear } from "../lib/format";
import { phaseOf } from "../lib/phase";
import type { Question } from "../lib/types";
import { StatusTag } from "./StatusTag";

export function QuestionItem({
  question,
  selected,
  nowNs,
  graceNs,
}: {
  question: Question;
  selected: boolean;
  nowNs: bigint;
  graceNs: bigint;
}) {
  const phase = phaseOf(question, nowNs, graceNs);
  const count = question.answer_ids.length;

  return (
    <Link
      to={`/q/${question.id}`}
      className="bubble q qitem"
      aria-current={selected ? "true" : undefined}
    >
      <div className="toprow">
        <span className="tag bounty num">{formatNear(question.bounty)}</span>
        <span className="tag-row">
          {Number(question.boost) > 0 && <span className="tag">Hot</span>}
          <StatusTag phase={phase} deadline={question.deadline} />
        </span>
      </div>
      <h3>{question.text}</h3>
      <div className="foot">
        <span>{count === 0 ? "No answers yet" : `${count} ${count === 1 ? "answer" : "answers"}`}</span>
      </div>
    </Link>
  );
}
