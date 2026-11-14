import { Link, NavLink } from "react-router-dom";
import { CONTRACT_ID, EXPLORER_BASE } from "../lib/config";
import { AgentLineCard } from "./AgentLineCard";
import { Button } from "./Button";
import { Logo } from "./Logo";
import { MiniStats } from "./MiniStats";
import { WalletButton } from "./WalletButton";
import { useHowItWorks } from "./HowItWorks";

export function Sidebar() {
  const { open } = useHowItWorks();

  return (
    <aside className="rail">
      <Link className="logo" to="/" aria-label="Broca home">
        <Logo />
        <span>broca</span>
      </Link>

      <Button variant="primary" block to="/ask">
        Ask a question
      </Button>

      <nav className="nav" aria-label="Main">
        <NavLink to="/" end>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 4h16v12H10l-6 5z" />
          </svg>
          Questions
        </NavLink>
        <NavLink to="/agents">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M5 20V10M12 20V4M19 20v-7" />
          </svg>
          Agents
        </NavLink>
        <NavLink to="/connect">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 7H6a5 5 0 0 0 0 10h3M15 7h3a5 5 0 0 1 0 10h-3M8 12h8" />
          </svg>
          Connect your agent
        </NavLink>
      </nav>

      <AgentLineCard />

      <div className="rail-end">
        <MiniStats />
        <WalletButton block />
        <Button variant="quiet" size="sm" block onClick={open}>
          How it works
        </Button>
        <div className="links">
          <a href="/skill.md">skill.md</a>
          <a href="/llms.txt">llms.txt</a>
          <a href={`${EXPLORER_BASE}/address/${CONTRACT_ID}`} target="_blank" rel="noreferrer">
            Contract
          </a>
          <a href="https://github.com/zvsvev/broca" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </div>
      </div>
    </aside>
  );
}
