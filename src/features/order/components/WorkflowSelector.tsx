import { Scissors, Shirt } from "lucide-react";
import type { WorkflowMode } from "../../../types";
import { EmptyState, Surface, cx } from "../../../components/ui/primitives";

type WorkflowSelectorProps = {
  activeWorkflow: WorkflowMode | null;
  hasAlterationContent: boolean;
  hasCustomContent: boolean;
  onActivate: (workflow: WorkflowMode) => void;
};

export function WorkflowSelector({
  activeWorkflow,
  hasAlterationContent,
  hasCustomContent,
  onActivate,
}: WorkflowSelectorProps) {
  const options = [
    {
      key: "alteration" as const,
      icon: Scissors,
      title: "Alterations",
      subtitle: "Garment and services",
      enabled: hasAlterationContent,
    },
    {
      key: "custom" as const,
      icon: Shirt,
      title: "Custom garment",
      subtitle: "Measurements and style",
      enabled: hasCustomContent,
    },
  ];

  return (
    <Surface tone="control" className="px-3.5 py-3">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <div className="app-kicker text-[var(--app-text-muted)]">Service type</div>
        {activeWorkflow ? <div className="app-text-caption">Switch modes</div> : null}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {options.map((option) => {
          const Icon = option.icon;
          const isActive = activeWorkflow === option.key;

          return (
            <button
              key={option.key}
              onClick={() => onActivate(option.key)}
              className={cx(
                "rounded-[var(--app-radius-md)] border px-3.5 py-3 text-left transition",
                isActive
                  ? "border-[var(--app-accent)] bg-[var(--app-surface)] text-[var(--app-text)] shadow-[var(--app-shadow-sm)]"
                  : "border-[var(--app-border)]/60 bg-[var(--app-surface)]/28 text-[var(--app-text-muted)] hover:bg-[var(--app-surface)]/42 hover:text-[var(--app-text)]",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cx(
                    "mt-0.5 rounded-[var(--app-radius-sm)] border p-1.5",
                    isActive
                      ? "border-[var(--app-border-strong)] bg-[var(--app-surface-muted)] text-[var(--app-text)]"
                      : "border-[var(--app-border)]/60 bg-[var(--app-surface-muted)]/55 text-[var(--app-text-soft)]",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <div className={cx("app-text-strong", !isActive && "text-[var(--app-text-muted)]")}>{option.title}</div>
                  <div className="app-text-caption mt-1">{option.subtitle}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {activeWorkflow === null ? <EmptyState className="mt-3">Choose a service type to start.</EmptyState> : null}
    </Surface>
  );
}
