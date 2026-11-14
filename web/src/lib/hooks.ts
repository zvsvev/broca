import { useEffect, useState } from "react";

export function usePoll<T>(fn: () => Promise<T>, ms: number, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        const value = await fn();
        if (active) {
          setData(value);
          setError("");
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (active) setLoading(false);
      }
    };

    run();
    const timer = setInterval(run, ms);
    return () => {
      active = false;
      clearInterval(timer);
    };
    // fn is intentionally excluded: callers pass stable closures.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, loading };
}
