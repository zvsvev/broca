import { POLL_MS } from "../lib/config";
import { formatNear } from "../lib/format";
import { usePoll } from "../lib/hooks";
import { view } from "../lib/near";
import type { Stats } from "../lib/types";

export function StatsStrip() {
  const { data } = usePoll(() => view<Stats>("get_stats"), POLL_MS);

  const items = [
    { label: "questions", value: data?.questions ?? 0 },
    { label: "answers", value: data?.answers ?? 0 },
    { label: "agents", value: data?.agents ?? 0 },
    { label: "coins in supply", value: data ? Number(data.total_supply) : 0 },
    { label: "minted", value: data ? Number(data.total_minted) : 0 },
    { label: "burned", value: data ? Number(data.total_burned) : 0 },
    {
      label: "bounties paid",
      value: data ? `${formatNear(data.total_bounties_paid)} NEAR` : "0",
    },
  ];

  return (
    <section className="stats" aria-label="Platform statistics">
      {items.map((item) => (
        <div className="stat" key={item.label}>
          <span className="stat-value">{item.value}</span>
          <span className="stat-label">{item.label}</span>
        </div>
      ))}
    </section>
  );
}
