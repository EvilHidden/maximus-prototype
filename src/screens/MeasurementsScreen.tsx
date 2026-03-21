import { useMemo, useState } from "react";
import { Ruler } from "lucide-react";
import type { Customer, MeasurementSet, OrderWorkflowState, Screen } from "../types";
import { Card, ModalShell, SectionHeader, ActionButton, PanelSection } from "../components/ui/primitives";
import { filterCustomers } from "../features/customer/selectors";
import { CustomerPickerModal } from "../features/order/modals/CustomerPickerModal";
import {
  getLinkedMeasurementSet,
  getMeasurementSetDisplay,
  getMeasurementStatusModel,
} from "../features/measurements/selectors";
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
  order,
  onCreateDraftSet,
  onSelectCustomer,
  onUpdateMeasurement,
  onReplaceMeasurements,
  onSaveMeasurementSet,
  onDeleteMeasurementSet,
  onScreenChange,
}: MeasurementsScreenProps) {
  const fieldNames = Object.keys(order.custom.measurements);
  const [activeField, setActiveField] = useState(fieldNames[0] ?? "");
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerQuery, setCustomerQuery] = useState("");
  const [saveMode, setSaveMode] = useState<"draft" | "saved" | null>(null);
  const [saveTitle, setSaveTitle] = useState("");
  const [pendingDeleteSetId, setPendingDeleteSetId] = useState<string | null>(null);

  const customerHistory = selectedCustomer ? measurementSets.filter((set) => set.customerId === selectedCustomer.id) : [];
  const filteredCustomers = useMemo(() => filterCustomers(customers, customerQuery), [customers, customerQuery]);
  const activeFieldValue = order.custom.measurements[activeField] ?? "";
  const parsedActiveValue = parseMeasurementValue(activeFieldValue);
  const hasEnteredMeasurements = Object.values(order.custom.measurements).some((value) => value.trim().length > 0);
  const activeSet = getLinkedMeasurementSet(measurementSets, order.custom.linkedMeasurementSetId);
  const status = getMeasurementStatusModel(activeSet, hasEnteredMeasurements);
  const pendingDeleteSet = pendingDeleteSetId ? measurementSets.find((set) => set.id === pendingDeleteSetId) ?? null : null;

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
      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="p-4">
          <SectionHeader icon={Ruler} title="Measurements" />
          <MeasurementStatusCard title={status.title} detail={status.detail} />

          <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <MeasurementFieldGrid
              activeField={activeField}
              values={order.custom.measurements}
              onSelectField={setActiveField}
            />

            <PanelSection>
              <div className="grid min-h-full grid-rows-[1fr_auto] gap-4">
                <div className="flex min-h-[360px] items-center justify-center">
                  <MeasurementBodyMap activeField={activeField} />
                </div>

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
            </PanelSection>
          </div>
        </Card>

        <div className="space-y-4">
          <SavedMeasurementsRail
            customer={selectedCustomer}
            customerHistory={customerHistory}
            linkedMeasurementSetId={order.custom.linkedMeasurementSetId}
            onCreateDraftSet={onCreateDraftSet}
            onOpenCustomerModal={() => setCustomerModalOpen(true)}
            onApplySet={(set) => onReplaceMeasurements(set.values, set.id)}
            onDeleteSet={setPendingDeleteSetId}
          />

          <CurrentOrderMeasurementCard
            customer={selectedCustomer}
            activeSetDisplay={activeSet ? getMeasurementSetDisplay(activeSet) : null}
            hasEnteredMeasurements={hasEnteredMeasurements}
            onOpenSaveDraft={() => openSaveModal("draft")}
            onOpenSaveSet={() => openSaveModal("saved")}
            onOpenCustomerModal={() => setCustomerModalOpen(true)}
            onCheckout={() => onScreenChange("checkout")}
          />
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
