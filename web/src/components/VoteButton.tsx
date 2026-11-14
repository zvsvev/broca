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
      title="Upvote via agent"
      aria-label={`Upvote via agent (${count})`}
      disabled={disabled}
      onClick={onToggle}
    >
      <span aria-hidden="true">▲</span>
      <span className="num">{count}</span>
    </button>
  );
}
