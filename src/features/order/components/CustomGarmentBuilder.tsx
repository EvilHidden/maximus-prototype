import { Ruler, Shirt } from "lucide-react";
import { Card, EmptyState, FieldLabel, SectionHeader } from "../../../components/ui/primitives";

type CustomGarmentBuilderProps = {
  customCatalog: string[];
  pricingBands: string[];
  selectedGarment: string | null;
  construction: string | null;
  bundleType: string | null;
  pricingBand: string | null;
  onSelectGarment: (garment: string | null) => void;
  onSetConfiguration: (patch: {
    construction?: string | null;
    bundleType?: string | null;
    pricingBand?: string | null;
  }) => void;
};

export function CustomGarmentBuilder({
  customCatalog,
  pricingBands,
  selectedGarment,
  construction,
  bundleType,
  pricingBand,
  onSelectGarment,
  onSetConfiguration,
}: CustomGarmentBuilderProps) {
  return (
    <>
      <Card className="p-4">
        <SectionHeader icon={Ruler} title="Custom garment" subtitle="Select garment" />
        <div className="grid gap-2 md:grid-cols-4">
          {customCatalog.map((item) => (
            <button
              key={item}
              onClick={() => onSelectGarment(item)}
              className={`flex min-h-11 items-center border px-3 py-2.5 text-left text-sm leading-none ${
                selectedGarment === item ? "app-workflow-toggle app-workflow-toggle--active" : "app-workflow-toggle"
              }`}
            >
              <span>{item}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <SectionHeader icon={Shirt} title="Configuration" subtitle="Set garment details" />

        {selectedGarment ? (
          <>
            <div className="mb-4 grid gap-3 md:grid-cols-3">
              <label className="text-sm">
                <FieldLabel>Garment type</FieldLabel>
                <input value={selectedGarment} readOnly className="app-input bg-[var(--app-surface-muted)]" />
              </label>
              <label className="text-sm">
                <FieldLabel>Construction</FieldLabel>
                <select
                  value={construction ?? ""}
                  onChange={(event) => onSetConfiguration({ construction: event.target.value || null })}
                  className="app-select"
                >
                  <option value="">Select</option>
                  <option>Full canvas</option>
                  <option>Half canvas</option>
                  <option>Fused</option>
                </select>
              </label>
              <label className="text-sm">
                <FieldLabel>Bundle or single</FieldLabel>
                <select
                  value={bundleType ?? ""}
                  onChange={(event) => onSetConfiguration({ bundleType: event.target.value || null })}
                  className="app-select"
                >
                  <option value="">Select</option>
                  <option>Single garment</option>
                  <option>Bundle</option>
                </select>
              </label>
            </div>

            <div>
              <FieldLabel>Pricing band</FieldLabel>
              <div className="grid gap-2 md:grid-cols-3">
                {pricingBands.map((band) => (
                  <button
                    key={band}
                    onClick={() => onSetConfiguration({ pricingBand: band })}
                    className={`border p-3 text-left text-sm ${
                      pricingBand === band ? "app-workflow-toggle app-workflow-toggle--active" : "app-workflow-toggle"
                    }`}
                  >
                    {band}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <EmptyState>Select a garment first.</EmptyState>
        )}
      </Card>
    </>
  );
}
