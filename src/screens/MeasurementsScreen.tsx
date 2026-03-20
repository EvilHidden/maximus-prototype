import { useEffect, useMemo, useRef, useState } from "react";
import { Ruler, Trash2, UserRound } from "lucide-react";
import type { Customer, MeasurementSet, OrderWorkflowState, Screen } from "../types";
import { ActionButton, Card, EmptyState, ModalShell, PanelSection, SectionHeader, StatusPill } from "../components/ui/primitives";
import { measurementFields } from "../data";
import { filterCustomers } from "../features/customer/selectors";
import { CustomerPickerModal } from "../features/order/modals/CustomerPickerModal";

type MeasurementsScreenProps = {
  customers: Customer[];
  selectedCustomer: Customer | null;
  measurementSets: MeasurementSet[];
  order: OrderWorkflowState;
  onSelectCustomer: (customerId: string) => void;
  onUpdateMeasurement: (field: string, value: string) => void;
  onReplaceMeasurements: (values: Record<string, string>, measurementSetId: string | null) => void;
  onLinkMeasurementSet: (measurementSetId: string | null) => void;
  onSaveMeasurementSet: (mode: "draft" | "saved", title: string) => void;
  onDeleteMeasurementSet: (measurementSetId: string) => void;
  onScreenChange: (screen: Screen) => void;
};

const fractions = [
  { label: "0", value: 0 },
  { label: "1/4", value: 0.25 },
  { label: "1/2", value: 0.5 },
  { label: "3/4", value: 0.75 },
];

function parseMeasurementValue(value: string) {
  if (!value) {
    return { inches: 0, fraction: 0 };
  }

  const numericValue = Number.parseFloat(value);
  if (Number.isNaN(numericValue)) {
    return { inches: 0, fraction: 0 };
  }

  const inches = Math.floor(numericValue);
  const roundedFraction = Math.round((numericValue - inches) * 4) / 4;
  return {
    inches,
    fraction: roundedFraction >= 1 ? 0 : roundedFraction,
  };
}

function formatMeasurementValue(inches: number, fraction: number) {
  const total = inches + fraction;
  return Number.isInteger(total) ? String(total) : total.toFixed(2).replace(/0$/, "");
}

function getSetDisplay(set: MeasurementSet) {
  const noteParts = set.note.split(" • ");

  if (noteParts.length > 1) {
    const [date, ...rest] = noteParts;
    return {
      title: rest.join(" • "),
      version: set.label,
      status: set.suggested ? "Latest on file" : null,
      subline: date,
    };
  }

  return {
    title: "Measurement set",
    version: set.label,
    status: set.suggested ? set.note : null,
    subline: !set.suggested ? set.note : null,
  };
}

export function MeasurementsScreen({
  customers,
  selectedCustomer,
  measurementSets,
  order,
  onSelectCustomer,
  onUpdateMeasurement,
  onReplaceMeasurements,
  onLinkMeasurementSet,
  onSaveMeasurementSet,
  onDeleteMeasurementSet,
  onScreenChange,
}: MeasurementsScreenProps) {
  const [activeField, setActiveField] = useState(measurementFields[0]);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerQuery, setCustomerQuery] = useState("");
  const [saveMode, setSaveMode] = useState<"draft" | "saved" | null>(null);
  const [saveTitle, setSaveTitle] = useState("");
  const [pendingDeleteSetId, setPendingDeleteSetId] = useState<string | null>(null);
  const activeInputRef = useRef<HTMLInputElement | null>(null);

  const customerHistory = selectedCustomer ? measurementSets.filter((set) => set.customerId === selectedCustomer.id) : [];
  const filteredCustomers = useMemo(() => filterCustomers(customers, customerQuery), [customers, customerQuery]);
  const activeFieldValue = order.custom.measurements[activeField] ?? "";
  const parsedActiveValue = parseMeasurementValue(activeFieldValue);
  const hasEnteredMeasurements = Object.values(order.custom.measurements).some((value) => value.trim().length > 0);
  const activeSet = useMemo(
    () => measurementSets.find((set) => set.id === order.custom.linkedMeasurementSetId) ?? null,
    [measurementSets, order.custom.linkedMeasurementSetId],
  );
  const activeSetDisplay = activeSet ? getSetDisplay(activeSet) : null;
  const modeLabel = activeSet
    ? `Editing ${activeSet.label}`
    : hasEnteredMeasurements || order.custom.linkedMeasurementSetId === "draft-entry"
      ? "Creating new set"
      : "No set loaded";
  const modeDetail = activeSetDisplay
    ? activeSetDisplay.title
    : hasEnteredMeasurements || order.custom.linkedMeasurementSetId === "draft-entry"
      ? "Unsaved measurements for this order"
      : "Choose a saved set or start a new one.";

  useEffect(() => {
    if (!measurementFields.includes(activeField)) {
      setActiveField(measurementFields[0]);
    }
  }, [activeField]);

  useEffect(() => {
    activeInputRef.current?.focus();
    activeInputRef.current?.select();
  }, [activeField]);

  const applyMeasurementSet = (set: MeasurementSet) => {
    onReplaceMeasurements(set.values, set.id);
  };

  const setActiveMeasurementValue = (nextInches: number, nextFraction: number) => {
    const safeInches = Math.max(0, nextInches);
    onUpdateMeasurement(activeField, formatMeasurementValue(safeInches, nextFraction));
    onLinkMeasurementSet("draft-entry");
  };

  const clearActiveField = () => {
    onUpdateMeasurement(activeField, "");
    onLinkMeasurementSet("draft-entry");
  };

  const startBlankSet = () => {
    const emptyValues = measurementFields.reduce<Record<string, string>>((accumulator, field) => {
      accumulator[field] = "";
      return accumulator;
    }, {});

    onReplaceMeasurements(emptyValues, "draft-entry");
  };

  const openSaveModal = (mode: "draft" | "saved") => {
    setSaveMode(mode);
    setSaveTitle(activeSetDisplay?.title && activeSetDisplay.title !== "Measurement set" ? activeSetDisplay.title : "");
  };

  const pendingDeleteSet = pendingDeleteSetId ? measurementSets.find((set) => set.id === pendingDeleteSetId) ?? null : null;

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="p-4">
          <SectionHeader icon={Ruler} title="Measurements" subtitle="Tap-first fitting editor" />

          <div className="mb-4 flex items-start justify-between gap-3 rounded-[var(--app-radius-sm)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--app-text-soft)]">Mode</div>
              <div className="mt-1 text-sm font-semibold text-[var(--app-text)]">{modeLabel}</div>
              <div className="mt-1 text-sm text-[var(--app-text-muted)]">{modeDetail}</div>
            </div>
            <ActionButton tone="secondary" className="px-3 py-2.5 text-xs" onClick={startBlankSet}>
              New set
            </ActionButton>
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <div>
              <div className="mb-2 text-sm font-semibold text-[var(--app-text)]">Measurement fields</div>
              <div className="grid gap-2 sm:grid-cols-2">
                {measurementFields.map((field) => {
                  const value = order.custom.measurements[field];
                  const isActive = activeField === field;

                  return (
                    <button
                      key={field}
                      onClick={() => setActiveField(field)}
                      className={`border px-3 py-3 text-left ${isActive ? "app-workflow-toggle app-workflow-toggle--active" : "app-workflow-toggle"}`}
                    >
                      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--app-text-soft)]">{field}</div>
                      <div className="mt-2 text-lg font-semibold text-[var(--app-text)]">{value || "--"}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <PanelSection title="Editor">
              <div className="mb-4">
                <div className="text-sm font-semibold text-[var(--app-text)]">{activeField}</div>
                <div className="mt-1 text-xs text-[var(--app-text-muted)]">Tap the field and enter inches with the device number keyboard.</div>
              </div>

              <div className="grid gap-3">
                <label className="block">
                  <div className="mb-2 text-xs uppercase tracking-[0.12em] text-[var(--app-text-soft)]">Measurement value</div>
                  <input
                    ref={activeInputRef}
                    value={activeFieldValue}
                    onChange={(event) => {
                      onUpdateMeasurement(activeField, event.target.value);
                      onLinkMeasurementSet("draft-entry");
                    }}
                    inputMode="decimal"
                    enterKeyHint="done"
                    pattern="[0-9]*[.]?[0-9]*"
                    placeholder="Enter inches"
                    className="app-input min-h-16 text-3xl font-semibold"
                  />
                </label>

                <div>
                  <div className="mb-2 text-xs uppercase tracking-[0.12em] text-[var(--app-text-soft)]">Quarter step</div>
                  <div className="grid grid-cols-4 gap-2">
                    {fractions.map((fractionOption) => (
                      <button
                        key={fractionOption.label}
                        onClick={() => setActiveMeasurementValue(parsedActiveValue.inches, fractionOption.value)}
                        className={`border px-3 py-3 text-sm font-medium ${
                          parsedActiveValue.fraction === fractionOption.value ? "app-workflow-toggle app-workflow-toggle--active" : "app-workflow-toggle"
                        }`}
                      >
                        {fractionOption.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <ActionButton tone="quiet" className="min-h-12" onClick={clearActiveField}>
                    Clear field
                  </ActionButton>
                  <ActionButton tone="secondary" className="min-h-12" onClick={() => setActiveMeasurementValue(parsedActiveValue.inches, 0)}>
                    Whole inches
                  </ActionButton>
                </div>
              </div>
            </PanelSection>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="mb-3">
              <div className="font-semibold text-[var(--app-text)]">Saved sets</div>
              <div className="text-sm text-[var(--app-text-muted)]">{selectedCustomer?.name ?? "No customer selected"}</div>
            </div>

            {customerHistory.length > 0 ? (
              <div className="space-y-2 text-sm">
                {customerHistory.map((set) => {
                  const display = getSetDisplay(set);
                  const isCurrent = order.custom.linkedMeasurementSetId === set.id;

                  return (
                    <div key={set.id} className="app-entity-row">
                      <button onClick={() => applyMeasurementSet(set)} className="min-w-0 flex-1 text-left">
                        <div className="flex items-start justify-between gap-3">
                          <div className="truncate text-sm font-medium text-[var(--app-text)]">{display.title}</div>
                          <StatusPill tone={isCurrent ? "dark" : "default"}>{display.version}</StatusPill>
                        </div>
                        {display.status ? <div className="mt-1 text-xs text-[var(--app-text-muted)]">{display.status}</div> : null}
                        {display.subline ? <div className="mt-1 text-xs text-[var(--app-text-soft)]">{display.subline}</div> : null}
                      </button>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          setPendingDeleteSetId(set.id);
                        }}
                        className="ml-3 shrink-0 text-[var(--app-text-soft)] transition hover:text-[var(--app-text)]"
                        aria-label={`Delete ${display.version}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState className="space-y-3">
                <div>{selectedCustomer ? "No saved measurement history." : "Link a customer to load saved measurement sets."}</div>
                {!selectedCustomer ? (
                  <ActionButton tone="secondary" className="min-h-11 px-4" onClick={() => setCustomerModalOpen(true)}>
                    Link customer
                  </ActionButton>
                ) : null}
              </EmptyState>
            )}
          </Card>

          <Card className="p-4">
            <div className="mb-2 font-semibold text-[var(--app-text)]">Current order</div>
            <div className="mb-4 flex items-start gap-3 rounded-[var(--app-radius-sm)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3">
              <div className="app-icon-chip">
                <UserRound className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-[var(--app-text)]">{selectedCustomer?.name ?? "Customer required"}</div>
                <div className="mt-1 text-sm text-[var(--app-text-muted)]">
                  {selectedCustomer ? "Measurements will stay attached to this active order." : "Link the customer here before checkout."}
                </div>
                {activeSetDisplay ? (
                  <div className="mt-2 text-xs text-[var(--app-text-soft)]">
                    {activeSetDisplay.title}
                    {activeSetDisplay.subline ? ` • ${activeSetDisplay.subline}` : ""}
                  </div>
                ) : hasEnteredMeasurements || order.custom.linkedMeasurementSetId === "draft-entry" ? (
                  <div className="mt-2 text-xs text-[var(--app-text-soft)]">New unsaved set in progress</div>
                ) : null}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <ActionButton tone="secondary" onClick={() => openSaveModal("draft")} disabled={!selectedCustomer}>
                Save draft
              </ActionButton>
              <ActionButton tone="secondary" onClick={() => openSaveModal("saved")} disabled={!selectedCustomer}>
                Save set
              </ActionButton>
              <ActionButton tone="secondary" onClick={() => setCustomerModalOpen(true)}>
                {selectedCustomer ? "Change customer" : "Link customer"}
              </ActionButton>
              <ActionButton tone="primary" onClick={() => onScreenChange("checkout")} disabled={!selectedCustomer}>
                Continue to checkout
              </ActionButton>
            </div>
          </Card>
        </div>
      </div>

      {customerModalOpen ? (
        <CustomerPickerModal
          customers={filteredCustomers}
          query={customerQuery}
          onQueryChange={setCustomerQuery}
          onSelectCustomer={(customerId) => {
            onSelectCustomer(customerId);
            setCustomerModalOpen(false);
            setCustomerQuery("");
          }}
          onClose={() => {
            setCustomerModalOpen(false);
            setCustomerQuery("");
          }}
        />
      ) : null}

      {saveMode ? (
        <ModalShell
          title={saveMode === "draft" ? "Save draft set" : activeSet?.isDraft ? "Promote to saved set" : "Save measurement set"}
          subtitle={selectedCustomer?.name ?? "Customer required"}
          onClose={() => {
            setSaveMode(null);
            setSaveTitle("");
          }}
          widthClassName="max-w-[520px]"
          footer={
            <div className="flex items-center justify-end gap-3">
              <ActionButton
                tone="secondary"
                onClick={() => {
                  setSaveMode(null);
                  setSaveTitle("");
                }}
              >
                Cancel
              </ActionButton>
              <ActionButton
                tone="primary"
                onClick={() => {
                  onSaveMeasurementSet(saveMode, saveTitle);
                  setSaveMode(null);
                  setSaveTitle("");
                }}
                disabled={!selectedCustomer || !saveTitle.trim()}
              >
                {saveMode === "draft" ? "Save draft" : "Save set"}
              </ActionButton>
            </div>
          }
        >
          <label className="block">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--app-text-soft)]">Set name</div>
            <input
              value={saveTitle}
              onChange={(event) => setSaveTitle(event.target.value)}
              placeholder={saveMode === "draft" ? "Draft name" : "Saved set name"}
              className="app-input py-3 text-sm"
            />
          </label>
          <div className="mt-3 text-sm text-[var(--app-text-muted)]">
            {saveMode === "draft"
              ? "Drafts stay editable and can be promoted to a saved version later."
              : activeSet?.isDraft
                ? "This draft will be promoted into a saved version for the current customer."
                : "This saves the current measurements to the selected customer and makes it available in Saved sets."}
          </div>
        </ModalShell>
      ) : null}

      {pendingDeleteSet ? (
        <ModalShell
          title="Delete measurement set"
          subtitle={pendingDeleteSet.label}
          onClose={() => setPendingDeleteSetId(null)}
          widthClassName="max-w-[480px]"
          footer={
            <div className="flex items-center justify-end gap-3">
              <ActionButton tone="secondary" onClick={() => setPendingDeleteSetId(null)}>
                Cancel
              </ActionButton>
              <ActionButton
                tone="primary"
                onClick={() => {
                  onDeleteMeasurementSet(pendingDeleteSet.id);
                  setPendingDeleteSetId(null);
                }}
              >
                Delete set
              </ActionButton>
            </div>
          }
        >
          <div className="text-sm text-[var(--app-text-muted)]">
            Remove this set from the customer history. If it is the current linked set, the order will keep the measurements as an unsaved working set.
          </div>
        </ModalShell>
      ) : null}
    </>
  );
}
