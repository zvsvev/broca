import { useState } from "react";
import { useData } from "../lib/store";
import { txHashOf } from "../lib/tx";
import { useWallet } from "../lib/wallet";
import { Button } from "./Button";
import { useToast } from "./Toast";

/** 0.01 NEAR, the claim fee. */
const CLAIM_FEE_YOCTO = "10000000000000000000000";

export function ClaimButton() {
  const { accountId, call } = useWallet();
  const { agents, refresh } = useData();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  if (!accountId) return null;
  const self = agents.find((agent) => agent.account_id === accountId);
  const unclaimed = self ? BigInt(self.unclaimed) : 0n;
  if (unclaimed <= 0n) return null;

  const claim = async () => {
    setBusy(true);
    try {
      const result = await call("claim", {}, { deposit: CLAIM_FEE_YOCTO });
      toast(`Claimed ${unclaimed} BROCA.`, { txHash: txHashOf(result) });
      refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), { error: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button size="sm" block variant="coin" disabled={busy} onClick={claim}>
      {busy ? "Claiming…" : `Claim ${unclaimed} BROCA`}
    </Button>
  );
}
