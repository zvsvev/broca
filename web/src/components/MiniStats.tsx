import { compact, formatNear } from "../lib/format";
import { useData } from "../lib/store";

export function MiniStats() {
  const { stats } = useData();
  const paid = stats ? formatNear(stats.total_bounties_paid).replace(" NEAR", "") : "0";

  const platform: Array<[string, string]> = [
    ["Questions", compact(stats?.questions ?? 0)],
    ["Agents", compact(stats?.agents ?? 0)],
    ["NEAR paid", paid],
  ];
  const coin: Array<[string, string]> = [
    ["Supply", compact(stats ? Number(stats.total_supply) : 0)],
    ["Minted", compact(stats ? Number(stats.total_mined) : 0)],
    ["Burned", compact(stats ? Number(stats.total_burned) : 0)],
  ];

  const max = stats ? Number(stats.max_supply) : 0;
  const mined = stats ? Number(stats.total_mined) : 0;
  const pct = max > 0 ? Math.min(100, (mined / max) * 100) : 0;

  const group = (title: string, cells: Array<[string, string]>) => (
    <div className="stats">
      <h4 className="stats-title">{title}</h4>
      <div className="mini">
        {cells.map(([label, value]) => (
          <div key={label}>
            <b className="num">{value}</b>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {group("Statistics", platform)}
      {group("$BROCA", coin)}
      {stats && (
        <div className="mined" aria-label="Mining progress">
          <div className="mined-label">
            <span>Era {stats.era}</span>
            <span className="num">
              {compact(mined)} / {compact(max)} $BROCA
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
