export function VoteButton({
  count,
  pressed,
  disabled,
  onToggle,
}: {
  count: number;
  pressed: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="vote"
      aria-pressed={pressed}
      aria-label={`Upvote, ${count} ${count === 1 ? "upvote" : "upvotes"}`}
      disabled={disabled}
      onClick={onToggle}
    >
      <span aria-hidden="true">▲</span>
      <span className="num">{count}</span>
    </button>
  );
}
