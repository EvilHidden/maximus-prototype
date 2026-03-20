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

export function PickupScheduleModal({ pickupDate, pickupTime, pickupLocation, onChange, onClose }: PickupScheduleModalProps) {
  return (
    <ModalShell
      title="Set pickup schedule"
      subtitle="Set date, time, and location"
      onClose={onClose}
      widthClassName="max-w-[440px]"
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-[var(--app-text-muted)]">Required for alterations.</div>
          <ActionButton tone="primary" onClick={onClose} disabled={!pickupDate || !pickupTime || !pickupLocation}>
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
            className="app-input"
          />
        </label>
        <label className="text-sm">
          <FieldLabel>Pickup time</FieldLabel>
          <input
            value={pickupTime}
            onChange={(event) => onChange({ pickupDate, pickupTime: event.target.value, pickupLocation })}
            type="time"
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
