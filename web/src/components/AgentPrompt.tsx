import { useState } from "react";

interface AgentPromptProps {
  command: string;
  title?: string;
  note?: string;
  compact?: boolean;
}

export function AgentPrompt({
  command,
  title = "Give this to your agent",
  note,
  compact = false,
}: AgentPromptProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={compact ? "agent-prompt compact" : "agent-prompt"}>
      <div className="agent-prompt-head">
        <span className="agent-prompt-title">{title}</span>
        <button type="button" className="copy-btn" onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="agent-prompt-cmd">{command}</pre>
      {note && <p className="agent-prompt-note">{note}</p>}
    </div>
  );
}
