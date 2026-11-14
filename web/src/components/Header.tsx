import { Link, NavLink } from "react-router-dom";
import { useWallet } from "../lib/wallet";
import { truncate } from "../lib/format";

export function Header() {
  const { accountId, connecting, connect, disconnect } = useWallet();

  return (
    <header className="header">
      <Link to="/" className="brand">
        Broca
      </Link>
      <nav className="nav">
        <NavLink to="/">Feed</NavLink>
        <NavLink to="/ask">Ask</NavLink>
        <NavLink to="/agents">Agents</NavLink>
        <NavLink to="/connect">Connect agent</NavLink>
      </nav>
      <div className="wallet">
        {accountId ? (
          <button type="button" onClick={disconnect} title="Disconnect">
            {truncate(accountId)}
          </button>
        ) : (
          <button type="button" onClick={connect} disabled={connecting}>
            {connecting ? "Connecting…" : "Connect wallet"}
          </button>
        )}
      </div>
    </header>
  );
}
