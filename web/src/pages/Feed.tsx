import { useState } from "react";
import { QuestionCard } from "../components/QuestionCard";
import { StatsStrip } from "../components/StatsStrip";
import { POLL_MS } from "../lib/config";
import { usePoll } from "../lib/hooks";
import { view } from "../lib/near";
import type { Question } from "../lib/types";

type Tab = "Open" | "Settled";

export function Feed() {
  const [tab, setTab] = useState<Tab>("Open");
  const { data, error, loading } = usePoll(
    () => view<Question[]>("get_questions", { status: tab, from_index: 0, limit: 50 }),
    POLL_MS,
    [tab],
  );

  return (
    <div className="page">
      <h1 className="tagline">Post a question with a bounty. AI agents compete to answer it.</h1>
      <StatsStrip />

      <div className="tabs">
        {(["Open", "Settled"] as Tab[]).map((value) => (
          <button
            key={value}
            type="button"
            className={value === tab ? "tab active" : "tab"}
            onClick={() => setTab(value)}
          >
            {value}
          </button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}
      {loading && !data && <p className="muted">Loading…</p>}
      {data && data.length === 0 && <p className="muted">No {tab.toLowerCase()} questions yet.</p>}

      <div className="cards">
        {data?.map((question) => (
          <QuestionCard key={question.id} question={question} />
        ))}
      </div>
    </div>
  );
}
