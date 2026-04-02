import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cx } from "./primitives";

type ToastOptions = {
  duration?: number;
  title?: string;
  tone?: "default" | "success" | "warning" | "danger";
};

type ToastState = {
  message: string;
  duration: number;
  id: number;
  title?: string;
  tone: NonNullable<ToastOptions["tone"]>;
};

type ToastContextValue = {
  showToast: (message: string, options?: ToastOptions) => void;
  clearToast: () => void;
};

const DEFAULT_TOAST_DURATION = 2500;
const MAX_VISIBLE_TOASTS = 3;

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const timeoutRef = useRef<Map<number, number>>(new Map());

  const dismissToast = useCallback((toastId: number) => {
    const timeout = timeoutRef.current.get(toastId);
    if (timeout !== undefined) {
      window.clearTimeout(timeout);
      timeoutRef.current.delete(toastId);
    }

    setToasts((current) => current.filter((toast) => toast.id !== toastId));
  }, []);

  const clearToast = useCallback(() => {
    timeoutRef.current.forEach((timeout) => window.clearTimeout(timeout));
    timeoutRef.current.clear();
    setToasts([]);
  }, []);

  const showToast = useCallback(
    (message: string, options?: ToastOptions) => {
      const nextDuration = options?.duration ?? DEFAULT_TOAST_DURATION;
      const nextToast = {
        message,
        duration: nextDuration,
        id: Date.now() + Math.floor(Math.random() * 1000),
        title: options?.title,
        tone: options?.tone ?? "default",
      } satisfies ToastState;

      setToasts((current) => [...current.slice(-(MAX_VISIBLE_TOASTS - 1)), nextToast]);

      const timeout = window.setTimeout(() => {
        dismissToast(nextToast.id);
      }, nextDuration);

      timeoutRef.current.set(nextToast.id, timeout);
    },
    [dismissToast],
  );

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
      {toasts.length ? (
        <div
          className="app-toast-stack fixed left-1/2 top-[max(0.75rem,env(safe-area-inset-top))] z-50 w-[min(32rem,calc(100vw-1rem))] -translate-x-1/2 px-2 sm:w-[min(28rem,calc(100vw-2rem))]"
          role="region"
          aria-label="Notifications"
        >
          {[...toasts].reverse().map((toast, index) => {
            const Icon =
              toast.tone === "success"
                ? CheckCircle2
                : toast.tone === "warning" || toast.tone === "danger"
                  ? TriangleAlert
                  : Info;

            return (
              <div
                key={toast.id}
                className={cx(
                  "app-toast",
                  toast.tone === "success" && "app-toast--success",
                  toast.tone === "warning" && "app-toast--warning",
                  toast.tone === "danger" && "app-toast--danger",
                )}
                style={{
                  zIndex: MAX_VISIBLE_TOASTS - index,
                  transform: `translateY(${index * -6}px) scale(${1 - index * 0.018})`,
                  opacity: 1 - index * 0.12,
                }}
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                <div className="app-toast__icon">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  {toast.title ? <div className="app-toast__title">{toast.title}</div> : null}
                  <div className="app-toast__message">{toast.message}</div>
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="app-toast__dismiss"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
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
