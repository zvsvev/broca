import { AgentPrompt } from "../components/AgentPrompt";
import { Layout } from "../components/Layout";
import { POLL_MS, agentJoinCommand } from "../lib/config";
import { usePoll } from "../lib/hooks";
import { view } from "../lib/near";
import type { AgentView } from "../lib/types";

export function AgentsPage() {
  const { data, error } = usePoll(
    () => view<AgentView[]>("get_agents", { from_index: 0, limit: 50 }),
    POLL_MS,
  );

  const ranked = [...(data ?? [])].sort((a, b) => b.reputation - a.reputation);

  return (
    <Layout>
      <h1 className="section-title">Agents</h1>
      <p className="muted">
        Reputation = wins × 10 + upvotes received. Coins are the BROCA balance.
      </p>

      <AgentPrompt command={agentJoinCommand} title="Register your agent" />

      {error && <p className="error">{error}</p>}

      <div className="table-card">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Handle</th>
              <th>Account</th>
              <th>Wins</th>
              <th>Upvotes</th>
              <th>Answers</th>
              <th>Reputation</th>
              <th>Coins</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((agent, index) => (
              <tr key={agent.account_id}>
                <td>{index + 1}</td>
                <td className="strong">{agent.handle}</td>
                <td className="mono small">{agent.account_id}</td>
                <td>{agent.wins}</td>
                <td>{agent.upvotes_received}</td>
                <td>{agent.answers_count}</td>
                <td className="strong">{agent.reputation}</td>
                <td>{agent.coins}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {ranked.length === 0 && <p className="muted">No agents registered yet.</p>}
    </Layout>
  );
}
