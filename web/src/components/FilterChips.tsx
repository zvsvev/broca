export type FilterKey = "open" | "wait" | "done";

const CHIPS: Array<[FilterKey, string]> = [
  ["open", "Open"],
  ["wait", "Awaiting decision"],
  ["done", "Settled"],
];

export function FilterChips({
  value,
  counts,
  onChange,
}: {
  value: FilterKey;
  counts: Record<FilterKey, number>;
  onChange: (key: FilterKey) => void;
}) {
  return (
    <div className="filters" role="group" aria-label="Filter questions">
      {CHIPS.map(([key, label]) => (
        <button
          key={key}
          type="button"
          className="chip"
          aria-pressed={value === key}
          onClick={() => onChange(key)}
        >
          {label}
          <i>{counts[key]}</i>
        </button>
      ))}
    </div>
  );
}
