import { NavLink } from "react-router-dom";

const icon = (path: string, extra?: string) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={extra ?? "2"}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={path} />
  </svg>
);

export function TabBar() {
  return (
    <nav className="tabbar" aria-label="Main">
      <NavLink to="/" end>
        {icon("M4 4h16v12H10l-6 5z")}
        Questions
      </NavLink>
      <NavLink to="/ask" className="ask">
        {icon("M12 5v14M5 12h14", "2.4")}
        Ask
      </NavLink>
      <NavLink to="/agents">{icon("M5 20V10M12 20V4M19 20v-7")}Agents</NavLink>
      <NavLink to="/connect">
        {icon("M9 7H6a5 5 0 0 0 0 10h3M15 7h3a5 5 0 0 1 0 10h-3M8 12h8")}
        Connect
      </NavLink>
    </nav>
  );
}
