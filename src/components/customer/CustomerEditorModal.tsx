import type { ReactNode } from "react";
import { ChevronDown, Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import type { Customer, PickupLocation } from "../../types";
import { ActionButton, FieldLabel, ModalShell, StatusPill, cx } from "../ui/primitives";
import { ModalFooterActions, ModalMetaRow, ModalPanel, ModalSectionHeading, ModalSummaryCard } from "../ui/modalPatterns";
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
  "app-input mt-2 min-h-12 app-text-body";
const selectClassName = "app-select mt-2 min-h-12 app-text-body appearance-none pr-10";
const compactSelectClassName =
  "app-select mt-2 min-h-11 px-3 py-2.5 text-[0.82rem] text-[var(--app-text-muted)] appearance-none pr-9";
const requiredFieldLabels: Record<RequiredField, string> = {
  firstName: "first name",
  lastName: "last name",
};

function SelectChevron() {
  return <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-text-soft)]" />;
}

function ProfileToggleRow({
  label,
  detail,
  checked,
  onToggle,
  compact = false,
}: {
  label: string;
  detail?: string;
  checked: boolean;
  onToggle: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cx(
        "flex w-full items-center justify-between gap-3 text-left transition",
        compact
          ? "rounded-[var(--app-radius-sm)] px-0 py-0"
          : "rounded-[var(--app-radius-md)] border px-3 py-3",
        checked
          ? compact
            ? "bg-transparent"
            : "border-[color-mix(in_srgb,var(--app-accent)_34%,var(--app-border))] bg-[color-mix(in_srgb,var(--app-accent)_7%,var(--app-surface))]"
          : compact
            ? "bg-transparent"
            : "border-[var(--app-border)]/65 bg-[var(--app-surface)]",
      )}
      aria-pressed={checked}
    >
      <div className="min-w-0">
        <div className={compact ? "app-text-body font-medium text-[var(--app-text-muted)]" : "app-text-strong"}>{label}</div>
        {detail ? <div className="mt-1 app-text-caption">{detail}</div> : null}
      </div>
      <div
        className={cx(
          "relative h-6 w-11 shrink-0 rounded-full border transition",
          checked
            ? "border-[color-mix(in_srgb,var(--app-accent)_42%,transparent)] bg-[color-mix(in_srgb,var(--app-accent)_28%,var(--app-surface))]"
            : "border-[var(--app-border)]/75 bg-[var(--app-surface-muted)]",
        )}
      >
        <span
          className={cx(
            "absolute top-1/2 h-4.5 w-4.5 -translate-y-1/2 rounded-full shadow-sm transition",
            checked ? "right-1 bg-[var(--app-accent)]" : "left-1 bg-[var(--app-text-soft)]/65",
          )}
        />
      </div>
    </button>
  );
}

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

function SectionBlock({
  title,
  eyebrow,
  description,
  children,
  className = "",
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <ModalPanel tone="muted" className={cx("space-y-3 border-[var(--app-border)]/50 px-3.5 py-3.5", className)}>
      <ModalSectionHeading
        eyebrow={eyebrow}
        title={title}
        description={description}
      />
      <div>{children}</div>
    </ModalPanel>
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
  const customerLabel = formattedName || (mode === "add" ? "New customer profile" : "Customer");
  const customerEmail = draft.email.trim() || "No email on file";
  const customerPhone = draft.phone.trim() || "No phone on file";
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
      widthClassName="max-w-[960px]"
      footer={
        <ModalFooterActions
          leading={
            showValidationSummary ? (
              <div className="app-text-caption text-[var(--app-danger-text)]">{validationMessage}</div>
            ) : (
              <div className="app-text-caption">{mode === "add" ? "Capture the profile basics now. You can fill in the rest later." : "Save when the customer details look right."}</div>
            )
          }
        >
          <ActionButton tone="secondary" onClick={onClose} className="min-h-12 w-full px-4 py-2.5 text-sm sm:w-auto">
            Cancel
          </ActionButton>
          <ActionButton
            tone="primary"
            className="min-h-12 w-full px-4 py-2.5 text-sm sm:w-auto"
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
        </ModalFooterActions>
      }
    >
      <div className="flex flex-col gap-3.5 xl:min-h-0 xl:max-h-[calc(100vh-12.75rem)]">
        <ModalSummaryCard
          eyebrow={mode === "add" ? "New profile" : "Customer profile"}
          title={customerLabel}
          meta={(
            <ModalMetaRow
              items={[
                { icon: Phone, content: customerPhone },
                { icon: Mail, content: customerEmail },
                { icon: MapPin, content: draft.preferredLocation || "No preferred location" },
              ]}
            />
          )}
          aside={(
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              {draft.isVip ? <VipPill /> : null}
              {showValidationSummary ? <StatusPill tone="danger">{mode === "add" ? "Missing required details" : "Complete required details"}</StatusPill> : null}
            </div>
          )}
        />

        {showValidationSummary ? (
          <div className="rounded-[var(--app-radius-md)] border border-[var(--app-danger-border)]/75 bg-[var(--app-danger-bg)]/35 px-3.5 py-2.5">
            <div className="app-text-caption text-[var(--app-danger-text)]">{validationMessage}</div>
          </div>
        ) : null}

        <div className="grid gap-3.5 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(0,1fr)_248px]">
          <div className="space-y-3.5 xl:min-h-0 xl:overflow-y-auto xl:pr-1">
            <SectionBlock
              title="Identity and contact"
            >
              <div className="space-y-3.5">
                <div className="grid gap-3 md:grid-cols-[110px_128px]">
                  <label className="block">
                    <FieldLabel>Honorific</FieldLabel>
                    <div className="relative">
                      <select
                        value={nameDraft.honorific}
                        onChange={(event) => setNameDraft((current) => ({ ...current, honorific: event.target.value }))}
                        className={compactSelectClassName}
                      >
                        {honorificOptions.map((option) => (
                          <option key={option || "none"} value={option}>
                            {option || "None"}
                          </option>
                        ))}
                      </select>
                      <SelectChevron />
                    </div>
                  </label>
                  <label className="block">
                    <FieldLabel>Suffix</FieldLabel>
                    <div className="relative">
                      <select
                        value={nameDraft.suffix}
                        onChange={(event) => setNameDraft((current) => ({ ...current, suffix: event.target.value }))}
                        className={compactSelectClassName}
                      >
                        {suffixOptions.map((option) => (
                          <option key={option || "none"} value={option}>
                            {option || "None"}
                          </option>
                        ))}
                      </select>
                      <SelectChevron />
                    </div>
                  </label>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
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

                <div className="grid gap-3 md:grid-cols-2">
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

              </div>
            </SectionBlock>

            <SectionBlock
              title="Mailing details"
            >
              <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_110px]">
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

                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_96px_124px]">
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
                    <div className="relative">
                      <select
                        value={addressDraft.state}
                        onChange={(event) => setAddressDraft((current) => ({ ...current, state: event.target.value }))}
                        name="customer-address-state"
                        autoComplete="address-level1"
                        className={selectClassName}
                      >
                        {stateOptions.map((option) => (
                          <option key={option || "blank"} value={option}>
                            {option || "Select"}
                          </option>
                        ))}
                      </select>
                      <SelectChevron />
                    </div>
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
            </SectionBlock>

            <SectionBlock
              title="Service notes"
            >
              <textarea
                value={draft.notes}
                onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                rows={4}
                className={inputClassName}
              />
            </SectionBlock>
          </div>

          <div className="space-y-3.5 border-t border-[var(--app-border)]/35 pt-3.5 xl:min-h-0 xl:overflow-y-auto xl:border-l xl:border-t-0 xl:pl-3.5 xl:pt-0">
            <SectionBlock
              eyebrow="Preferences"
              title="Profile settings"
            >
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
                  <div className="mt-2">
                    <ProfileToggleRow
                      label="Opt-in"
                      checked={draft.marketingOptIn}
                      onToggle={() => setDraft((current) => ({ ...current, marketingOptIn: !current.marketingOptIn }))}
                    />
                  </div>
                </div>
              </div>
            </SectionBlock>

            <SectionBlock title="VIP customer">
              <ProfileToggleRow
                label={draft.isVip ? "Priority profile" : "Standard profile"}
                checked={draft.isVip}
                onToggle={() => setDraft((current) => ({ ...current, isVip: !current.isVip }))}
              />
            </SectionBlock>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
