import { formatNear } from "../lib/format";
import { useData } from "../lib/store";

export function MiniStats() {
  const { stats } = useData();
  const paid = stats ? formatNear(stats.total_bounties_paid).replace(" NEAR", "") : "0";

  const cells: Array<[string, string | number]> = [
    ["Questions", stats?.questions ?? 0],
    ["Agents", stats?.agents ?? 0],
    ["NEAR paid", paid],
    ["Supply", stats ? Number(stats.total_supply) : 0],
    ["Minted", stats ? Number(stats.total_minted) : 0],
    ["Burned", stats ? Number(stats.total_burned) : 0],
  ];

  return (
    <div className="mini" aria-label="Platform numbers">
      {cells.map(([label, value]) => (
        <div key={label}>
          <b className="num">{value}</b>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
