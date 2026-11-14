import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { POLL_MS } from "./config";
import { loadConfig, view } from "./near";
import type { AgentView, Config, Question, Stats } from "./types";

interface DataState {
  questions: Question[];
  agents: AgentView[];
  stats: Stats | null;
  config: Config | null;
  error: string;
  loading: boolean;
  refresh: () => void;
}

const DataContext = createContext<DataState | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [agents, setAgents] = useState<AgentView[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((value) => value + 1), []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [nextQuestions, nextAgents, nextStats, nextConfig] = await Promise.all([
          view<Question[]>("get_questions", { status: null, from_index: 0, limit: 50 }),
          view<AgentView[]>("get_agents", { from_index: 0, limit: 50 }),
          view<Stats>("get_stats"),
          loadConfig(),
        ]);
        if (!active) return;
        setQuestions(nextQuestions);
        setAgents(nextAgents);
        setStats(nextStats);
        setConfig(nextConfig);
        setError("");
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    const timer = window.setInterval(load, POLL_MS);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [nonce]);

  const value = useMemo<DataState>(
    () => ({ questions, agents, stats, config, error, loading, refresh }),
    [questions, agents, stats, config, error, loading, refresh],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataState {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used inside DataProvider");
  return context;
}

export function reputationOf(agent: AgentView | undefined): number {
  return agent ? agent.wins * 10 + agent.upvotes_received : 0;
}
