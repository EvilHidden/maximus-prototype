import { useMemo, useState } from "react";
import { Ruler } from "lucide-react";
import type { Customer, MeasurementSet, OrderWorkflowState, Screen } from "../types";
import { Callout, ModalShell, SectionHeader, ActionButton, Surface } from "../components/ui/primitives";
import { ModalFooterActions, ModalSummaryCard } from "../components/ui/modalPatterns";
import { useToast } from "../components/ui/toast";
import { CustomerEditorModal } from "../components/customer/CustomerEditorModal";
import { filterCustomers, getActiveCustomers } from "../features/customer/selectors";
import { createNextCustomerId } from "../features/customer/selectors";
import { CustomerPickerModal } from "../features/order/modals/CustomerPickerModal";
import {
  getLinkedMeasurementSet,
  getMeasurementSetDisplay,
  getMeasurementStatusModel,
} from "../features/measurements/selectors";
import { getOrderBagLineItems, getOrderType, getSummaryGuardrail } from "../features/order/selectors";
import { formatMeasurementDisplayValue, formatMeasurementValue, parseMeasurementValue } from "../features/measurements/service";
import { MeasurementFieldGrid } from "../features/measurements/components/MeasurementFieldGrid";
import { MeasurementBodyMap } from "../features/measurements/components/MeasurementBodyMap";
import { MeasurementValueEditor } from "../features/measurements/components/MeasurementValueEditor";
import { SavedMeasurementsRail } from "../features/measurements/components/SavedMeasurementsRail";
import { CurrentOrderMeasurementCard } from "../features/measurements/components/CurrentOrderMeasurementCard";

type MeasurementsScreenProps = {
  customers: Customer[];
  selectedCustomer: Customer | null;
  measurementSets: MeasurementSet[];
  measurementFields: string[];
  order: OrderWorkflowState;
  onStartNewSet: () => void;
  onSelectCustomer: (customerId: string) => void;
  onAddCustomer: (customer: Customer) => void;
  onUpdateMeasurement: (field: string, value: string) => void;
  onReplaceMeasurements: (values: Record<string, string>, measurementSetId: string | null) => void;
  onSaveMeasurementSet: (mode: "update" | "copy", title?: string) => void;
  onDeleteMeasurementSet: (measurementSetId: string) => void;
  onScreenChange: (screen: Screen) => void;
};

const fractions = [
  { label: "0", value: 0 },
  { label: "⅛", value: 0.125 },
  { label: "¼", value: 0.25 },
  { label: "⅜", value: 0.375 },
  { label: "½", value: 0.5 },
  { label: "⅝", value: 0.625 },
  { label: "¾", value: 0.75 },
  { label: "⅞", value: 0.875 },
];

const measurementFieldSectionBlueprint = [
  {
    title: "Upper body",
    fields: ["Back Length", "Shoulder", "Neck", "Chest", "Stomach", "Waist", "Seat"],
  },
  {
    title: "Sleeves and cuffs",
    fields: ["Bicep", "Sleeve Length", "Shirt Cuff Left", "Shirt Cuff Right"],
  },
  {
    title: "Trouser and hem",
    fields: ["Thigh", "Rise", "Bottom", "Length"],
  },
] as const;

function buildMeasurementFieldSections(fieldNames: string[]) {
  const remainingFields = new Set(fieldNames);
  const sections: Array<{ title: string; fields: string[] }> = measurementFieldSectionBlueprint
    .map((section) => {
      const fields = section.fields.filter((field) => remainingFields.has(field));
      fields.forEach((field) => remainingFields.delete(field));
      return { title: section.title, fields };
    })
    .filter((section) => section.fields.length > 0);

  if (remainingFields.size > 0) {
    sections.push({
      title: "Other",
      fields: [...remainingFields],
    });
  }

  return sections;
}

export function MeasurementsScreen({
  customers,
  selectedCustomer,
  measurementSets,
  measurementFields,
  order,
  onStartNewSet,
  onSelectCustomer,
  onAddCustomer,
  onUpdateMeasurement,
  onReplaceMeasurements,
  onSaveMeasurementSet,
  onDeleteMeasurementSet,
  onScreenChange,
}: MeasurementsScreenProps) {
  const { showToast } = useToast();
  const fieldNames = measurementFields;
  const [activeField, setActiveField] = useState(fieldNames[0] ?? "");
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerCreateOpen, setCustomerCreateOpen] = useState(false);
  const [customerQuery, setCustomerQuery] = useState("");
  const [saveMode, setSaveMode] = useState<"copy" | "save" | null>(null);
  const [saveTitle, setSaveTitle] = useState("");
  const [pendingDeleteSetId, setPendingDeleteSetId] = useState<string | null>(null);
  const customerDateFormatter = useMemo(
    () => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }),
    [],
  );

  const customerHistory = selectedCustomer ? measurementSets.filter((set) => set.customerId === selectedCustomer.id) : [];
  const filteredCustomers = useMemo(() => filterCustomers(getActiveCustomers(customers), customerQuery), [customers, customerQuery]);
  const fieldSections = useMemo(() => buildMeasurementFieldSections(measurementFields), [measurementFields]);
  const activeFieldValue = order.custom.draft.measurements[activeField] ?? "";
  const activeFieldHasValue = activeFieldValue.trim().length > 0;
  const parsedActiveValue = parseMeasurementValue(activeFieldValue);
  const completedMeasurementCount = Object.values(order.custom.draft.measurements).filter((value) => value.trim().length > 0).length;
  const activeFieldIndex = measurementFields.indexOf(activeField);
  const previousField = activeFieldIndex > 0 ? measurementFields[activeFieldIndex - 1] : null;
  const nextField = activeFieldIndex >= 0 && activeFieldIndex < measurementFields.length - 1 ? measurementFields[activeFieldIndex + 1] : null;
  const nextIncompleteField =
    measurementFields.find(
      (field, index) => index > activeFieldIndex && !(order.custom.draft.measurements[field] ?? "").trim(),
    ) ??
    measurementFields.find((field) => !(order.custom.draft.measurements[field] ?? "").trim()) ??
    null;
  const hasEnteredMeasurements = completedMeasurementCount > 0;
  const activeSet = getLinkedMeasurementSet(measurementSets, order.custom.draft.linkedMeasurementSetId);
  const activeSetDisplay = activeSet ? getMeasurementSetDisplay(activeSet) : null;
  const status = getMeasurementStatusModel(activeSet, hasEnteredMeasurements);
  const pendingDeleteSet = pendingDeleteSetId ? measurementSets.find((set) => set.id === pendingDeleteSetId) ?? null : null;
  const payerCustomer = customers.find((customer) => customer.id === order.payerCustomerId) ?? null;
  const wearerCustomer = customers.find((customer) => customer.id === order.custom.draft.wearerCustomerId) ?? null;
  const orderLineItems = useMemo(() => getOrderBagLineItems(order, customers), [order, customers]);
  const orderType = getOrderType(order);
  const summaryGuardrail = getSummaryGuardrail(order, payerCustomer);
  const orderContext = (() => {
    if (order.custom.draft.selectedGarment) {
      return {
        eyebrow: orderLineItems.length > 0 ? "Current custom draft" : "Custom draft",
        title: order.custom.draft.selectedGarment,
        detail: wearerCustomer ? `Wearer: ${wearerCustomer.name}` : "Wearer required",
        note:
          orderLineItems.length > 0
            ? `${orderLineItems.length} ${orderLineItems.length === 1 ? "item" : "items"} in the current order`
            : "This draft has not been added to the order yet.",
      };
    }

    if (orderLineItems.length > 0) {
      return {
        eyebrow: orderLineItems.length === 1 ? "Current order item" : "Current order",
        title: orderLineItems[0].title.replace(/^\d+\.\s*/, ""),
        detail:
          orderLineItems.length === 1
            ? orderLineItems[0].subtitle.split("\n")[0] || "Order item"
            : `${orderLineItems.length} items in the current order`,
        note: "These measurements are available while you continue the order.",
      };
    }

    return null;
  })();
  const checkoutDisabledReason =
    orderType === null
      ? "Add at least one item to the order before reviewing it."
      : summaryGuardrail.missingCustomer
        ? "Choose the customer paying for this order before review."
        : summaryGuardrail.missingPickup
          ? "Set the pickup details before reviewing the order."
          : summaryGuardrail.customIncomplete
            ? "Finish the custom garment setup before reviewing the order."
            : undefined;

  const setActiveMeasurementValue = (nextInches: number, nextFraction: number) => {
    onUpdateMeasurement(activeField, formatMeasurementValue(Math.max(0, nextInches), nextFraction));
  };

  const extractSetTitle = (note: string) => {
    const noteParts = note.split(" • ");
    return noteParts.length > 1 ? noteParts.slice(1).join(" • ") : note;
  };

  const openSaveModal = (mode: "copy" | "save") => {
    setSaveMode(mode);
    setSaveTitle(activeSet ? extractSetTitle(activeSet.note) : "");
  };

  return (
    <>
      <div className="space-y-3">
        <SectionHeader icon={Ruler} title="Measurements" subtitle="Review or capture inches for this customer." />

        <div className="app-page-with-support-rail app-measurements-layout">
          <Surface tone="work" className="overflow-hidden">
            <div className="app-measurements-workspace">
              <div className="border-b border-[var(--app-border)]/40 px-4 py-4 app-measurements-workspace__fields">
                <MeasurementFieldGrid
                  fieldSections={fieldSections}
                  activeField={activeField}
                  values={order.custom.draft.measurements}
                  onSelectField={setActiveField}
                />
              </div>

              <div className="px-4 py-4 app-measurements-workspace__editor">
                <div className="flex h-full flex-col">
                <section className="px-1 py-0.5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="app-text-overline">Current field</div>
                      <div className="mt-1 text-[1.3rem] font-semibold tracking-[-0.03em] text-[var(--app-text)] sm:text-[1.45rem] xl:text-[1.5rem]">
                        {activeField || "Choose a field"}
                      </div>
                      <div className="app-text-caption mt-1">
                        {activeFieldHasValue ? "Adjust the value below if it needs a change." : "Tap below to enter inches."}
                      </div>
                    </div>
                    <div className="min-w-[152px] text-left sm:text-right">
                      <div className="app-text-overline">{activeFieldHasValue ? "Current value" : "Next step"}</div>
                      {activeFieldHasValue ? (
                        <div className="mt-1 text-[1.85rem] font-semibold tracking-[-0.05em] text-[var(--app-text)] sm:text-[2.05rem] xl:text-[2.25rem]">
                          {formatMeasurementDisplayValue(activeFieldValue)} in
                        </div>
                      ) : (
                        <div className="mt-1 text-[1rem] font-semibold leading-tight text-[var(--app-text-muted)]">
                          Tap below
                          <br />
                          to enter inches
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3.5 flex min-h-[260px] items-center justify-center border-b border-[var(--app-border)]/36 pb-4 sm:min-h-[320px] xl:min-h-[332px]">
                    <MeasurementBodyMap activeField={activeField} />
                  </div>
                </section>

                <section className="px-1 pt-3.5">
                  <MeasurementValueEditor
                    focusKey={activeField}
                    value={activeFieldValue}
                    fraction={parsedActiveValue.fraction}
                    fractions={fractions}
                    onChangeValue={(value) => onUpdateMeasurement(activeField, value)}
                    onStepInches={(delta) => setActiveMeasurementValue(parsedActiveValue.inches + delta, parsedActiveValue.fraction)}
                    onSetFraction={(value) => setActiveMeasurementValue(parsedActiveValue.inches, value)}
                    onClear={() => onUpdateMeasurement(activeField, "")}
                  />
                </section>
                <section className="mt-auto px-1 pt-3.5">
                  <div className="border-t border-[var(--app-border)]/36 pt-3.5">
                    <div className="mb-2.5 app-text-overline">Move through measurements</div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <ActionButton
                        tone="secondary"
                        className="min-h-[3.4rem] px-3 py-2.5 text-left justify-start"
                        onClick={() => previousField && setActiveField(previousField)}
                        disabled={!previousField}
                      >
                        <span className="flex flex-col items-start leading-tight">
                          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--app-text-soft)]">
                            {previousField ? "Previous" : "Start"}
                          </span>
                          <span className="text-[0.94rem] font-medium tracking-[-0.01em] text-[var(--app-text)]">
                            {previousField ?? "Top of list"}
                          </span>
                        </span>
                      </ActionButton>
                      <ActionButton
                        tone="secondary"
                        className="min-h-[3.4rem] px-3 py-2.5 text-left justify-start"
                        onClick={() => nextField && setActiveField(nextField)}
                        disabled={!nextField}
                      >
                        <span className="flex flex-col items-start leading-tight">
                          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--app-text-soft)]">
                            {nextField ? "Next" : "End"}
                          </span>
                          <span className="text-[0.94rem] font-medium tracking-[-0.01em] text-[var(--app-text)]">
                            {nextField ?? "Last field"}
                          </span>
                        </span>
                      </ActionButton>
                      <ActionButton
                        tone="primary"
                        className="min-h-[3.4rem] px-3 py-2.5 text-left justify-start"
                        onClick={() => nextIncompleteField && setActiveField(nextIncompleteField)}
                        disabled={!nextIncompleteField}
                      >
                        <span className="flex flex-col items-start leading-tight">
                          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-current opacity-80">
                            {nextIncompleteField ? "Next missing" : "Complete"}
                          </span>
                          <span className="text-[0.94rem] font-medium tracking-[-0.01em] text-current">
                            {nextIncompleteField ?? "All entered"}
                          </span>
                        </span>
                      </ActionButton>
                    </div>
                  </div>
                </section>
                </div>
              </div>
            </div>
          </Surface>

          <Surface tone="support" className="app-support-rail-fixed px-3.5 py-2.5 app-measurements-rail">
            <div className="space-y-4">
              <div className="border-b border-[var(--app-border)]/45 pb-4">
                <SavedMeasurementsRail
                  customer={selectedCustomer}
                  customerHistory={customerHistory}
                  linkedMeasurementSetId={order.custom.draft.linkedMeasurementSetId}
                  onStartNewSet={onStartNewSet}
                  onOpenCustomerModal={() => setCustomerModalOpen(true)}
                  onApplySet={(set) => onReplaceMeasurements(set.values, set.id)}
                  onDeleteSet={setPendingDeleteSetId}
                />
              </div>

              <CurrentOrderMeasurementCard
                customer={selectedCustomer}
                activeSetDisplay={activeSetDisplay}
                hasEnteredMeasurements={hasEnteredMeasurements}
                orderContext={orderContext}
                hasCheckoutPath={Boolean(orderContext)}
                onSaveCurrentSet={() => {
                  if (activeSet) {
                    onSaveMeasurementSet("update");
                    return;
                  }
                  openSaveModal("save");
                }}
                onSaveAsNewSet={() => openSaveModal("copy")}
                onBackToOrder={() => onScreenChange("order")}
                checkoutDisabledReason={checkoutDisabledReason}
                onCheckout={() => onScreenChange("checkout")}
              />
            </div>
          </Surface>
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
          onCreateCustomer={() => {
            setCustomerModalOpen(false);
            setCustomerQuery("");
            setCustomerCreateOpen(true);
          }}
          onClose={() => {
            setCustomerModalOpen(false);
            setCustomerQuery("");
          }}
        />
      ) : null}

      {customerCreateOpen ? (
        <CustomerEditorModal
          mode="add"
          onClose={() => setCustomerCreateOpen(false)}
          onSave={(draft) => {
            const nextCustomer: Customer = {
              ...draft,
              id: createNextCustomerId(customers),
              lastVisit: customerDateFormatter.format(new Date()),
              measurementsStatus: "missing",
            };

            onAddCustomer(nextCustomer);
            onSelectCustomer(nextCustomer.id);
            showToast(`${nextCustomer.name} added.`);
            setCustomerCreateOpen(false);
          }}
        />
      ) : null}

      {saveMode ? (
        <ModalShell
          title={saveMode === "copy" ? "Save as new set" : "Save measurement set"}
          subtitle={selectedCustomer?.name ?? "Customer required"}
          onClose={() => {
            setSaveMode(null);
            setSaveTitle("");
          }}
          widthClassName="max-w-[520px]"
          footer={
            <ModalFooterActions
              leading={
                <div className="app-text-caption">
                  {saveMode === "copy"
                    ? "This creates a second reusable set from the current measurements."
                    : "This updates the customer’s active saved set."}
                </div>
              }
            >
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
                  onSaveMeasurementSet(saveMode === "copy" ? "copy" : "update", saveTitle);
                  setSaveMode(null);
                  setSaveTitle("");
                }}
                disabled={!selectedCustomer || !saveTitle.trim()}
              >
                {saveMode === "copy" ? "Save new set" : "Save set"}
              </ActionButton>
            </ModalFooterActions>
          }
        >
          <div className="space-y-3">
            <ModalSummaryCard
              eyebrow="Measurement set"
              title={saveMode === "copy" ? "Create a new saved set" : "Save over the active set"}
              description={saveMode === "copy"
                ? "Use a distinct name so the operator can tell this set apart later."
                : "This replaces the customer’s current saved measurements with what’s on screen now."}
            />
            <label className="block">
              <div className="app-field-label mb-2">Set name</div>
              <input
                value={saveTitle}
                onChange={(event) => setSaveTitle(event.target.value)}
                placeholder="Measurement set name"
                className="app-input app-text-body py-3"
              />
            </label>
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
            <ModalFooterActions>
              <ActionButton tone="secondary" onClick={() => setPendingDeleteSetId(null)}>
                Cancel
              </ActionButton>
              <ActionButton
                tone="danger"
                onClick={() => {
                  onDeleteMeasurementSet(pendingDeleteSet.id);
                  setPendingDeleteSetId(null);
                }}
              >
                Delete set
              </ActionButton>
            </ModalFooterActions>
          }
        >
          <div className="space-y-3">
            <ModalSummaryCard
              eyebrow="Saved measurements"
              title={pendingDeleteSet.label}
              description="This removes the set from the customer’s saved library."
            />
            <Callout tone="warn">
              <div className="app-text-caption">
                If the current order is already using this set, the measurements stay in the draft here until you replace them.
              </div>
            </Callout>
          </div>
        </ModalShell>
      ) : null}
    </>
  );
}
