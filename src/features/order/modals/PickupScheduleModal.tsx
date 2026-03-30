import { useEffect, useState } from "react";
import type { AlterationPickup, CustomOccasion, CustomOrderEventType, PickupLocation } from "../../../types";
import { ActionButton, Callout, FieldLabel, ModalShell } from "../../../components/ui/primitives";
import { ModalFooterActions, ModalSectionHeading } from "../../../components/ui/modalPatterns";

type PickupScheduleModalProps =
  | {
      scope: "alteration";
      schedule: AlterationPickup;
      pickupLocations: PickupLocation[];
      onChange: (patch: AlterationPickup) => void;
      onClose: () => void;
    }
  | {
      scope: "custom";
      schedule: CustomOccasion;
      pickupLocations: PickupLocation[];
      onChange: (patch: CustomOccasion) => void;
      onClose: () => void;
    };

function formatDateInputValue(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTimeInputValue(value: Date) {
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function roundUpToQuarterHour(value: Date) {
  const next = new Date(value);
  next.setSeconds(0, 0);
  const minutes = next.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 15) * 15;
  next.setMinutes(roundedMinutes);

  if (roundedMinutes === 60) {
    next.setHours(next.getHours() + 1, 0, 0, 0);
  }

  return next;
}

function formatTimeLabel(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function buildTimeOptions(now: Date, isToday: boolean) {
  const options: string[] = [];
  const start = isToday ? roundUpToQuarterHour(now) : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0, 0);
  const cursor = new Date(start);

  if (!isToday) {
    cursor.setHours(9, 0, 0, 0);
  }

  const end = new Date(cursor);
  end.setHours(19, 0, 0, 0);

  while (cursor <= end) {
    options.push(formatTimeInputValue(cursor));
    cursor.setMinutes(cursor.getMinutes() + 15);
  }

  return options;
}

const customEventOptions: Array<{ value: CustomOrderEventType; label: string }> = [
  { value: "none", label: "None" },
  { value: "wedding", label: "Wedding" },
  { value: "prom", label: "Prom" },
  { value: "anniversary", label: "Anniversary" },
];

export function PickupScheduleModal({ scope, schedule, pickupLocations, onChange, onClose }: PickupScheduleModalProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const minPickupDate = formatDateInputValue(now);
  const isAlterationScope = scope === "alteration";
  const isTodayPickup = isAlterationScope && schedule.pickupDate === minPickupDate;
  const selectedPickupDateTime =
    isAlterationScope && schedule.pickupDate && schedule.pickupTime
      ? new Date(`${schedule.pickupDate}T${schedule.pickupTime}`)
      : null;
  const hasPastPickupSelection =
    selectedPickupDateTime !== null && !Number.isNaN(selectedPickupDateTime.getTime()) && selectedPickupDateTime < now;
  const timeOptions = isAlterationScope && schedule.pickupDate ? buildTimeOptions(now, isTodayPickup) : [];
  const selectedTimeIsUnavailable = isAlterationScope && !!schedule.pickupTime && !timeOptions.includes(schedule.pickupTime);
  const pickupInvalid = isAlterationScope
    ? !schedule.pickupDate || !schedule.pickupTime || !schedule.pickupLocation || hasPastPickupSelection || selectedTimeIsUnavailable
    : schedule.eventType !== "none" && !schedule.eventDate;

  return (
    <ModalShell
      title={scope === "alteration" ? "Set alteration pickup" : "Set occasion"}
      onClose={onClose}
      widthClassName="max-w-[720px]"
      footer={
        <ModalFooterActions
          leading={
            <div className="app-text-caption">
            {isAlterationScope && (hasPastPickupSelection || selectedTimeIsUnavailable)
              ? "Pickup must be scheduled for an available future time."
              : isAlterationScope
                ? "Required before moving the order forward."
                : "Wedding, prom, and anniversary dates help with reminders and follow-up."}
            </div>
          }
        >
          <ActionButton tone="primary" onClick={onClose} disabled={pickupInvalid}>
            {isAlterationScope ? "Save pickup" : "Save occasion"}
          </ActionButton>
        </ModalFooterActions>
      }
    >
      <div className="space-y-5">
        {isAlterationScope ? (
          <>
            <ModalSectionHeading
              eyebrow="Pickup timing"
              title="Set when the customer can collect it"
              description="Choose a date first, then pick a shop time."
            />
            <label className="block text-sm">
              <FieldLabel>Pickup date</FieldLabel>
              <input
                value={schedule.pickupDate}
                onChange={(event) =>
                  onChange({
                    pickupDate: event.target.value,
                    pickupTime:
                      event.target.value === schedule.pickupDate && !selectedTimeIsUnavailable
                        ? schedule.pickupTime
                        : "",
                    pickupLocation: schedule.pickupLocation,
                  })
                }
                type="date"
                min={minPickupDate}
                className="app-input min-h-12 text-base"
              />
            </label>

            <div>
              <FieldLabel>Pickup time</FieldLabel>
              {schedule.pickupDate ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                  {timeOptions.map((timeOption) => {
                    const isSelected = schedule.pickupTime === timeOption;
                    return (
                      <button
                        key={timeOption}
                        type="button"
                        onClick={() => onChange({
                          pickupDate: schedule.pickupDate,
                          pickupTime: timeOption,
                          pickupLocation: schedule.pickupLocation,
                        })}
                        className={[
                          "min-h-12 rounded-[var(--app-radius-md)] border px-3 py-2 text-sm font-medium transition",
                          isSelected
                            ? "border-[var(--app-accent)] bg-[var(--app-accent)] text-[var(--app-accent-contrast)]"
                            : "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)] hover:bg-[var(--app-surface-muted)]",
                        ].join(" ")}
                      >
                        {formatTimeLabel(timeOption)}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <Callout tone="default">
                  <div className="app-text-caption">Choose a pickup date first to see available times.</div>
                </Callout>
              )}
            </div>
          </>
        ) : (
          <>
            <ModalSectionHeading
              eyebrow="Occasion"
              title="Add an event only when it matters to the garment"
              description="This is optional."
            />
            <div>
              <FieldLabel>Event type</FieldLabel>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {customEventOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange({
                      eventType: option.value,
                      eventDate: option.value === "none" ? "" : schedule.eventDate,
                    })}
                    className={[
                      "min-h-12 rounded-[var(--app-radius-md)] border px-4 py-3 text-sm font-medium transition",
                      schedule.eventType === option.value
                        ? "border-[var(--app-accent)] bg-[var(--app-accent)] text-[var(--app-accent-contrast)]"
                        : "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)] hover:bg-[var(--app-surface-muted)]",
                    ].join(" ")}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {schedule.eventType !== "none" ? (
              <label className="block text-sm">
                <FieldLabel>Occasion date</FieldLabel>
                <input
                  value={schedule.eventDate}
                    onChange={(event) =>
                      onChange({
                        eventType: schedule.eventType,
                        eventDate: event.target.value,
                      })
                    }
                  type="date"
                  min={minPickupDate}
                  className="app-input min-h-12 text-base"
                />
              </label>
            ) : (
              <Callout tone="default">
                <div className="app-text-caption">No occasion attached to this garment.</div>
              </Callout>
            )}
          </>
        )}

        {isAlterationScope ? (
          <div>
            <ModalSectionHeading
              eyebrow="Pickup location"
              title="Choose where the handoff happens"
              description="Pick the shop for this handoff."
            />
            <FieldLabel>Pickup location</FieldLabel>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {pickupLocations.map((location) => (
                <button
                  key={location}
                  type="button"
                  onClick={() => onChange({
                    pickupDate: schedule.pickupDate,
                    pickupTime: schedule.pickupTime,
                    pickupLocation: location,
                  })}
                  className={[
                    "min-h-12 rounded-[var(--app-radius-md)] border px-4 py-3 text-left text-sm font-medium transition",
                    schedule.pickupLocation === location
                      ? "border-[var(--app-accent)] bg-[var(--app-accent)] text-[var(--app-accent-contrast)]"
                      : "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)] hover:bg-[var(--app-surface-muted)]",
                  ].join(" ")}
                >
                  {location}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </ModalShell>
  );
}
