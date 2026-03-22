import { CalendarDays, MapPin, Package } from "lucide-react";
import { EmptyState } from "../../../components/ui/primitives";

type HomeLaneEmptyStateProps = {
  kind: "appointment" | "pickup";
  dayLabel: string;
  activeLocationLabel?: string;
  dateLabel?: string;
};

export function HomeLaneEmptyState({
  kind,
  dayLabel,
  activeLocationLabel,
  dateLabel,
}: HomeLaneEmptyStateProps) {
  const title = kind === "appointment" ? "No appointments scheduled" : "No pickups scheduled";
  const detail = activeLocationLabel
    ? `Nothing is scheduled at ${activeLocationLabel} for ${dayLabel.toLowerCase()}.`
    : `Nothing is scheduled for ${dayLabel.toLowerCase()}.`;
  const caption = activeLocationLabel
    ? `Filtered to ${activeLocationLabel}`
    : dateLabel;
  const Icon = kind === "appointment" ? CalendarDays : Package;

  return (
    <div className="border-t border-[var(--app-border)]/55 px-4 py-4">
      <EmptyState className="rounded-[var(--app-radius-md)] border-dashed bg-[var(--app-surface-muted)]/35 px-4 py-4 shadow-none">
        <div className="flex items-start gap-3">
          <div className="app-icon-chip">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="app-text-overline">{title}</div>
            <div className="app-text-body mt-2">{detail}</div>
            {caption ? (
              <div className="app-text-caption mt-2 flex items-center gap-1.5">
                {activeLocationLabel ? <MapPin className="h-3.5 w-3.5 shrink-0" /> : null}
                <span>{caption}</span>
              </div>
            ) : null}
          </div>
        </div>
      </EmptyState>
    </div>
  );
}
