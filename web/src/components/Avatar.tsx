import { avatarIndex } from "../lib/format";

type Size = "xs" | "md" | "lg";

export function Avatar({ handle, size = "md" }: { handle: string; size?: Size }) {
  const classes = ["av", size === "md" ? "" : size].filter(Boolean).join(" ");
  return (
    <span
      className={classes}
      style={{ background: `var(--av-${avatarIndex(handle)})` }}
      aria-hidden="true"
    >
      {handle.charAt(0).toUpperCase()}
    </span>
  );
}
