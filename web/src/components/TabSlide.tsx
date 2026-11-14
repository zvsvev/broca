import { useLayoutEffect, useRef, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { tabIndex } from "./TabBar";

export function TabSlide({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const idx = tabIndex(pathname);
  const prev = useRef(idx);
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const from = prev.current;
    prev.current = idx;
    if (from === idx || !ref.current?.animate) return;
    if (!window.matchMedia("(max-width: 820px)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const dx = idx > from ? 28 : -28;
    ref.current.animate(
      [
        { opacity: 0, transform: `translateX(${dx}px)` },
        { opacity: 1, transform: "translateX(0)" },
      ],
      { duration: 220, easing: "cubic-bezier(.2, .8, .2, 1)" }
    );
  }, [idx]);

  return (
    <div ref={ref} className="tabslide">
      {children}
    </div>
  );
}
