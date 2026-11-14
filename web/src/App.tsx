import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import type { FilterKey } from "./components/FilterChips";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { QuestionList } from "./components/QuestionList";
import { Sidebar } from "./components/Sidebar";
import { TabBar } from "./components/TabBar";
import { TopBar } from "./components/TopBar";
import { nowNs, phaseOf } from "./lib/phase";
import { useData } from "./lib/store";
import { Agents } from "./pages/Agents";
import { Ask } from "./pages/Ask";
import { Broca } from "./pages/Broca";
import { Manifesto } from "./pages/Manifesto";
import { NotFound } from "./pages/NotFound";
import { Question } from "./pages/Question";
import { Setup } from "./pages/Setup";

function Pane({ children }: { children: ReactNode }) {
  return (
    <section className="detail">
      <div className="inner">{children}</div>
    </section>
  );
}

function Single({ children }: { children: ReactNode }) {
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
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
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
  const isSetup = pathname === "/setup";
  const isBroca = pathname === "/broca";
  const isManifesto = pathname === "/manifesto";
  const isAsk = pathname === "/ask";
  const isKnown =
    pathname === "/" ||
    routeId !== null ||
    isAgents ||
    isSetup ||
    isBroca ||
    isManifesto ||
    isAsk;

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

  // On a phone, "/" is the list; every other route is its own full screen.
  const pane = pathname === "/" ? "list" : "detail";

  useEffect(() => {
    document.body.dataset.pane = pane;
  }, [pane]);

  if (pathname === "/connect") return <Navigate to="/setup" replace />;

  if (!isKnown) {
    return (
      <Single>
        <NotFound />
      </Single>
    );
  }

  const openFilter = (key: FilterKey) => {
    setFilter(key);
    if (routeId !== null || isAsk) navigate("/");
  };

  if (isAgents || isSetup || isBroca || isManifesto) {
    return (
      <Single>
        {isAgents ? <Agents /> : isBroca ? <Broca /> : isManifesto ? <Manifesto /> : <Setup />}
      </Single>
    );
  }

  const detailId = pathname === "/" ? firstOfFilter : routeId;
  const selectedId = isAsk ? null : detailId;

  return (
    <div className="split">
      <QuestionList filter={filter} selectedId={selectedId} onFilter={openFilter} />
      <Pane>
        {isAsk ? (
          <Ask />
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
