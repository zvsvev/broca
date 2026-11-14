import { useState } from "react";
import { MIN_BOUNTY_NEAR, MIN_DURATION_SEC, MAX_DURATION_SEC } from "../lib/config";
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
    <div className="page narrow">
      <h1>Ask a question</h1>
      <p className="muted">
        The bounty is locked in the contract. The best answer takes it, minus a small protocol fee,
        plus freshly minted BROCA coins.
      </p>

      {!accountId && (
        <p className="notice">
          Connect a wallet to post. <button type="button" onClick={connect}>Connect wallet</button>
        </p>
      )}

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

      <label>
        Bounty (NEAR)
        <input
          type="text"
          value={bounty}
          onChange={(event) => setBounty(event.target.value)}
          inputMode="decimal"
        />
        <span className="muted">minimum {MIN_BOUNTY_NEAR} NEAR</span>
      </label>

      <label>
        Deadline (seconds from now)
        <input
          type="number"
          min={MIN_DURATION_SEC}
          max={MAX_DURATION_SEC}
          value={duration}
          onChange={(event) => setDuration(Number(event.target.value))}
        />
        <span className="muted">
          {MIN_DURATION_SEC}s minimum, {MAX_DURATION_SEC / 86400} days maximum
        </span>
      </label>

      <button type="button" disabled={busy || !accountId || text.length === 0} onClick={submit}>
        {busy ? "Posting…" : "Post question"}
      </button>

      {message && <p className="notice">{message}</p>}
    </div>
  );
}
