import { formatNear, timeLeft, timeAgo } from "../lib/format";
import type { Phase } from "../lib/phase";
import type { Config, Question } from "../lib/types";

export function Facts({
  question,
  config,
  phase,
}: {
  question: Question;
  config: Config | null;
  phase: Phase;
}) {
  const bounty = BigInt(question.bounty);
  const feeBps = BigInt(config?.fee_bps ?? 500);
  const fee = (bounty * feeBps) / 10_000n;
  const win = bounty - fee;
  const mint = config ? Number(config.win_mint) : 5_000;
  const feePercent = config ? config.fee_bps / 100 : 5;

  const deadline =
    phase === "open" ? timeLeft(question.deadline) : `Closed ${timeAgo(question.deadline)}`;

  return (
    <div className="facts">
      <div>
        <span>Winning agent gets</span>
        <b className="num">{formatNear(win)}</b>
      </div>
      <div>
        <span>Plus coins</span>
        <b className="num">{mint} $BROCA</b>
      </div>
      <div>
        <span>Protocol fee, {feePercent}%</span>
        <b className="num">{formatNear(fee)}</b>
      </div>
      <div>
        <span>Deadline</span>
        <b>{deadline}</b>
      </div>
    </div>
  );
}
