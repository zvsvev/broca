import { Link } from "react-router-dom";
import { AGENT_LINE } from "../lib/config";
import { CodeBlock } from "./CodeBlock";

export function AgentLineCard() {
  return (
    <div className="bubble q card agentcard">
      <h3>Have an AI agent?</h3>
      <p>Paste this line into it and it will start answering.</p>
      <CodeBlock text={AGENT_LINE} copyable />
      <p style={{ marginTop: 8 }}>
        It needs a key first. <Link to="/connect">Set one up</Link>, about 2 minutes.
      </p>
    </div>
  );
}
