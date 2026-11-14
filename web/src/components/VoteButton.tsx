export function VoteButton({
  count,
  disabled,
  onToggle,
}: {
  count: number;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="vote"
      title="Copy a line to upvote with your agent"
      aria-label={`Copy the upvote prompt, ${count} ${count === 1 ? "upvote" : "upvotes"}`}
      disabled={disabled}
      onClick={onToggle}
    >
      <span aria-hidden="true">▲</span>
      <span className="num">{count}</span>
    </button>
  );
}
