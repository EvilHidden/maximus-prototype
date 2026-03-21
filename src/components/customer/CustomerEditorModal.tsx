import { CheckSquare2, Square } from "lucide-react";
import { useState } from "react";
import type { Customer, PickupLocation } from "../../types";
import { ActionButton, FieldLabel, ModalShell, cx } from "../ui/primitives";

type CustomerEditorModalProps = {
  mode: "add" | "edit";
  customer?: Customer | null;
  onClose: () => void;
  onSave: (customer: Customer) => void;
};

type NameDraft = {
  honorific: string;
  firstName: string;
  lastName: string;
  suffix: string;
};

type AddressDraft = {
  addressLine1: string;
  unit: string;
  city: string;
  state: string;
  zip: string;
};

const locationOptions: PickupLocation[] = ["Fifth Avenue", "Queens", "Long Island"];

function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);

  if (digits.length <= 3) {
    return digits ? `(${digits}` : "";
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function normalizeCustomerSeed(customer?: Customer | null): Customer {
  return (
    customer ?? {
      id: "",
      name: "",
      phone: "",
      email: "",
      address: "",
      preferredLocation: "Fifth Avenue",
      lastVisit: "",
      measurementsStatus: "missing",
      notes: "",
      isVip: false,
    }
  );
}

function parseName(name: string): NameDraft {
  const trimmed = name.trim();
  if (!trimmed) {
    return { honorific: "", firstName: "", lastName: "", suffix: "" };
  }

  const parts = trimmed.split(/\s+/);
  const knownHonorifics = new Set(["mr.", "mrs.", "ms.", "miss", "dr.", "prof."]);
  const knownSuffixes = new Set(["jr.", "sr.", "ii", "iii", "iv", "v"]);

  let honorific = "";
  let suffix = "";
  let remaining = [...parts];

  if (remaining.length && knownHonorifics.has(remaining[0].toLowerCase())) {
    honorific = remaining.shift() ?? "";
  }

  if (remaining.length > 1 && knownSuffixes.has(remaining[remaining.length - 1].toLowerCase())) {
    suffix = remaining.pop() ?? "";
  }

  const firstName = remaining.shift() ?? "";
  const lastName = remaining.join(" ");

  return { honorific, firstName, lastName, suffix };
}

function formatName(name: NameDraft) {
  return [name.honorific, name.firstName, name.lastName, name.suffix]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
}

function parseAddress(address: string): AddressDraft {
  const [streetPart = "", cityPart = "", stateZipPart = ""] = address.split(",").map((part) => part.trim());
  const [state = "", zip = ""] = stateZipPart.split(/\s+/);
  const streetMatch = streetPart.match(/^(.*?)(?:\s+(?:Apt|Unit|#)\s*(.+))?$/i);

  return {
    addressLine1: streetMatch?.[1]?.trim() ?? streetPart,
    unit: streetMatch?.[2]?.trim() ?? "",
    city: cityPart,
    state,
    zip,
  };
}

function formatAddress(address: AddressDraft) {
  const addressLine1 = address.addressLine1.trim();
  const unit = address.unit.trim();
  const city = address.city.trim();
  const state = address.state.trim();
  const zip = address.zip.trim();

  if (!addressLine1 || !city || !state) {
    return "";
  }

  const street = unit ? `${addressLine1} Unit ${unit}` : addressLine1;
  return [street, city, [state, zip].filter(Boolean).join(" ")].join(", ");
}

export function CustomerEditorModal({ mode, customer, onClose, onSave }: CustomerEditorModalProps) {
  const [draft, setDraft] = useState<Customer>(() => normalizeCustomerSeed(customer));
  const [nameDraft, setNameDraft] = useState<NameDraft>(() => parseName(customer?.name ?? ""));
  const [addressDraft, setAddressDraft] = useState<AddressDraft>(() => parseAddress(customer?.address ?? ""));

  const formattedName = formatName(nameDraft);
  const formattedAddress = formatAddress(addressDraft);

  const isInvalid =
    !formattedName ||
    !draft.phone.trim() ||
    !draft.email.trim() ||
    !formattedAddress ||
    !draft.preferredLocation;

  return (
    <ModalShell
      title={mode === "add" ? "Add customer" : "Edit customer"}
      subtitle={mode === "add" ? "Create a new customer profile" : "Update customer details"}
      onClose={onClose}
      widthClassName="max-w-[760px]"
      footer={
        <div className="flex items-center justify-end gap-2">
          <ActionButton tone="secondary" onClick={onClose} className="min-h-12 px-4 py-2.5 text-sm">
            Cancel
          </ActionButton>
          <ActionButton
            tone="primary"
            disabled={isInvalid}
            className="min-h-12 px-4 py-2.5 text-sm"
            onClick={() => onSave({ ...draft, name: formattedName, address: formattedAddress })}
          >
            {mode === "add" ? "Add customer" : "Save changes"}
          </ActionButton>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="space-y-3">
          <div className="app-text-overline">Name</div>
          <div className="grid gap-4 md:grid-cols-[110px_minmax(0,1fr)_minmax(0,1fr)_110px]">
            <label className="block">
              <FieldLabel>Honorific</FieldLabel>
              <input
                value={nameDraft.honorific}
                onChange={(event) => setNameDraft((current) => ({ ...current, honorific: event.target.value }))}
                className="mt-2 w-full rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-3 app-text-body outline-none"
              />
            </label>
            <label className="block">
              <FieldLabel>First name</FieldLabel>
              <input
                value={nameDraft.firstName}
                onChange={(event) => setNameDraft((current) => ({ ...current, firstName: event.target.value }))}
                className="mt-2 w-full rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-3 app-text-body outline-none"
              />
            </label>
            <label className="block">
              <FieldLabel>Last name</FieldLabel>
              <input
                value={nameDraft.lastName}
                onChange={(event) => setNameDraft((current) => ({ ...current, lastName: event.target.value }))}
                className="mt-2 w-full rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-3 app-text-body outline-none"
              />
            </label>
            <label className="block">
              <FieldLabel>Suffix</FieldLabel>
              <input
                value={nameDraft.suffix}
                onChange={(event) => setNameDraft((current) => ({ ...current, suffix: event.target.value }))}
                className="mt-2 w-full rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-3 app-text-body outline-none"
              />
            </label>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <FieldLabel>Phone</FieldLabel>
            <input
              value={draft.phone}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  phone: formatPhoneNumber(event.target.value),
                }))
              }
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
        </div>

        <div className="space-y-3">
          <div className="app-text-overline">Address</div>
          <div className="grid gap-4 md:grid-cols-[minmax(0,1.6fr)_120px_minmax(0,1fr)_90px_120px]">
            <label className="block">
              <FieldLabel>Address</FieldLabel>
              <input
                value={addressDraft.addressLine1}
                onChange={(event) => setAddressDraft((current) => ({ ...current, addressLine1: event.target.value }))}
                className="mt-2 w-full rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-3 app-text-body outline-none"
              />
            </label>
            <label className="block">
              <FieldLabel>Unit</FieldLabel>
              <input
                value={addressDraft.unit}
                onChange={(event) => setAddressDraft((current) => ({ ...current, unit: event.target.value }))}
                className="mt-2 w-full rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-3 app-text-body outline-none"
              />
            </label>
            <label className="block">
              <FieldLabel>City</FieldLabel>
              <input
                value={addressDraft.city}
                onChange={(event) => setAddressDraft((current) => ({ ...current, city: event.target.value }))}
                className="mt-2 w-full rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-3 app-text-body outline-none"
              />
            </label>
            <label className="block">
              <FieldLabel>State</FieldLabel>
              <input
                value={addressDraft.state}
                onChange={(event) => setAddressDraft((current) => ({ ...current, state: event.target.value }))}
                className="mt-2 w-full rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-3 app-text-body outline-none"
              />
            </label>
            <label className="block">
              <FieldLabel>ZIP</FieldLabel>
              <input
                value={addressDraft.zip}
                onChange={(event) => setAddressDraft((current) => ({ ...current, zip: event.target.value }))}
                className="mt-2 w-full rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-3 app-text-body outline-none"
              />
            </label>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_360px] md:items-start">
          <label className="block">
            <FieldLabel>Notes</FieldLabel>
            <textarea
              value={draft.notes}
              onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
              rows={4}
              className="mt-2 w-full rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-3 app-text-body outline-none"
            />
          </label>

          <div className="space-y-3">
            <div>
              <FieldLabel>Preferred location</FieldLabel>
              <div className="mt-2 flex gap-2">
                {locationOptions.map((location) => (
                  <button
                    key={location}
                    onClick={() => setDraft((current) => ({ ...current, preferredLocation: location }))}
                    className={cx(
                      "min-w-0 flex-1 rounded-[var(--app-radius-md)] border px-2 py-2.5 text-[0.75rem] font-medium leading-none whitespace-nowrap transition",
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

            <button
              onClick={() => setDraft((current) => ({ ...current, isVip: !current.isVip }))}
              className={cx(
                "flex items-center gap-2 rounded-[var(--app-radius-md)] border px-3 py-2 text-sm font-medium transition",
                draft.isVip
                  ? "border-[var(--app-accent)] bg-[var(--app-surface)] text-[var(--app-text)]"
                  : "border-[var(--app-border)] bg-[var(--app-surface)]/24 text-[var(--app-text-muted)]",
              )}
            >
              {draft.isVip ? <CheckSquare2 className="h-4 w-4 shrink-0" /> : <Square className="h-4 w-4 shrink-0" />}
              {draft.isVip ? "VIP customer" : "Mark as VIP"}
            </button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
