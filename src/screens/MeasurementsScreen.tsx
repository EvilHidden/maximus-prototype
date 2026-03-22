import { useMemo, useState } from "react";
import { Ruler } from "lucide-react";
import type { Customer, MeasurementSet, OrderWorkflowState, Screen } from "../types";
import { ModalShell, SectionHeader, ActionButton, Surface } from "../components/ui/primitives";
import { filterCustomers } from "../features/customer/selectors";
import { CustomerPickerModal } from "../features/order/modals/CustomerPickerModal";
import {
  getLinkedMeasurementSet,
  getMeasurementSetDisplay,
  getMeasurementStatusModel,
} from "../features/measurements/selectors";
import { getOrderType, getSummaryGuardrail } from "../features/order/selectors";
import { formatMeasurementValue, parseMeasurementValue } from "../features/measurements/service";
import { MeasurementStatusCard } from "../features/measurements/components/MeasurementStatusCard";
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
  { label: "1/4", value: 0.25 },
  { label: "1/2", value: 0.5 },
  { label: "3/4", value: 0.75 },
];

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
  const fieldNames = Object.keys(order.custom.draft.measurements);
  const [activeField, setActiveField] = useState(fieldNames[0] ?? "");
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerQuery, setCustomerQuery] = useState("");
  const [saveMode, setSaveMode] = useState<"draft" | "saved" | null>(null);
  const [saveTitle, setSaveTitle] = useState("");
  const [pendingDeleteSetId, setPendingDeleteSetId] = useState<string | null>(null);

  const customerHistory = selectedCustomer ? measurementSets.filter((set) => set.customerId === selectedCustomer.id) : [];
  const filteredCustomers = useMemo(() => filterCustomers(customers, customerQuery), [customers, customerQuery]);
  const activeFieldValue = order.custom.draft.measurements[activeField] ?? "";
  const parsedActiveValue = parseMeasurementValue(activeFieldValue);
  const hasEnteredMeasurements = Object.values(order.custom.draft.measurements).some((value) => value.trim().length > 0);
  const activeSet = getLinkedMeasurementSet(measurementSets, order.custom.draft.linkedMeasurementSetId);
  const status = getMeasurementStatusModel(activeSet, hasEnteredMeasurements);
  const pendingDeleteSet = pendingDeleteSetId ? measurementSets.find((set) => set.id === pendingDeleteSetId) ?? null : null;
  const payerCustomer = customers.find((customer) => customer.id === order.payerCustomerId) ?? null;
  const orderType = getOrderType(order);
  const summaryGuardrail = getSummaryGuardrail(order, payerCustomer);
  const checkoutDisabledReason =
    orderType === null
      ? "Add at least one item to the order before going to checkout."
      : summaryGuardrail.missingCustomer
        ? "Link a paying customer before going to checkout."
        : summaryGuardrail.missingPickup
          ? "Finish the pickup handoff before going to checkout."
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
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Surface tone="work" className="p-4">
          <SectionHeader icon={Ruler} title="Measurements" subtitle="Capture, review, and attach the active set." />
          <MeasurementStatusCard title={status.title} detail={status.detail} />

          <div className="mt-4 border-t border-[var(--app-border)]/45 pt-4">
            <div className="app-text-overline mb-3">Measurement worksheet</div>
            <div className="grid gap-4 xl:grid-cols-[0.72fr_1.28fr]">
              <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)]/36 bg-[var(--app-surface-muted)]/22 p-3">
                <MeasurementFieldGrid
                  fieldNames={measurementFields}
                  activeField={activeField}
                  values={order.custom.draft.measurements}
                  onSelectField={setActiveField}
                />
              </div>

              <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)]/36 bg-[var(--app-surface)]/38 p-4">
                <div className="grid min-h-full gap-4">
                  <div className="flex min-h-[360px] items-center justify-center rounded-[var(--app-radius-md)] border border-[var(--app-border)]/30 bg-[var(--app-surface)]/62 px-4 py-5">
                    <MeasurementBodyMap activeField={activeField} />
                  </div>

                  <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)]/30 bg-[var(--app-surface-muted)]/16 p-4">
                    <div className="mx-auto max-w-[420px]">
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
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Surface>

        <Surface tone="support" className="p-4">
          <SectionHeader icon={Ruler} title="Measurement rail" subtitle="Saved sets and active order linkage." />

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
              activeSetDisplay={activeSet ? getMeasurementSetDisplay(activeSet) : null}
              hasEnteredMeasurements={hasEnteredMeasurements}
              onOpenSaveDraft={() => openSaveModal("draft")}
              onOpenSaveSet={() => openSaveModal("saved")}
              onOpenCustomerModal={() => setCustomerModalOpen(true)}
              checkoutDisabledReason={checkoutDisabledReason}
              onCheckout={() => onScreenChange("checkout")}
            />
          </div>
        </Surface>
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
              ? "Drafts stay editable and can be promoted to a saved version later."
              : activeSet?.isDraft
                ? "This draft will be promoted into a saved version for the current customer."
                : "This saves the current measurements to the selected customer and makes it available in Saved measurements."}
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
            Remove this set from the customer history. If it is the current linked set, the order will keep the measurements as a draft.
          </div>
        </ModalShell>
      ) : null}
    </>
  );
}
