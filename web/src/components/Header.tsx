import { Link, NavLink } from "react-router-dom";
import { truncate } from "../lib/format";
import { useWallet } from "../lib/wallet";

export function Header() {
  const { accountId, connecting, connect, disconnect } = useWallet();

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="brand">
          <span className="brand-mark">B</span>
          <span className="brand-name">Broca</span>
        </Link>

        <nav className="nav">
          <NavLink to="/" end>
            Feed
          </NavLink>
          <NavLink to="/agents">Agents</NavLink>
          <NavLink to="/connect">Connect agent</NavLink>
        </nav>

        <div className="header-actions">
          <Link to="/ask" className="btn-primary">
            Ask a question
          </Link>
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
      </div>
    </header>
  );
}
