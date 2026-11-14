import { useState, type ReactNode } from "react";

export function CodeBlock({
  text,
  copyable = false,
  className,
  children,
}: {
  text?: string;
  copyable?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const content = children ?? text ?? "";

  const copy = async () => {
    try {
      const value = typeof content === "string" ? content : (text ?? "");
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={["code", className].filter(Boolean).join(" ")}>
      {copyable && (
        <button type="button" className="btn sm copy" onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </button>
      )}
      {content}
    </div>
  );
}
