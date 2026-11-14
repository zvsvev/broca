import { timeLeft } from "../lib/format";
import type { Phase } from "../lib/phase";
import { Tag } from "./Tag";

export function StatusTag({ phase, deadline }: { phase: Phase; deadline: number | string }) {
  switch (phase) {
    case "open":
      return (
        <Tag variant="live" className="num">
          {timeLeft(deadline)}
        </Tag>
      );
    case "grace":
      return <Tag variant="wait">Asker is deciding</Tag>;
    case "settleable":
      return <Tag variant="wait">Ready to settle</Tag>;
    case "settled":
      return <Tag variant="paid">Paid</Tag>;
    case "refunded":
      return <Tag variant="refund">Refunded</Tag>;
  }
}
