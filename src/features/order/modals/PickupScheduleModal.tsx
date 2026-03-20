import { ActionButton, FieldLabel, ModalShell } from "../../../components/ui/primitives";

type PickupScheduleModalProps = {
  pickupDate: string;
  pickupTime: string;
  onChange: (patch: { pickupDate: string; pickupTime: string }) => void;
  onClose: () => void;
};

export function PickupScheduleModal({ pickupDate, pickupTime, onChange, onClose }: PickupScheduleModalProps) {
  return (
    <ModalShell
      title="Set pickup schedule"
      subtitle="Set date and time"
      onClose={onClose}
      widthClassName="max-w-[440px]"
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-[var(--app-text-muted)]">Required for alterations.</div>
          <ActionButton tone="primary" onClick={onClose} disabled={!pickupDate || !pickupTime}>
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
            onChange={(event) => onChange({ pickupDate: event.target.value, pickupTime })}
            type="date"
            className="app-input"
          />
        </label>
        <label className="text-sm">
          <FieldLabel>Pickup time</FieldLabel>
          <input
            value={pickupTime}
            onChange={(event) => onChange({ pickupDate, pickupTime: event.target.value })}
            type="time"
            className="app-input"
          />
        </label>
      </div>
    </ModalShell>
  );
}
