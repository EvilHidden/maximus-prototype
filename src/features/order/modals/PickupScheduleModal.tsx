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

export function PickupScheduleModal({ pickupDate, pickupTime, pickupLocation, onChange, onClose }: PickupScheduleModalProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const minPickupDate = formatDateInputValue(now);
  const minPickupTime = pickupDate === minPickupDate ? formatTimeInputValue(now) : undefined;
  const selectedPickupDateTime =
    pickupDate && pickupTime
      ? new Date(`${pickupDate}T${pickupTime}`)
      : null;
  const hasPastPickupSelection =
    selectedPickupDateTime !== null && !Number.isNaN(selectedPickupDateTime.getTime()) && selectedPickupDateTime < now;

  return (
    <ModalShell
      title="Set pickup schedule"
      subtitle="Set date, time, and location"
      onClose={onClose}
      widthClassName="max-w-[440px]"
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-[var(--app-text-muted)]">
            {hasPastPickupSelection ? "Pickup must be scheduled for a future date and time." : "Required for alterations."}
          </div>
          <ActionButton tone="primary" onClick={onClose} disabled={!pickupDate || !pickupTime || !pickupLocation || hasPastPickupSelection}>
            Save pickup
          </ActionButton>
        </div>
      }
    >
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          <FieldLabel>Pickup date</FieldLabel>
          <input
            value={pickupDate}
            onChange={(event) => onChange({ pickupDate: event.target.value, pickupTime, pickupLocation })}
            type="date"
            min={minPickupDate}
            className="app-input"
          />
        </label>
        <label className="text-sm">
          <FieldLabel>Pickup time</FieldLabel>
          <input
            value={pickupTime}
            onChange={(event) => onChange({ pickupDate, pickupTime: event.target.value, pickupLocation })}
            type="time"
            min={minPickupTime}
            className="app-input"
          />
        </label>
        <label className="text-sm md:col-span-2">
          <FieldLabel>Pickup location</FieldLabel>
          <select
            value={pickupLocation}
            onChange={(event) => onChange({ pickupDate, pickupTime, pickupLocation: event.target.value as PickupLocation | "" })}
            className="app-input"
          >
            <option value="">Select store</option>
            {pickupLocations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </label>
      </div>
    </ModalShell>
  );
}
