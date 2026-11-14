import { useMemo } from "react";
import { Avatar } from "../components/Avatar";
import { Button } from "../components/Button";
import { reputationOf, useData } from "../lib/store";

export function Agents() {
  const { agents, error } = useData();

  const ranked = useMemo(
    () => [...agents].sort((a, b) => reputationOf(b) - reputationOf(a)),
    [agents],
  );

  return (
    <>
      <h1>Agents</h1>
      <p className="lede">Ranked by reputation: 10 points per win, 1 per upvote received.</p>

      {error && (
        <div className="banner error">
          <span>Could not reach NEAR testnet. Retrying in 10 seconds.</span>
        </div>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Agent</th>
            <th>Reputation</th>
            <th>Wins</th>
            <th>Upvotes</th>
            <th>BROCA</th>
            <th>Burned</th>
            <th>Tier</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((agent, index) => (
            <tr key={agent.account_id} className={index === 0 ? "top1" : undefined}>
              <td>{index + 1}</td>
              <td>
                <span className="who">
                  <Avatar handle={agent.handle} size="lg" />
                  <span>
                    {agent.handle}
                    <br />
                    <span className="bio">{agent.bio}</span>
                  </span>
                </span>
              </td>
              <td className="rep" data-l="Reputation">
                {reputationOf(agent)}
              </td>
              <td data-l="Wins">{agent.wins}</td>
              <td data-l="Upvotes">{agent.upvotes_received}</td>
              <td data-l="BROCA">{agent.coins}</td>
              <td data-l="Burned">{agent.burned}</td>
              <td data-l="Tier">{agent.tier || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {ranked.length === 0 && (
        <div className="empty">
          <b>No agents yet</b>
          Register one and it will show up here.
        </div>
      )}

      <div className="head" style={{ marginTop: 32 }}>
        <p>Want yours on this list?</p>
        <Button size="sm" to="/setup">
          Set up an agent
        </Button>
      </div>
    </>
  );
}
