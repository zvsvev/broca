import type { CSSProperties, ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import "./tabbar.css";

// Tab order. TabSlide uses the same index to pick a slide direction.
export function tabIndex(pathname: string): number {
  if (pathname.startsWith("/agent")) return 0;
  if (pathname.startsWith("/ask")) return 1;
  if (pathname.startsWith("/broca")) return 3;
  if (pathname.startsWith("/setup") || pathname.startsWith("/connect")) return 4;
  return 2; // "/" and "/q/:id"
}

function Svg({ size = 24, children }: { size?: number; children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

// Bot head as an answer bubble: sharp corner top-left.
export const AgentsIcon = () => (
  <Svg>
    <path d="M4 8h12a4 4 0 0 1 4 4v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" />
    <path d="M12 8V5.5M9.5 12.5V14M14.5 12.5V14" />
    <circle cx="12" cy="4" r="1" fill="currentColor" />
  </Svg>
);

// Plus in a circle.
export const AskIcon = () => (
  <Svg>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v8M8 12h8" />
  </Svg>
);

// Question bubble: sharp corner bottom-left.
export const QuestionsIcon = () => (
  <Svg size={30}>
    <path d="M8 4h8a5 5 0 0 1 5 5v4a5 5 0 0 1-5 5H3V9a5 5 0 0 1 5-5z" />
    <path d="M8 9.5h8M8 13h5" />
  </Svg>
);

// Plug.
export const SetupIcon = () => (
  <Svg>
    <path d="M9 3v5M15 3v5" />
    <path d="M6 8h12v3a6 6 0 0 1-12 0z" />
    <path d="M12 17v4" />
  </Svg>
);

// The b coin. Reusable on the /broca page at any size.
export function BrocaCoin({ size = 26 }: { size?: number }) {
  return (
    <span className="broca-coin" style={{ width: size, height: size }}>
      <svg
        aria-hidden="true"
        width="88%"
        height="88%"
        viewBox="0 0 60 60"
        fill="none"
        stroke="currentColor"
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 15v28M30 20v7M30 43v5" />
        <circle cx="30" cy="35" r="8" />
      </svg>
    </span>
  );
}

type Props = {
  /** Number of questions in the Open phase. Pass it from the existing questions hook. */
  openCount?: number;
};

export function TabBar({ openCount = 0 }: Props) {
  const { pathname } = useLocation();
  const i = tabIndex(pathname);
  const current = (n: number) => (i === n ? ("page" as const) : undefined);

  return (
    <nav
      className="tabbar"
      aria-label="Main"
      data-center={i === 2 ? "" : undefined}
      style={{ "--i": i } as CSSProperties}
    >
      <span className="tabbar__ind" aria-hidden="true">
        <span className="tabbar__ind-pill" />
      </span>

      <Link to="/agents" className="tabbar__tab" aria-current={current(0)}>
        <span className="tabbar__slot"><AgentsIcon /></span>
        <span>Agents</span>
      </Link>

      <Link to="/ask" className="tabbar__tab tabbar__tab--ask" aria-current={current(1)}>
        <span className="tabbar__slot"><AskIcon /></span>
        <span>Ask</span>
      </Link>

      <Link to="/" className="tabbar__tab tabbar__tab--center" aria-current={current(2)}>
        <span className="tabbar__center">
          <QuestionsIcon />
          {openCount > 0 && (
            <span className="tabbar__badge" aria-label={`${openCount} open questions`}>
              {openCount > 99 ? "99+" : openCount}
            </span>
          )}
        </span>
        <span>Questions</span>
      </Link>

      <Link to="/broca" className="tabbar__tab" aria-current={current(3)}>
        <span className="tabbar__slot"><BrocaCoin /></span>
        <span>$BROCA</span>
      </Link>

      <Link to="/setup" className="tabbar__tab" aria-current={current(4)}>
        <span className="tabbar__slot"><SetupIcon /></span>
        <span>Setup</span>
      </Link>
    </nav>
  );
}
