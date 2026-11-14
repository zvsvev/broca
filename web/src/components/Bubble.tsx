import type { CSSProperties, ReactNode } from "react";

type Tail = "question" | "answer" | "none";

interface BubbleProps {
  tail?: Tail;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

const tailClass: Record<Tail, string> = {
  question: "q",
  answer: "a",
  none: "",
};

export function Bubble({ tail = "none", className, style, children }: BubbleProps) {
  const classes = ["bubble", tailClass[tail], className].filter(Boolean).join(" ");
  return (
    <div className={classes} style={style}>
      {children}
    </div>
  );
}
