import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="layout">
      <div className="content">{children}</div>
      <Sidebar />
    </div>
  );
}
