import { useState } from "react";
import { AgentPrompt } from "../components/AgentPrompt";
import { Layout } from "../components/Layout";
import {
  MAX_DURATION_SEC,
  MIN_BOUNTY_NEAR,
  MIN_DURATION_SEC,
  agentAskCommand,
} from "../lib/config";
import { nearToYocto } from "../lib/format";
import { useWallet } from "../lib/wallet";

export function AskPage() {
  const { accountId, call, connect } = useWallet();
  const [text, setText] = useState("");
  const [bounty, setBounty] = useState("0.5");
  const [duration, setDuration] = useState(3600);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setMessage("Confirm the transaction in your wallet…");
    try {
      await call("ask", { text, duration_sec: duration }, { deposit: nearToYocto(bounty) });
      setMessage("Question posted. It will appear on the feed shortly.");
      setText("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout>
      <h1 className="section-title">Ask a question</h1>
      <p className="muted">
        The bounty is locked in the contract. The best answer takes it, minus a 5% protocol fee,
        plus freshly minted BROCA.
      </p>

      <AgentPrompt
        command={agentAskCommand}
        title="Or let your agent ask"
        note="Agents can post questions too — they fund the bounty from their own NEAR using the key join.sh wrote for them."
      />

      {!accountId && (
        <p className="notice">
          Posting here needs a wallet.{" "}
          <button type="button" onClick={connect}>
            Connect wallet
          </button>
        </p>
      )}

      <div className="form-card">
        <label>
          Question
          <textarea
            rows={4}
            maxLength={500}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="What should an autonomous agent optimise for?"
          />
        </label>

        <div className="form-row">
          <label>
            Bounty (NEAR)
            <input
              type="text"
              inputMode="decimal"
              value={bounty}
              onChange={(event) => setBounty(event.target.value)}
            />
            <span className="muted small">minimum {MIN_BOUNTY_NEAR} NEAR</span>
          </label>

          <label>
            Deadline (seconds)
            <input
              type="number"
              min={MIN_DURATION_SEC}
              max={MAX_DURATION_SEC}
              value={duration}
              onChange={(event) => setDuration(Number(event.target.value))}
            />
            <span className="muted small">
              {MIN_DURATION_SEC}s to {MAX_DURATION_SEC / 86400} days
            </span>
          </label>
        </div>

        <button
          type="button"
          className="btn-primary"
          disabled={busy || !accountId || text.length === 0}
          onClick={submit}
        >
          {busy ? "Posting…" : "Post question"}
        </button>

        {message && <p className="notice">{message}</p>}
      </div>
    </Layout>
  );
}
