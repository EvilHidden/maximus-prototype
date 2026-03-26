import { useMemo, useState } from "react";
import { Ruler } from "lucide-react";
import type { Customer, MeasurementSet, OrderWorkflowState, Screen } from "../types";
import { ModalShell, SectionHeader, ActionButton, Surface } from "../components/ui/primitives";
import { filterCustomers, getActiveCustomers } from "../features/customer/selectors";
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
  onCreateDraftSet: () => void;
  onSelectCustomer: (customerId: string) => void;
  onUpdateMeasurement: (field: string, value: string) => void;
  onReplaceMeasurements: (values: Record<string, string>, measurementSetId: string | null) => void;
  onSaveMeasurementSet: (mode: "draft" | "saved", title: string) => void;
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
  onCreateDraftSet,
  onSelectCustomer,
  onUpdateMeasurement,
  onReplaceMeasurements,
  onSaveMeasurementSet,
  onDeleteMeasurementSet,
  onScreenChange,
}: MeasurementsScreenProps) {
  const formatMeasurementReadout = (value: string) =>
    value.trim().length > 0 ? `${formatMeasurementDisplayValue(value)} in` : "Tap to enter inches";
  const fieldNames = measurementFields;
  const [activeField, setActiveField] = useState(fieldNames[0] ?? "");
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerQuery, setCustomerQuery] = useState("");
  const [saveMode, setSaveMode] = useState<"draft" | "saved" | null>(null);
  const [saveTitle, setSaveTitle] = useState("");
  const [pendingDeleteSetId, setPendingDeleteSetId] = useState<string | null>(null);

  const customerHistory = selectedCustomer ? measurementSets.filter((set) => set.customerId === selectedCustomer.id) : [];
  const filteredCustomers = useMemo(() => filterCustomers(getActiveCustomers(customers), customerQuery), [customers, customerQuery]);
  const fieldSections = useMemo(() => buildMeasurementFieldSections(measurementFields), [measurementFields]);
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
      ? "Add at least one item to the order before going to checkout."
      : summaryGuardrail.missingCustomer
        ? "Choose the customer paying for this order before checkout."
        : summaryGuardrail.missingPickup
          ? "Set the pickup details before going to checkout."
          : summaryGuardrail.customIncomplete
            ? "Finish the custom garment setup before going to checkout."
            : undefined;

  const setActiveMeasurementValue = (nextInches: number, nextFraction: number) => {
    onUpdateMeasurement(activeField, formatMeasurementValue(Math.max(0, nextInches), nextFraction));
  };

  const openSaveModal = (mode: "draft" | "saved") => {
    setSaveMode(mode);
    if (activeSet?.isDraft) {
      setSaveTitle(activeSet.note.split(" • ").slice(1).join(" • "));
      return;
    }
    setSaveTitle("");
  };

  return (
    <>
      <div className="space-y-4">
        <SectionHeader icon={Ruler} title="Measurements" subtitle="Review or capture inches for this customer." />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Surface tone="work" className="overflow-hidden">
            <div className="grid gap-0 xl:grid-cols-[300px_minmax(0,1fr)]">
              <div className="border-b border-[var(--app-border)]/40 px-4 py-4 xl:border-r xl:border-b-0">
                <MeasurementFieldGrid
                  fieldSections={fieldSections}
                  activeField={activeField}
                  values={order.custom.draft.measurements}
                  onSelectField={setActiveField}
                />
              </div>

              <div className="px-4 py-4">
                <div className="flex h-full flex-col">
                <section className="px-1 py-1">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="text-[1.625rem] font-semibold tracking-[-0.03em] text-[var(--app-text)]">
                        {activeField || "Choose a field"}
                      </div>
                      <div className="app-text-caption mt-1">{status.title}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[2.4rem] font-semibold tracking-[-0.05em] text-[var(--app-text)]">
                        {formatMeasurementReadout(activeFieldValue)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 flex min-h-[420px] items-center justify-center border-b border-[var(--app-border)]/36 pb-6">
                    <MeasurementBodyMap activeField={activeField} />
                  </div>
                </section>

                <section className="px-1 pt-5">
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
                <section className="mt-auto px-1 pt-5">
                  <div className="border-t border-[var(--app-border)]/36 pt-4">
                    <div className="mb-3 app-text-overline">Move through measurements</div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <ActionButton
                        tone="secondary"
                        className="min-h-[3.5rem] px-3 py-2 text-left"
                        onClick={() => previousField && setActiveField(previousField)}
                        disabled={!previousField}
                      >
                        {previousField ? `Previous: ${previousField}` : "Start of list"}
                      </ActionButton>
                      <ActionButton
                        tone="secondary"
                        className="min-h-[3.5rem] px-3 py-2 text-left"
                        onClick={() => nextField && setActiveField(nextField)}
                        disabled={!nextField}
                      >
                        {nextField ? `Next: ${nextField}` : "End of list"}
                      </ActionButton>
                      <ActionButton
                        tone="primary"
                        className="min-h-[3.5rem] px-3 py-2 text-left"
                        onClick={() => nextIncompleteField && setActiveField(nextIncompleteField)}
                        disabled={!nextIncompleteField}
                      >
                        {nextIncompleteField ? `Next missing: ${nextIncompleteField}` : "All measurements entered"}
                      </ActionButton>
                    </div>
                  </div>
                </section>
                </div>
              </div>
            </div>
          </Surface>

          <Surface tone="support" className="px-4 py-3">
            <div className="space-y-5">
              <div className="border-b border-[var(--app-border)]/45 pb-5">
                <SavedMeasurementsRail
                  customer={selectedCustomer}
                  customerHistory={customerHistory}
                  linkedMeasurementSetId={order.custom.draft.linkedMeasurementSetId}
                  onCreateDraftSet={onCreateDraftSet}
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
                onOpenSaveDraft={() => openSaveModal("draft")}
                onOpenSaveSet={() => openSaveModal("saved")}
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
          onClose={() => {
            setCustomerModalOpen(false);
            setCustomerQuery("");
          }}
        />
      ) : null}

      {saveMode ? (
        <ModalShell
          title={saveMode === "draft" ? "Save draft set" : activeSet?.isDraft ? "Save as a set" : "Save measurement set"}
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
            <div className="app-field-label mb-2">Set name</div>
            <input
              value={saveTitle}
              onChange={(event) => setSaveTitle(event.target.value)}
              placeholder={saveMode === "draft" ? "Draft name" : "Saved set name"}
              className="app-input app-text-body py-3"
            />
          </label>
          <div className="app-text-body-muted mt-3">
            {saveMode === "draft"
              ? "Drafts stay editable and can be saved as a set later."
              : activeSet?.isDraft
                ? "This draft will be saved as a reusable set for this customer."
                : "This saves the current measurements to the selected customer and makes them available with the customer's saved sets."}
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
          <div className="app-text-body-muted">
            Remove this set from the customer's saved sets. If this order is using it, the measurements will stay here as a draft.
          </div>
        </ModalShell>
      ) : null}
    </>
  );
}
