import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { EXPLORER_BASE } from "../lib/config";

interface ToastOptions {
  txHash?: string;
  error?: boolean;
}

interface ToastState extends ToastOptions {
  message: string;
  key: number;
}

type ShowToast = (message: string, options?: ToastOptions) => void;

const ToastContext = createContext<ShowToast>(() => {});

const DURATION_MS = 3800;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<number | undefined>(undefined);

  const show = useCallback<ShowToast>((message, options) => {
    setToast({ message, ...options, key: Date.now() });
    setVisible(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setVisible(false), DURATION_MS);
  }, []);

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className={["toast", visible ? "show" : "", toast?.error ? "error" : ""]
          .filter(Boolean)
          .join(" ")}
        role="status"
        aria-live="polite"
      >
        {toast && (
          <>
            <span>{toast.message}</span>
            {toast.txHash && (
              <a
                href={`${EXPLORER_BASE}/txns/${toast.txHash}`}
                target="_blank"
                rel="noreferrer"
              >
                View transaction
              </a>
            )}
          </>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ShowToast {
  return useContext(ToastContext);
}
