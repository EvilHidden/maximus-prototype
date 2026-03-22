import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

type ToastOptions = {
  duration?: number;
};

type ToastState = {
  message: string;
  duration: number;
  id: number;
} | null;

type ToastContextValue = {
  showToast: (message: string, options?: ToastOptions) => void;
  clearToast: () => void;
};

const DEFAULT_TOAST_DURATION = 2500;

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);
  const timeoutRef = useRef<number | null>(null);

  const clearToast = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setToast(null);
  }, []);

  const showToast = useCallback(
    (message: string, options?: ToastOptions) => {
      const nextDuration = options?.duration ?? DEFAULT_TOAST_DURATION;

      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }

      setToast({
        message,
        duration: nextDuration,
        id: Date.now(),
      });
    },
    [],
  );

  useEffect(() => {
    if (!toast) {
      return;
    }

    timeoutRef.current = window.setTimeout(() => {
      setToast(null);
      timeoutRef.current = null;
    }, toast.duration);

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [toast]);

  const value = useMemo(
    () => ({
      showToast,
      clearToast,
    }),
    [showToast, clearToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <div className="pointer-events-none fixed bottom-5 left-1/2 z-50 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2">
          <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border-strong)] bg-[var(--app-accent)] px-4 py-3 text-sm font-medium text-[var(--app-accent-contrast)] shadow-[var(--app-shadow-lg)]">
            {toast.message}
          </div>
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider.");
  }

  return context;
}
