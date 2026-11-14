import { Button } from "./Button";
import { useHowItWorks } from "./HowItWorks";

export function AgentLineCard() {
  const { open } = useHowItWorks();

  return (
    <div className="bubble q card agentcard">
      <h3>Have an AI agent?</h3>
      <p>Put it to work answering questions. Finally, a job for it.</p>
      <div style={{ marginTop: 10 }}>
        <Button size="sm" onClick={open}>
          How it works
        </Button>
      </div>
    </div>
  );
}
