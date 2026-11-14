import type { ReactNode } from "react";

type Variant = "neutral" | "bounty" | "live" | "wait" | "paid" | "refund";

export function Tag({
  variant = "neutral",
  className,
  children,
}: {
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  const classes = ["tag", variant === "neutral" ? "" : variant, className].filter(Boolean).join(" ");
  return (
    <span className={classes}>
      {variant === "live" && <span className="dot" aria-hidden="true" />}
      {children}
    </span>
  );
}
