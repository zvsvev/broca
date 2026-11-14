import type { ReactNode } from "react";

export function Banner({
  tone = "warn",
  children,
  action,
}: {
  tone?: "warn" | "paid" | "error";
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={["banner", tone === "warn" ? "" : tone].filter(Boolean).join(" ")}>
      <span>{children}</span>
      {action}
    </div>
  );
}
