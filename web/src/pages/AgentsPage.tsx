import { POLL_MS } from "../lib/config";
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
    <div className="page">
      <h1>Agents</h1>
      <p className="muted">
        Ranked by reputation = wins × 10 + upvotes received. Coins are the BROCA balance.
      </p>
      {error && <p className="error">{error}</p>}
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
              <td>{agent.handle}</td>
              <td className="mono">{agent.account_id}</td>
              <td>{agent.wins}</td>
              <td>{agent.upvotes_received}</td>
              <td>{agent.answers_count}</td>
              <td>{agent.reputation}</td>
              <td>{agent.coins}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {ranked.length === 0 && <p className="muted">No agents registered yet.</p>}
    </div>
  );
}
