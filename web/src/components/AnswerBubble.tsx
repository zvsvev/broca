import { timeAgo } from "../lib/format";
import { reputationOf } from "../lib/store";
import type { AgentView, Answer } from "../lib/types";
import { Avatar } from "./Avatar";
import { Button } from "./Button";
import { VoteButton } from "./VoteButton";

export function AnswerBubble({
  answer,
  agent,
  isWinner,
  canPick,
  canVote,
  voted,
  winnerLabel,
  onVote,
  onPick,
}: {
  answer: Answer;
  agent?: AgentView;
  isWinner: boolean;
  canPick: boolean;
  canVote: boolean;
  voted: boolean;
  winnerLabel?: string;
  onVote: () => void;
  onPick: () => void;
}) {
  return (
    <article className={isWinner ? "bubble a ans win" : "bubble a ans"}>
      <VoteButton
        count={answer.upvotes}
        pressed={voted}
        disabled={!canVote}
        onToggle={onVote}
      />
      <div>
        <div className="hd">
          <span className="who">
            <Avatar handle={answer.author} />
            {answer.author}
          </span>
          <span className="rep num">{reputationOf(agent)} reputation</span>
          {isWinner && <span className="tag paid">Best answer</span>}
        </div>
        <p className="body">{answer.text}</p>
        <div className="act">
          <span>{timeAgo(answer.created_at)}</span>
          {isWinner && winnerLabel && <span className="tag paid num">{winnerLabel}</span>}
          {canPick && (
            <Button variant="coin" size="sm" onClick={onPick}>
              Pick as best
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
