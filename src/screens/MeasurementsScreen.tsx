import { Ruler } from "lucide-react";
import type { Customer, Screen, WorkflowDraft } from "../types";
import { ActionButton, Card, SectionHeader, StatusPill } from "../components/ui/primitives";
import { measurementFields } from "../data/fixtures";

type MeasurementsScreenProps = {
  selectedCustomer: Customer | null;
  draft: WorkflowDraft;
  onDraftChange: (patch: Partial<WorkflowDraft>) => void;
  onScreenChange: (screen: Screen) => void;
};

export function MeasurementsScreen({ selectedCustomer, draft, onDraftChange, onScreenChange }: MeasurementsScreenProps) {
  const enteredMeasurementCount = Object.values(draft.measurements).filter((value) => value.trim().length > 0).length;

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="p-4">
        <SectionHeader icon={Ruler} title="Measurements" subtitle="Entry and history" />

        <div className="mb-4 grid grid-cols-2 gap-3">
          <ActionButton tone="primary">Use latest on file</ActionButton>
          <ActionButton tone="secondary">Create new measurement set</ActionButton>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          {measurementFields.map((field) => (
            <label key={field} className="text-sm">
              <div className="mb-1 text-slate-600">{field}</div>
              <input
                value={draft.measurements[field]}
                onChange={(event) => onDraftChange({ measurements: { ...draft.measurements, [field]: event.target.value } })}
                placeholder="in"
                className="w-full rounded-2xl border border-slate-300 px-3 py-3 outline-none"
              />
            </label>
          ))}
        </div>

        <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">Save as history and attach to the order.</div>
      </Card>

      <div className="space-y-4">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-900">Measurement history</div>
              <div className="text-sm text-slate-500">{selectedCustomer?.name ?? "No customer selected"}</div>
            </div>
            <StatusPill tone="dark">Version 4</StatusPill>
          </div>

          <div className="space-y-2 text-sm text-slate-700">
            <div className="rounded-2xl border border-slate-200 p-3">Version 4 • Mar 10 • Wedding party fitting</div>
            <div className="rounded-2xl border border-slate-200 p-3">Version 3 • Jan 22 • Tuxedo order</div>
            <div className="rounded-2xl border border-slate-200 p-3">Version 2 • Sep 14 • Alteration profile</div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-2 font-semibold text-slate-900">Order linkage</div>
          <div className="mb-4 text-sm text-slate-600">Attach this version to the current order.</div>
          <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <div className="text-slate-500">Fields entered</div>
            <div className="text-lg font-semibold text-slate-900">{enteredMeasurementCount} / {measurementFields.length}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ActionButton tone="secondary">Save version</ActionButton>
            <ActionButton tone="primary" onClick={() => onScreenChange("checkout")}>Continue to checkout</ActionButton>
          </div>
        </Card>
      </div>
    </div>
  );
}
