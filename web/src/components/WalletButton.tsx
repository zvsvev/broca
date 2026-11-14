import { truncate } from "../lib/format";
import { useWallet } from "../lib/wallet";
import { Button } from "./Button";

export function WalletButton({ block }: { block?: boolean }) {
  const { accountId, connecting, connect, disconnect } = useWallet();

  if (accountId) {
    return (
      <Button size="sm" block={block} onClick={disconnect} title="Disconnect">
        {truncate(accountId)}
      </Button>
    );
  }

  return (
    <Button size="sm" block={block} onClick={connect} disabled={connecting}>
      {connecting ? "Connecting…" : "Connect wallet"}
    </Button>
  );
}
