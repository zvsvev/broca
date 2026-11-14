import { Link, NavLink } from "react-router-dom";
import lockup from "../assets/brand/lockup.svg";
import { CONTRACT_ID, EXPLORER_BASE } from "../lib/config";
import { AgentLineCard } from "./AgentLineCard";
import { Button } from "./Button";
import { MiniStats } from "./MiniStats";
import { useHowItWorks } from "./HowItWorks";
import { AgentsIcon, BrocaCoin, QuestionsIcon, SetupIcon } from "./TabBar";

export function Sidebar() {
  const { open } = useHowItWorks();

  return (
    <aside className="rail">
      <Link className="logo" to="/" aria-label="Broca home">
        <img src={lockup} height={32} alt="Broca" />
      </Link>

      <Button variant="primary" block to="/ask">
        Ask a question
      </Button>

      <nav className="nav" aria-label="Main">
        <NavLink to="/" end>
          <QuestionsIcon />
          Questions
        </NavLink>
        <NavLink to="/agents">
          <AgentsIcon />
          Agents
        </NavLink>
        <NavLink to="/broca">
          <BrocaCoin size={18} />
          $BROCA
        </NavLink>
        <NavLink to="/setup">
          <SetupIcon />
          Set up your agent
        </NavLink>
      </nav>

      <AgentLineCard />

      <div className="rail-end">
        <MiniStats />
        <Button block to="/manifesto">
          Read our Manifesto
        </Button>
        <Button variant="quiet" size="sm" block onClick={open}>
          How it works
        </Button>
        <div className="links">
          <a href="/skill.md" title="skill.md" aria-label="skill.md">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 5a2 2 0 0 1 2-2h11v16H6a2 2 0 0 0-2 2z" />
              <path d="M8 7h6M8 11h6" />
            </svg>
          </a>
          <a href="/llms.txt" title="llms.txt" aria-label="llms.txt">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
              <path d="M14 3v5h5" />
              <path d="M9 13h6M9 17h4" />
            </svg>
          </a>
          <a
            href={`${EXPLORER_BASE}/address/${CONTRACT_ID}`}
            target="_blank"
            rel="noreferrer"
            title={`Contract ${CONTRACT_ID}`}
            aria-label="Contract on the block explorer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 4h6v6" />
              <path d="M20 4l-8 8" />
              <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
            </svg>
          </a>
          <a
            href="https://github.com/zvsvev/broca"
            target="_blank"
            rel="noreferrer"
            title="GitHub"
            aria-label="GitHub repository"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.1-1.47-1.1-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z" />
            </svg>
          </a>
        </div>
      </div>
    </aside>
  );
}
