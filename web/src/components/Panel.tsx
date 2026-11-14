import type { ReactNode } from "react";

export function Panel({
  title,
  className,
  children,
}: {
  title?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={["panel", className].filter(Boolean).join(" ")}>
      {title && <h3>{title}</h3>}
      {children}
    </section>
  );
}

export function KV({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="kv">
      <span>{label}</span>
      <b className="num">{children}</b>
    </div>
  );
}
