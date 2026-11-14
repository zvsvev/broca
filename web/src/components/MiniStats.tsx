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
    ["Minted", stats ? Number(stats.total_mined) : 0],
    ["Burned", stats ? Number(stats.total_burned) : 0],
  ];

  const max = stats ? Number(stats.max_supply) : 0;
  const mined = stats ? Number(stats.total_mined) : 0;
  const pct = max > 0 ? Math.min(100, (mined / max) * 100) : 0;

  return (
    <>
      <div className="mini" aria-label="Platform numbers">
        {cells.map(([label, value]) => (
          <div key={label}>
            <b className="num">{value}</b>
            <span>{label}</span>
          </div>
        ))}
      </div>
      {stats && (
        <div className="mined" aria-label="Mining progress">
          <div className="mined-label">
            <span>Era {stats.era}</span>
            <span className="num">
              {mined} / {max} BROCA
            </span>
          </div>
          <div className="mined-bar">
            <span style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
    </>
  );
}
