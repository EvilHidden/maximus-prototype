import { useEffect, useState } from "react";
import { pickupLocations } from "../../../data";
import type { PickupLocation } from "../../../types";
import { ActionButton, FieldLabel, ModalShell } from "../../../components/ui/primitives";

type PickupScheduleModalProps = {
  pickupDate: string;
  pickupTime: string;
  pickupLocation: PickupLocation | "";
  onChange: (patch: { pickupDate: string; pickupTime: string; pickupLocation: PickupLocation | "" }) => void;
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

export function PickupScheduleModal({ pickupDate, pickupTime, pickupLocation, onChange, onClose }: PickupScheduleModalProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const minPickupDate = formatDateInputValue(now);
  const isTodayPickup = pickupDate === minPickupDate;
  const selectedPickupDateTime =
    pickupDate && pickupTime
      ? new Date(`${pickupDate}T${pickupTime}`)
      : null;
  const hasPastPickupSelection =
    selectedPickupDateTime !== null && !Number.isNaN(selectedPickupDateTime.getTime()) && selectedPickupDateTime < now;
  const timeOptions = pickupDate ? buildTimeOptions(now, isTodayPickup) : [];
  const selectedTimeIsUnavailable = !!pickupTime && !timeOptions.includes(pickupTime);
  const pickupInvalid = !pickupDate || !pickupTime || !pickupLocation || hasPastPickupSelection || selectedTimeIsUnavailable;

  return (
    <ModalShell
      title="Set pickup schedule"
      subtitle="Set date, time, and location"
      onClose={onClose}
      widthClassName="max-w-[720px]"
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-[var(--app-text-muted)]">
            {hasPastPickupSelection || selectedTimeIsUnavailable
              ? "Pickup must be scheduled for an available future time."
              : "Required for alterations."}
          </div>
          <ActionButton tone="primary" onClick={onClose} disabled={pickupInvalid}>
            Save pickup
          </ActionButton>
        </div>
      }
    >
      <div className="space-y-5">
        <label className="block text-sm">
          <FieldLabel>Pickup date</FieldLabel>
          <input
            value={pickupDate}
            onChange={(event) =>
              onChange({
                pickupDate: event.target.value,
                pickupTime:
                  event.target.value === pickupDate && !selectedTimeIsUnavailable
                    ? pickupTime
                    : "",
                pickupLocation,
              })
            }
            type="date"
            min={minPickupDate}
            className="app-input min-h-12 text-base"
          />
        </label>

        <div>
          <FieldLabel>Pickup time</FieldLabel>
          {pickupDate ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {timeOptions.map((timeOption) => {
                const isSelected = pickupTime === timeOption;
                return (
                  <button
                    key={timeOption}
                    type="button"
                    onClick={() => onChange({ pickupDate, pickupTime: timeOption, pickupLocation })}
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
            <div className="rounded-[var(--app-radius-md)] border border-dashed border-[var(--app-border-strong)] bg-[var(--app-surface-muted)] px-4 py-3">
              <div className="app-text-caption">Choose a pickup date first to see available times.</div>
            </div>
          )}
        </div>

        <div>
          <FieldLabel>Pickup location</FieldLabel>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {pickupLocations.map((location) => (
              <button
                key={location}
                type="button"
                onClick={() => onChange({ pickupDate, pickupTime, pickupLocation: location })}
                className={[
                  "min-h-12 rounded-[var(--app-radius-md)] border px-4 py-3 text-left text-sm font-medium transition",
                  pickupLocation === location
                    ? "border-[var(--app-accent)] bg-[var(--app-accent)] text-[var(--app-accent-contrast)]"
                    : "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)] hover:bg-[var(--app-surface-muted)]",
                ].join(" ")}
              >
                {location}
              </button>
            ))}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
