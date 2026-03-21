import { useState } from "react";
import type { Customer, PickupLocation } from "../../types";
import { ActionButton, FieldLabel, ModalShell, cx } from "../ui/primitives";

type CustomerEditorModalProps = {
  mode: "add" | "edit";
  customer?: Customer | null;
  onClose: () => void;
  onSave: (customer: Customer) => void;
};

const locationOptions: PickupLocation[] = ["Fifth Avenue", "Queens", "Long Island"];

function normalizeCustomerSeed(customer?: Customer | null): Customer {
  return (
    customer ?? {
      id: "",
      name: "",
      phone: "",
      email: "",
      address: "",
      preferredLocation: "Fifth Avenue",
      lastVisit: "New",
      measurementsStatus: "missing",
      notes: "",
      isVip: false,
    }
  );
}

export function CustomerEditorModal({ mode, customer, onClose, onSave }: CustomerEditorModalProps) {
  const [draft, setDraft] = useState<Customer>(() => normalizeCustomerSeed(customer));

  const isInvalid =
    !draft.name.trim() ||
    !draft.phone.trim() ||
    !draft.email.trim() ||
    !draft.address.trim() ||
    !draft.preferredLocation;

  return (
    <ModalShell
      title={mode === "add" ? "Add customer" : "Edit customer"}
      subtitle={mode === "add" ? "Create a new customer profile" : "Update customer details"}
      onClose={onClose}
      widthClassName="max-w-[620px]"
      footer={
        <div className="flex items-center justify-end gap-2">
          <ActionButton tone="secondary" onClick={onClose} className="min-h-12 px-4 py-2.5 text-sm">
            Cancel
          </ActionButton>
          <ActionButton
            tone="primary"
            disabled={isInvalid}
            className="min-h-12 px-4 py-2.5 text-sm"
            onClick={() => onSave(draft)}
          >
            {mode === "add" ? "Add customer" : "Save changes"}
          </ActionButton>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <FieldLabel>Name</FieldLabel>
          <input
            value={draft.name}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            className="mt-2 w-full rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-3 app-text-body outline-none"
          />
        </label>
        <label className="block">
          <FieldLabel>Phone</FieldLabel>
          <input
            value={draft.phone}
            onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))}
            className="mt-2 w-full rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-3 app-text-body outline-none"
          />
        </label>
        <label className="block">
          <FieldLabel>Email</FieldLabel>
          <input
            value={draft.email}
            onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
            className="mt-2 w-full rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-3 app-text-body outline-none"
          />
        </label>
        <div className="block">
          <FieldLabel>Preferred location</FieldLabel>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {locationOptions.map((location) => (
              <button
                key={location}
                onClick={() => setDraft((current) => ({ ...current, preferredLocation: location }))}
                className={cx(
                  "rounded-[var(--app-radius-md)] border px-3 py-3 text-sm font-medium transition",
                  draft.preferredLocation === location
                    ? "border-[var(--app-accent)] bg-[var(--app-surface)] text-[var(--app-text)]"
                    : "border-[var(--app-border)] bg-[var(--app-surface)]/24 text-[var(--app-text-muted)]",
                )}
              >
                {location}
              </button>
            ))}
          </div>
        </div>
        <label className="block md:col-span-2">
          <FieldLabel>Address</FieldLabel>
          <input
            value={draft.address}
            onChange={(event) => setDraft((current) => ({ ...current, address: event.target.value }))}
            className="mt-2 w-full rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-3 app-text-body outline-none"
          />
        </label>
        <label className="block md:col-span-2">
          <FieldLabel>Notes</FieldLabel>
          <textarea
            value={draft.notes}
            onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
            rows={4}
            className="mt-2 w-full rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-3 app-text-body outline-none"
          />
        </label>
        <button
          onClick={() => setDraft((current) => ({ ...current, isVip: !current.isVip }))}
          className={cx(
            "flex items-center justify-center rounded-[var(--app-radius-md)] border px-3 py-3 text-sm font-medium transition md:col-span-2",
            draft.isVip
              ? "border-[var(--app-accent)] bg-[var(--app-surface)] text-[var(--app-text)]"
              : "border-[var(--app-border)] bg-[var(--app-surface)]/24 text-[var(--app-text-muted)]",
          )}
        >
          {draft.isVip ? "VIP customer" : "Mark as VIP"}
        </button>
      </div>
    </ModalShell>
  );
}
