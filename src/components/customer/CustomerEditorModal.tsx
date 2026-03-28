import type { ReactNode } from "react";
import { CheckSquare2, Square } from "lucide-react";
import { useState } from "react";
import type { Customer, PickupLocation } from "../../types";
import { ActionButton, FieldLabel, ModalShell, StatusPill, cx } from "../ui/primitives";
import { VipPill } from "../ui/pills";

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

type RequiredField = "firstName" | "lastName";

const locationOptions: PickupLocation[] = ["Fifth Avenue", "Queens", "Long Island"];
const honorificOptions = ["", "Mr.", "Mrs.", "Ms.", "Miss", "Dr.", "Prof."];
const suffixOptions = ["", "Jr.", "Sr.", "II", "III", "IV", "V"];
const stateOptions = ["", "NY", "NJ", "CT"];
const inputClassName =
  "mt-2 w-full rounded-[var(--app-radius-md)] border border-[var(--app-border)]/85 bg-[var(--app-surface-muted)] px-3 py-3 app-text-body";
const selectClassName = `${inputClassName} appearance-none pr-10 bg-[right_0.9rem_center] bg-[length:0.8rem] bg-no-repeat`;
const compactSelectClassName =
  "mt-2 w-full rounded-[var(--app-radius-md)] border border-[var(--app-border)]/85 bg-[var(--app-surface-muted)] px-3 py-2.5 text-[0.82rem] text-[var(--app-text-muted)] appearance-none pr-9 bg-[right_0.8rem_center] bg-[length:0.75rem] bg-no-repeat";
const selectCaretStyle = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%237b8694' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m5 7 5 6 5-6'/%3E%3C/svg%3E\")",
};
const requiredFieldLabels: Record<RequiredField, string> = {
  firstName: "first name",
  lastName: "last name",
};

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
      marketingOptIn: false,
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

function SectionBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <div className="app-text-overline">{title}</div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function CustomerEditorModal({ mode, customer, onClose, onSave }: CustomerEditorModalProps) {
  const [draft, setDraft] = useState<Customer>(() => normalizeCustomerSeed(customer));
  const [nameDraft, setNameDraft] = useState<NameDraft>(() => parseName(customer?.name ?? ""));
  const [addressDraft, setAddressDraft] = useState<AddressDraft>(() => parseAddress(customer?.address ?? ""));
  const [showValidation, setShowValidation] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Partial<Record<RequiredField, true>>>({});

  const formattedName = formatName(nameDraft);
  const formattedAddress = formatAddress(addressDraft);
  const missingFields: RequiredField[] = [
    !nameDraft.firstName.trim() ? "firstName" : null,
    !nameDraft.lastName.trim() ? "lastName" : null,
  ].filter((field): field is RequiredField => Boolean(field));
  const missingFieldSet = new Set(missingFields);
  const validationMessage =
    missingFields.length === 0
      ? ""
      : `Complete ${missingFields.map((field) => requiredFieldLabels[field]).join(", ")} to ${mode === "add" ? "add" : "save"} this customer.`;

  const isInvalid =
    !formattedName ||
    !draft.preferredLocation;
  const showValidationSummary = isInvalid && (showValidation || missingFields.some((field) => touchedFields[field]));

  const markFieldTouched = (field: RequiredField) => () =>
    setTouchedFields((current) => (current[field] ? current : { ...current, [field]: true }));

  const hasFieldIssue = (field: RequiredField) => missingFieldSet.has(field) && (showValidation || touchedFields[field]);
  const getFieldClassName = (className: string, field?: RequiredField) =>
    cx(
      className,
      field && hasFieldIssue(field) && "border-[var(--app-danger-border)] bg-[var(--app-danger-bg)]/40 text-[var(--app-text)]",
    );
  const getFieldHint = (field: RequiredField) =>
    hasFieldIssue(field) ? <div className="mt-2 text-[0.72rem] font-medium text-[var(--app-danger-text)]">Required</div> : null;

  return (
    <ModalShell
      title={mode === "add" ? "Add customer" : "Edit customer"}
      onClose={onClose}
      showCloseButton={false}
      widthClassName="max-w-[900px]"
      footer={
        <div className="flex items-center justify-end gap-2">
          <ActionButton tone="secondary" onClick={onClose} className="min-h-12 px-4 py-2.5 text-sm">
            Cancel
          </ActionButton>
          <ActionButton
            tone="primary"
            className="min-h-12 px-4 py-2.5 text-sm"
            onClick={() => {
              if (isInvalid) {
                setShowValidation(true);
                return;
              }

              onSave({ ...draft, name: formattedName, address: formattedAddress });
            }}
          >
            {mode === "add" ? "Add customer" : "Save changes"}
          </ActionButton>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="border-b border-[var(--app-border)]/35 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="app-text-value">{formattedName || "Unnamed customer"}</div>
            {draft.isVip ? <VipPill /> : null}
          </div>
          {showValidationSummary ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusPill tone="danger">{mode === "add" ? "Missing required details" : "Complete required details"}</StatusPill>
              <div className="app-text-caption text-[var(--app-danger-text)]">{validationMessage}</div>
            </div>
          ) : null}
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.8fr)]">
          <div className="space-y-6 rounded-[var(--app-radius-md)] bg-[var(--app-surface-muted)]/34 px-4 py-4">
            <SectionBlock title="Customer">
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <FieldLabel>First name</FieldLabel>
                    <input
                      value={nameDraft.firstName}
                      onChange={(event) => setNameDraft((current) => ({ ...current, firstName: event.target.value }))}
                      onBlur={markFieldTouched("firstName")}
                      name="customer-first-name"
                      autoComplete="given-name"
                      className={getFieldClassName(inputClassName, "firstName")}
                    />
                    {getFieldHint("firstName")}
                  </label>
                  <label className="block">
                    <FieldLabel>Last name</FieldLabel>
                    <input
                      value={nameDraft.lastName}
                      onChange={(event) => setNameDraft((current) => ({ ...current, lastName: event.target.value }))}
                      onBlur={markFieldTouched("lastName")}
                      name="customer-last-name"
                      autoComplete="family-name"
                      className={getFieldClassName(inputClassName, "lastName")}
                    />
                    {getFieldHint("lastName")}
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <FieldLabel>Phone</FieldLabel>
                    <input
                      type="tel"
                      value={draft.phone}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          phone: formatPhoneNumber(event.target.value),
                        }))
                      }
                      name="customer-phone"
                      inputMode="tel"
                      autoComplete="tel"
                      className={inputClassName}
                    />
                  </label>
                  <label className="block">
                    <FieldLabel>Email</FieldLabel>
                    <input
                      type="email"
                      value={draft.email}
                      onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
                      name="customer-email"
                      autoComplete="email"
                      className={inputClassName}
                    />
                  </label>
                </div>

                <div className="border-t border-[var(--app-border)]/30 pt-5">
                  <div className="app-text-overline">Address</div>
                  <div className="mt-4 space-y-4">
                    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_120px]">
                      <label className="block">
                        <FieldLabel>Street address</FieldLabel>
                        <input
                          value={addressDraft.addressLine1}
                          onChange={(event) => setAddressDraft((current) => ({ ...current, addressLine1: event.target.value }))}
                          name="customer-address-line1"
                          autoComplete="address-line1"
                          className={inputClassName}
                        />
                      </label>
                      <label className="block">
                        <FieldLabel>Unit</FieldLabel>
                        <input
                          value={addressDraft.unit}
                          onChange={(event) => setAddressDraft((current) => ({ ...current, unit: event.target.value }))}
                          name="customer-address-line2"
                          autoComplete="address-line2"
                          className={inputClassName}
                        />
                      </label>
                    </div>

                    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_110px_140px]">
                      <label className="block">
                        <FieldLabel>City</FieldLabel>
                        <input
                          value={addressDraft.city}
                          onChange={(event) => setAddressDraft((current) => ({ ...current, city: event.target.value }))}
                          name="customer-address-city"
                          autoComplete="address-level2"
                          className={inputClassName}
                        />
                      </label>
                      <label className="block">
                        <FieldLabel>State</FieldLabel>
                        <select
                          value={addressDraft.state}
                          onChange={(event) => setAddressDraft((current) => ({ ...current, state: event.target.value }))}
                          name="customer-address-state"
                          autoComplete="address-level1"
                          className={selectClassName}
                          style={selectCaretStyle}
                        >
                          {stateOptions.map((option) => (
                            <option key={option || "blank"} value={option}>
                              {option || "Select"}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <FieldLabel>ZIP</FieldLabel>
                        <input
                          value={addressDraft.zip}
                          onChange={(event) => setAddressDraft((current) => ({ ...current, zip: event.target.value }))}
                          name="customer-address-postal-code"
                          autoComplete="postal-code"
                          className={inputClassName}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </SectionBlock>

            <div className="border-t border-[var(--app-border)]/35 pt-5">
              <FieldLabel>Service notes</FieldLabel>
              <textarea
                value={draft.notes}
                onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                rows={6}
                className={inputClassName}
              />
            </div>
          </div>

          <div className="space-y-6 rounded-[var(--app-radius-md)] bg-[var(--app-surface-muted)]/62 px-4 py-4 border-t border-[var(--app-border)]/35 pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-4">
            <div className="border-b border-[var(--app-border)]/30 pb-5">
              <div className="app-text-overline">Name details</div>
              <div className="mt-4 grid gap-3 md:grid-cols-[120px_140px] md:justify-start">
                  <label className="block">
                    <FieldLabel>Honorific</FieldLabel>
                    <select
                      value={nameDraft.honorific}
                      onChange={(event) => setNameDraft((current) => ({ ...current, honorific: event.target.value }))}
                      className={compactSelectClassName}
                      style={selectCaretStyle}
                    >
                      {honorificOptions.map((option) => (
                        <option key={option || "none"} value={option}>
                          {option || "None"}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <FieldLabel>Suffix</FieldLabel>
                    <select
                      value={nameDraft.suffix}
                      onChange={(event) => setNameDraft((current) => ({ ...current, suffix: event.target.value }))}
                      className={compactSelectClassName}
                      style={selectCaretStyle}
                    >
                      {suffixOptions.map((option) => (
                        <option key={option || "none"} value={option}>
                          {option || "None"}
                        </option>
                        ))}
                      </select>
                    </label>
              </div>
            </div>

            <SectionBlock title="Profile">
              <div className="space-y-4">
                <div>
                  <FieldLabel>Preferred location</FieldLabel>
                  <div className="mt-2 space-y-2">
                    {locationOptions.map((location) => (
                      <button
                        key={location}
                        onClick={() => setDraft((current) => ({ ...current, preferredLocation: location }))}
                        className={cx(
                          "flex w-full items-center gap-3 rounded-[var(--app-radius-md)] border px-3 py-3 text-left transition",
                          draft.preferredLocation === location
                            ? "border-[var(--app-accent)] bg-[var(--app-surface)] text-[var(--app-text)]"
                            : "border-[var(--app-border)]/85 bg-[var(--app-surface-muted)]/75 text-[var(--app-text-muted)]",
                        )}
                      >
                        <span
                          className={cx(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                            draft.preferredLocation === location
                              ? "border-[var(--app-accent)]"
                              : "border-[var(--app-border-strong)]/85",
                          )}
                        >
                          {draft.preferredLocation === location ? (
                            <span className="h-2 w-2 rounded-full bg-[var(--app-accent)]" />
                          ) : null}
                        </span>
                        <span className="app-text-body font-medium">{location}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[var(--app-border)]/30 pt-4">
                  <FieldLabel>Marketing</FieldLabel>
                  <button
                    onClick={() => setDraft((current) => ({ ...current, marketingOptIn: !current.marketingOptIn }))}
                    className={cx(
                      "mt-2 flex w-full items-center justify-between gap-3 rounded-[var(--app-radius-md)] border px-3 py-3 text-left transition",
                      draft.marketingOptIn
                        ? "border-[var(--app-accent)] bg-[var(--app-surface)] text-[var(--app-text)]"
                        : "border-[var(--app-border)]/85 bg-[var(--app-surface-muted)]/75 text-[var(--app-text-muted)]",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {draft.marketingOptIn ? <CheckSquare2 className="h-4 w-4 shrink-0" /> : <Square className="h-4 w-4 shrink-0" />}
                      <span className="app-text-body font-medium">Marketing opt-in</span>
                    </div>
                    <span className="app-text-caption">{draft.marketingOptIn ? "Permission captured" : "Needs consent"}</span>
                  </button>
                </div>

                <div className="border-t border-[var(--app-border)]/30 pt-4">
                  <FieldLabel>Customer flag</FieldLabel>
                  <button
                    onClick={() => setDraft((current) => ({ ...current, isVip: !current.isVip }))}
                    className={cx(
                      "mt-2 flex w-full items-center justify-between gap-3 rounded-[var(--app-radius-md)] border px-3 py-3 text-left transition",
                      draft.isVip
                        ? "border-[var(--app-accent)] bg-[var(--app-surface)] text-[var(--app-text)]"
                        : "border-[var(--app-border)]/85 bg-[var(--app-surface-muted)]/75 text-[var(--app-text-muted)]",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {draft.isVip ? <CheckSquare2 className="h-4 w-4 shrink-0" /> : <Square className="h-4 w-4 shrink-0" />}
                      <span className="app-text-body font-medium">VIP customer</span>
                    </div>
                    <span className="app-text-caption">{draft.isVip ? "Priority profile" : "Standard profile"}</span>
                  </button>
                </div>
              </div>
            </SectionBlock>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
