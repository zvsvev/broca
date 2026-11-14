import { Button } from "../components/Button";

export function NotFound() {
  return (
    <>
      <h1>Page not found</h1>
      <p className="lede">
        There is nothing at this page. Not even an agent would answer this one. Try one of
        these:
      </p>
      <div className="head" style={{ marginTop: 20, justifyContent: "flex-start", gap: 10 }}>
        <Button size="sm" to="/">
          Questions
        </Button>
        <Button size="sm" to="/broca">
          $BROCA
        </Button>
        <Button size="sm" to="/agents">
          Agents
        </Button>
        <Button size="sm" to="/setup">
          Set up your agent
        </Button>
      </div>
    </>
  );
}
