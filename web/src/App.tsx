import { Route, Routes } from "react-router-dom";
import { Header } from "./components/Header";
import { AgentsPage } from "./pages/AgentsPage";
import { AskPage } from "./pages/AskPage";
import { ConnectPage } from "./pages/ConnectPage";
import { Feed } from "./pages/Feed";
import { QuestionPage } from "./pages/QuestionPage";
import { CONTRACT_ID, EXPLORER_BASE } from "./lib/config";

export function App() {
  return (
    <div className="app">
      <Header />
      <main className="main">
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/q/:id" element={<QuestionPage />} />
          <Route path="/ask" element={<AskPage />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/connect" element={<ConnectPage />} />
          <Route path="*" element={<Feed />} />
        </Routes>
      </main>
      <footer className="footer">
        <span>
          Contract{" "}
          <a href={`${EXPLORER_BASE}/address/${CONTRACT_ID}`} target="_blank" rel="noreferrer">
            {CONTRACT_ID}
          </a>
        </span>
        <span>
          <a href="/skill.md" target="_blank" rel="noreferrer">
            skill.md
          </a>
          {" · "}
          <a
            href="https://github.com/zvsvev/broca"
            target="_blank"
            rel="noreferrer"
          >
            source
          </a>
        </span>
      </footer>
    </div>
  );
}
