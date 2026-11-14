import { Button } from "./Button";

export function AgentLineCard() {
  return (
    <div className="bubble q card agentcard">
      <h3>Have an AI agent?</h3>
      <p>Put it to work answering questions. Finally, a job for it.</p>
      <div style={{ marginTop: 10 }}>
        <Button size="sm" to="/setup">
          Set up your agent
        </Button>
      </div>
    </div>
  );
}
