import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { QuestionList } from "./components/QuestionList";
import type { FilterKey } from "./components/FilterChips";
import { Sidebar } from "./components/Sidebar";
import { TabBar } from "./components/TabBar";
import { TopBar } from "./components/TopBar";
import { nowNs, phaseOf } from "./lib/phase";
import { useData } from "./lib/store";
import { Agents } from "./pages/Agents";
import { Ask } from "./pages/Ask";
import { Connect } from "./pages/Connect";
import { Question } from "./pages/Question";

function Pane({ children }: { children: React.ReactNode }) {
  return (
    <section className="detail">
      <div className="inner">{children}</div>
    </section>
  );
}

function Single({ children }: { children: React.ReactNode }) {
  return (
    <div className="single">
      <div className="inner">{children}</div>
    </div>
  );
}

export function Shell() {
  return (
    <>
      <div className="app">
        <Sidebar />
        <main className="main">
          <TopBar />
          <App />
        </main>
      </div>
      <TabBar />
    </>
  );
}

export function App() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { questions, config } = useData();
  const [filter, setFilter] = useState<FilterKey>("open");

  const match = pathname.match(/^\/q\/(\d+)/);
  const routeId = match ? Number(match[1]) : null;
  const isAgents = pathname === "/agents";
  const isConnect = pathname === "/connect";
  const isAsk = pathname === "/ask";

  const firstOfFilter = useMemo(() => {
    const grace = config ? BigInt(config.grace_ns) : 0n;
    const now = nowNs();
    for (const question of questions) {
      const phase = phaseOf(question, now, grace);
      const bucket: FilterKey =
        phase === "open" ? "open" : phase === "grace" || phase === "settleable" ? "wait" : "done";
      if (bucket === filter) return question.id;
    }
    return null;
  }, [questions, filter, config]);

  const pane = isAgents || isConnect ? "detail" : pathname === "/" || isAsk ? "list" : "detail";

  useEffect(() => {
    document.body.dataset.pane = pane;
  }, [pane]);

  const openFilter = (key: FilterKey) => {
    setFilter(key);
    if (routeId !== null || isAsk) navigate("/");
  };

  if (isAgents || isConnect) {
    return <Single>{isAgents ? <Agents /> : <Connect />}</Single>;
  }

  const detailId = pathname === "/" ? firstOfFilter : routeId;
  const selectedId = isAsk ? null : detailId;

  return (
    <div className="split">
      <QuestionList filter={filter} selectedId={selectedId} onFilter={openFilter} />
      <Pane>
        {isAsk ? (
          <Ask
            onPosted={(newId) => {
              setFilter("open");
              navigate(newId === undefined ? "/" : `/q/${newId}`);
            }}
          />
        ) : detailId !== null ? (
          <Question id={detailId} />
        ) : (
          <div className="empty">
            <b>Pick a question</b>
            Choose one from the list to read its answers.
          </div>
        )}
      </Pane>
    </div>
  );
}
