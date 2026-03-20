import { Ruler } from "lucide-react";
import type { Customer, MeasurementSet, Screen } from "../types";
import { ActionButton, Card, EmptyState, FieldLabel, PanelSection, SectionHeader, StatusPill } from "../components/ui/primitives";
import { measurementFields } from "../data";
import type { OrderWorkflowState } from "../types";
import { getMeasurementSetLabel, getSuggestedMeasurementSet } from "../features/order/selectors";

type MeasurementsScreenProps = {
  selectedCustomer: Customer | null;
  measurementSets: MeasurementSet[];
  order: OrderWorkflowState;
  onUpdateMeasurement: (field: string, value: string) => void;
  onLinkMeasurementSet: (measurementSetId: string | null) => void;
  onScreenChange: (screen: Screen) => void;
};

export function MeasurementsScreen({
  selectedCustomer,
  measurementSets,
  order,
  onUpdateMeasurement,
  onLinkMeasurementSet,
  onScreenChange,
}: MeasurementsScreenProps) {
  const enteredMeasurementCount = Object.values(order.custom.measurements).filter((value) => value.trim().length > 0).length;
  const customerHistory = selectedCustomer ? measurementSets.filter((set) => set.customerId === selectedCustomer.id) : [];
  const suggestedMeasurementSet = getSuggestedMeasurementSet(measurementSets, selectedCustomer);
  const linkedMeasurementSetLabel = getMeasurementSetLabel(measurementSets, order.custom.linkedMeasurementSetId);

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="p-4">
        <SectionHeader icon={Ruler} title="Measurements" subtitle="Entry and history" />

        <div className="mb-4 grid grid-cols-2 gap-3">
          <ActionButton tone="primary" disabled={!suggestedMeasurementSet} onClick={() => onLinkMeasurementSet(suggestedMeasurementSet?.id ?? null)}>
            Use latest on file
          </ActionButton>
          <ActionButton tone="secondary" onClick={() => onLinkMeasurementSet("draft-entry")}>
            Create new measurement set
          </ActionButton>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          {measurementFields.map((field) => (
            <label key={field} className="text-sm">
              <FieldLabel>{field}</FieldLabel>
              <input
                value={order.custom.measurements[field]}
                onChange={(event) => onUpdateMeasurement(field, event.target.value)}
                placeholder="in"
                className="app-input"
              />
            </label>
          ))}
        </div>

        <PanelSection title="Order linkage" className="mt-4">
          <div className="text-sm text-[var(--app-text-muted)]">{linkedMeasurementSetLabel ?? "Save as history and attach to the order."}</div>
        </PanelSection>
      </Card>

      <div className="space-y-4">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="font-semibold text-[var(--app-text)]">Measurement history</div>
              <div className="text-sm text-[var(--app-text-muted)]">{selectedCustomer?.name ?? "No customer selected"}</div>
            </div>
            <StatusPill tone="dark">{customerHistory[0]?.label ?? "No sets"}</StatusPill>
          </div>

          {customerHistory.length > 0 ? (
            <div className="space-y-2 text-sm">
              {customerHistory.map((set) => (
                <button
                  key={set.id}
                  onClick={() => onLinkMeasurementSet(set.id)}
                  className="app-entity-row w-full text-left"
                >
                  <div>
                    <div className="text-sm font-medium text-[var(--app-text)]">{set.label}</div>
                    <div className="mt-1 text-xs text-[var(--app-text-muted)]">{set.note}</div>
                  </div>
                  {order.custom.linkedMeasurementSetId === set.id ? <StatusPill tone="dark">Current</StatusPill> : null}
                </button>
              ))}
            </div>
          ) : (
            <EmptyState>No saved measurement history.</EmptyState>
          )}
        </Card>

        <Card className="p-4">
          <div className="mb-2 font-semibold text-[var(--app-text)]">Order linkage</div>
          <div className="mb-4 text-sm text-[var(--app-text-muted)]">Attach this version to the current order.</div>
          <div className="app-panel-section mb-4 text-sm">
            <div className="text-[var(--app-text-muted)]">Fields entered</div>
            <div className="text-lg font-semibold text-[var(--app-text)]">{enteredMeasurementCount} / {measurementFields.length}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ActionButton tone="secondary" onClick={() => onLinkMeasurementSet("draft-entry")} disabled={enteredMeasurementCount === 0}>
              Save version
            </ActionButton>
            <ActionButton tone="primary" onClick={() => onScreenChange("checkout")}>Continue to checkout</ActionButton>
          </div>
        </Card>
      </div>
    </div>
  );
}
