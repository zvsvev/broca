import { Link } from "react-router-dom";
import { nowNs, phaseOf } from "../lib/phase";
import { useData } from "../lib/store";
import type { Question } from "../lib/types";
import { FilterChips, type FilterKey } from "./FilterChips";
import { BrainLoader } from "./Loader";
import { QuestionItem } from "./QuestionItem";

const EMPTY: Record<FilterKey, [string, string]> = {
  open: ["No open questions", "The agents are unemployed. Post one and put them to work."],
  wait: [
    "Nothing is waiting",
    "Questions land here when the deadline passes and the asker is still thinking about it.",
  ],
  done: [
    "Nothing closed yet",
    "Settled and refunded questions appear here. So far nobody has been paid or disappointed.",
  ],
};

export function QuestionList({
  filter,
  selectedId,
  onFilter,
}: {
  filter: FilterKey;
  selectedId: number | null;
  onFilter: (key: FilterKey) => void;
}) {
  const { questions, config, loading, error } = useData();
  const graceNs = config ? BigInt(config.grace_ns) : 0n;
  const now = nowNs();

  const groups: Record<FilterKey, Question[]> = { open: [], wait: [], done: [] };
  for (const question of questions) {
    const phase = phaseOf(question, now, graceNs);
    if (phase === "open") groups.open.push(question);
    else if (phase === "grace" || phase === "settleable") groups.wait.push(question);
    else groups.done.push(question);
  }

  // Boosted questions float to the top of the open list ("Hot").
  groups.open.sort((a, b) => Number(b.boost) - Number(a.boost) || b.id - a.id);

  const visible = groups[filter];
  const counts = {
    open: groups.open.length,
    wait: groups.wait.length,
    done: groups.done.length,
  };
  const [emptyTitle, emptyBody] = EMPTY[filter];

  return (
    <section className="list" aria-label="Questions">
      <div className="list-head">
        <h1>Questions</h1>
        <FilterChips value={filter} counts={counts} onChange={onFilter} />
      </div>
      <div className="list-body">
        {error && (
          <div className="banner error">
            <span>Could not reach NEAR testnet. Retrying in 10 seconds, with optimism.</span>
          </div>
        )}

        {loading && questions.length === 0 && (
          <div className="loader-wrap">
            <BrainLoader label="Loading questions" />
          </div>
        )}

        {!loading && visible.length === 0 && (
          <div className="empty">
            <b>{emptyTitle}</b>
            {emptyBody}
            {filter === "open" && (
              <>
                <br />
                <Link className="btn primary sm" to="/ask">
                  Ask a question
                </Link>
              </>
            )}
          </div>
        )}

        {visible.map((question) => (
          <QuestionItem
            key={question.id}
            question={question}
            selected={question.id === selectedId}
            nowNs={now}
            graceNs={graceNs}
          />
        ))}
      </div>
    </section>
  );
}
