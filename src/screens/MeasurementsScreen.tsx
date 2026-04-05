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
} from "../features/measurements/selectors";
import { getOrderBagLineItems, getOrderType, getSummaryGuardrail } from "../features/order/selectors";
import {
  formatMeasurementValue,
  parseMeasurementValue,
} from "../features/measurements/service";
import { MeasurementValueEditor } from "../features/measurements/components/MeasurementValueEditor";
import { SavedMeasurementsRail } from "../features/measurements/components/SavedMeasurementsRail";
import { CurrentOrderMeasurementCard } from "../features/measurements/components/CurrentOrderMeasurementCard";
import { MeasurementSetsWorkbench } from "../features/measurements/components/MeasurementSetsWorkbench";

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
  const activeFieldValue = order.custom.draft.measurements[activeField] ?? "";
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
  const comparisonSet =
    customerHistory.find((set) => set.suggested && set.id !== order.custom.draft.linkedMeasurementSetId) ??
    customerHistory.find((set) => set.id !== order.custom.draft.linkedMeasurementSetId) ??
    null;
  const baselineValues = activeSet?.values ?? comparisonSet?.values ?? null;
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

  const resetMeasurementWorkbench = () => {
    onStartNewSet();
    if (fieldNames[0]) {
      setActiveField(fieldNames[0]);
    }
  };

  const handleSelectMeasurementCustomer = (customerId: string) => {
    onSelectCustomer(customerId);
    resetMeasurementWorkbench();
  };

  return (
    <>
      <div className="space-y-3">
        <SectionHeader icon={Ruler} title="Measurements" subtitle="Review or capture inches for this customer." />

        <div className="app-page-with-support-rail app-measurements-layout">
          <Surface tone="work" className="overflow-hidden app-measurements-layout__workspace">
            <div className="app-measurements-workspace">
              <div className="px-4 py-4 app-measurements-workspace__editor">
                <div className="app-measurements-workbench">
                  <MeasurementSetsWorkbench
                    customer={selectedCustomer}
                    customerHistory={customerHistory}
                    linkedMeasurementSetId={order.custom.draft.linkedMeasurementSetId}
                    measurementFields={measurementFields}
                    draftMeasurements={order.custom.draft.measurements}
                    comparisonValues={baselineValues}
                    enteredCount={completedMeasurementCount}
                    totalFields={measurementFields.length}
                    activeField={activeField}
                    onSelectField={setActiveField}
                  />

                  <div className="app-measurements-workbench__editor">
                    <MeasurementValueEditor
                      focusKey={activeField}
                      activeField={activeField}
                      value={activeFieldValue}
                      lastSavedValue={baselineValues?.[activeField] ?? null}
                      hasUnsavedChange={Boolean(activeSet && baselineValues?.[activeField]?.trim() && activeFieldValue.trim() && activeFieldValue.trim() !== (baselineValues?.[activeField]?.trim() ?? ""))}
                      previousField={previousField}
                      nextField={nextField}
                      nextIncompleteField={nextIncompleteField}
                      fractions={fractions}
                      onSelectField={setActiveField}
                      onChangeValue={(value) => onUpdateMeasurement(activeField, value)}
                      onStepInches={(delta) => setActiveMeasurementValue(parsedActiveValue.inches + delta, parsedActiveValue.fraction)}
                      onSetFraction={(value) => setActiveMeasurementValue(parsedActiveValue.inches, value)}
                      onClear={() => onUpdateMeasurement(activeField, "")}
                    />
                  </div>
                </div>

                <div className="app-hide-at-desktop app-measurements-mobile-footer">
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
                    mobileCaptureOnly
                  />
                </div>
              </div>
            </div>
          </Surface>

          <Surface
            tone="support"
            className="app-support-rail-fixed w-full p-3.5 app-measurements-rail app-measurements-layout__rail"
          >
            <div className="space-y-4 app-measurements-rail-stack">
              <div className="border-b border-[var(--app-border)]/45 pb-4 app-measurements-rail-stack__sets">
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

              <div className="app-desktop-only app-measurements-rail-stack__status">
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
            handleSelectMeasurementCustomer(customerId);
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
            handleSelectMeasurementCustomer(nextCustomer.id);
            showToast(`${nextCustomer.name} is ready to use in measurements.`, {
              title: "Customer added",
              tone: "success",
            });
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
