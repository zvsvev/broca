import type { CSSProperties } from "react";
import "./loader.css";

/** Full-pane loader: the brain breathes and the b and r draw themselves. Use for first load of a pane. */
export function BrainLoader({ size = 96, label = "Loading" }: { size?: number; label?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" role="status" aria-label={label}>
      <g className="bl-brain"><g transform="translate(64 62) scale(.9) translate(-64 -62)"><g fill="#1D1640" stroke="#1D1640" strokeWidth="8" strokeLinejoin="round"><circle cx="40" cy="30" r="20"/><circle cx="21" cy="56" r="21"/><circle cx="30" cy="85" r="19"/><circle cx="52" cy="89" r="17"/><circle cx="44" cy="60" r="32"/><circle cx="88" cy="30" r="20"/><circle cx="107" cy="56" r="21"/><circle cx="98" cy="85" r="19"/><circle cx="76" cy="89" r="17"/><circle cx="84" cy="60" r="32"/><path d="M14 84L5 119L45 99Z"/></g><g fill="#2A68F7"><circle cx="40" cy="30" r="20"/><circle cx="21" cy="56" r="21"/><circle cx="30" cy="85" r="19"/><circle cx="52" cy="89" r="17"/><circle cx="44" cy="60" r="32"/><circle cx="88" cy="30" r="20"/><circle cx="107" cy="56" r="21"/><circle cx="98" cy="85" r="19"/><circle cx="76" cy="89" r="17"/><circle cx="84" cy="60" r="32"/><path d="M14 84L5 119L45 99Z"/></g><g stroke="#1D1640" fill="none" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round"><path d="M29.7 26.2A11 11 0 0 1 43.8 19.7"/><path d="M11.5 61.5A11 11 0 0 1 17.2 45.7"/><path d="M21.3 90.0A10 10 0 0 1 24.3 76.8"/><path d="M84.2 19.7A11 11 0 0 1 98.3 26.2"/><path d="M110.8 45.7A11 11 0 0 1 116.5 61.5"/><path d="M103.7 76.8A10 10 0 0 1 106.7 90.0"/><path d="M64 47C61 56 67 64 64 74C61 84 66 92 64 100"/></g><g stroke="#1D1640" fill="none" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round"><path className="bl-l bl-l1" pathLength="1" d="M33 40V86"/><path className="bl-l bl-l2" pathLength="1" d="M33 74a11.5 11.5 0 1 0 23 0a11.5 11.5 0 1 0-23 0"/><path className="bl-l bl-l3" pathLength="1" d="M81 62V86"/><path className="bl-l bl-l4" pathLength="1" d="M81 74A12 12 0 0 1 93 62"/></g></g></g>
    </svg>
  );
}

/** "An agent is answering" bubble. Use where answers are expected to arrive. */
export function TypingBubble({ label = "Loading" }: { label?: string }) {
  return (
    <svg width={72} height={40} viewBox="0 0 72 40" role="status" aria-label={label}>
      <path d="M2 2H52a18 18 0 0 1 0 36H20a18 18 0 0 1-18-18Z" fill="#fff" stroke="#1D1640" strokeWidth="2" strokeLinejoin="round"/>
      <circle className="bl-d bl-d1" cx="22" cy="20" r="3.6" fill="#2A68F7"/><circle className="bl-d bl-d2" cx="36" cy="20" r="3.6" fill="#2A68F7"/><circle className="bl-d bl-d3" cx="50" cy="20" r="3.6" fill="#2A68F7"/>
    </svg>
  );
}

/** Three dots in currentColor. Use inside a button while a transaction is pending. */
export function Dots({ label = "Loading" }: { label?: string }) {
  return (
    <svg width={32} height={14} viewBox="0 0 32 14" role="status" aria-label={label} style={{ verticalAlign: "middle" }}>
      <circle className="bl-d bl-d1" cx="5" cy="9" r="3" fill="currentColor"/><circle className="bl-d bl-d2" cx="16" cy="9" r="3" fill="currentColor"/><circle className="bl-d bl-d3" cx="27" cy="9" r="3" fill="currentColor"/>
    </svg>
  );
}

/** Skeleton shapes with the same tails as real bubbles. Give them the size of the real thing. */
export function Skeleton({ shape, style }: { shape: "q" | "a" | "pill"; style?: CSSProperties }) {
  return <div className={`bl-skel ${shape}`} style={style} aria-hidden="true" />;
}
