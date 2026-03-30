import type { ReactNode } from "react";
import { ActionButton } from "./buttons";
import { cx } from "./utils";

type ModalShellProps = {
  title: string;
  subtitle?: string;
  onClose: () => void;
  showCloseButton?: boolean;
  widthClassName?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function ModalShell({
  title,
  subtitle,
  onClose,
  showCloseButton = true,
  widthClassName = "max-w-[520px]",
  children,
  footer,
}: ModalShellProps) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="app-modal-scrim absolute inset-0" onClick={onClose} />
      <div className={cx("app-modal absolute left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2", widthClassName)}>
        <div className="mb-3.5 flex items-start justify-between gap-4">
          <div>
            <div className="app-section-title">{title}</div>
            {subtitle ? <div className="app-section-copy">{subtitle}</div> : null}
          </div>
          {showCloseButton ? (
            <ActionButton tone="secondary" onClick={onClose} className="px-3 py-2 text-xs">
              Close
            </ActionButton>
          ) : null}
        </div>
        <div>{children}</div>
        {footer ? <div className="mt-4 border-t border-[var(--app-border)]/55 pt-3.5">{footer}</div> : null}
      </div>
    </div>
  );
}
