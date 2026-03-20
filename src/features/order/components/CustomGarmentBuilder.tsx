import { Ruler, Shirt } from "lucide-react";
import { Card, EmptyState, FieldLabel, SectionHeader } from "../../../components/ui/primitives";

type CustomGarmentBuilderProps = {
  customCatalog: string[];
  fabricOptions: string[];
  buttonTypeOptions: string[];
  liningOptions: string[];
  threadOptions: string[];
  pocketTypeOptions: string[];
  cuffOptions: string[];
  lapelOptions: string[];
  pricingBands: string[];
  selectedGarment: string | null;
  fabric: string | null;
  buttonType: string | null;
  lining: string | null;
  threads: string | null;
  monograms: string;
  pocketType: string | null;
  cuffs: string | null;
  lapels: string | null;
  customNotes: string;
  pricingBand: string | null;
  onSelectGarment: (garment: string | null) => void;
  onSetConfiguration: (patch: {
    fabric?: string | null;
    buttonType?: string | null;
    lining?: string | null;
    threads?: string | null;
    monograms?: string;
    pocketType?: string | null;
    cuffs?: string | null;
    lapels?: string | null;
    customNotes?: string;
    pricingBand?: string | null;
  }) => void;
};

const jacketOrderTypes = new Set(["Suit", "Three piece suit", "Sports coat", "Overcoat", "Tuxedo", "3 piece tux"]);
const cuffOrderTypes = new Set(["Suit", "Three piece suit", "Tuxedo", "3 piece tux"]);

export function CustomGarmentBuilder({
  customCatalog,
  fabricOptions,
  buttonTypeOptions,
  liningOptions,
  threadOptions,
  pocketTypeOptions,
  cuffOptions,
  lapelOptions,
  pricingBands,
  selectedGarment,
  fabric,
  buttonType,
  lining,
  threads,
  monograms,
  pocketType,
  cuffs,
  lapels,
  customNotes,
  pricingBand,
  onSelectGarment,
  onSetConfiguration,
}: CustomGarmentBuilderProps) {
  const showJacketFields = selectedGarment ? jacketOrderTypes.has(selectedGarment) : false;
  const showCuffField = selectedGarment ? cuffOrderTypes.has(selectedGarment) : false;

  return (
    <>
      <Card className="p-4">
        <SectionHeader icon={Ruler} title="Custom garment" subtitle="Select garment" />
        <div className="grid gap-2 md:grid-cols-4">
          {customCatalog.map((item) => (
            <button
              key={item}
              onClick={() => onSelectGarment(item)}
              className={`flex min-h-12 items-center border px-3 py-3 text-left text-sm leading-none ${
                selectedGarment === item ? "app-workflow-toggle app-workflow-toggle--active" : "app-workflow-toggle"
              }`}
            >
              <span>{item}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <SectionHeader icon={Shirt} title="Configuration" subtitle="Garment details" />

        {selectedGarment ? (
          <>
            <div className="mb-4 grid gap-3 md:grid-cols-2">
              <label className="text-sm">
                <FieldLabel>Order type</FieldLabel>
                <input value={selectedGarment} readOnly className="app-input bg-[var(--app-surface-muted)]" />
              </label>
              <label className="text-sm">
                <FieldLabel>Fabric</FieldLabel>
                <select
                  value={fabric ?? ""}
                  onChange={(event) => onSetConfiguration({ fabric: event.target.value || null })}
                  className="app-select"
                >
                  <option value="">Select</option>
                  {fabricOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <FieldLabel>Button type</FieldLabel>
                <select
                  value={buttonType ?? ""}
                  onChange={(event) => onSetConfiguration({ buttonType: event.target.value || null })}
                  className="app-select"
                >
                  <option value="">Select</option>
                  {buttonTypeOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <FieldLabel>Lining</FieldLabel>
                <select
                  value={lining ?? ""}
                  onChange={(event) => onSetConfiguration({ lining: event.target.value || null })}
                  className="app-select"
                >
                  <option value="">Select</option>
                  {liningOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <FieldLabel>Threads</FieldLabel>
                <select
                  value={threads ?? ""}
                  onChange={(event) => onSetConfiguration({ threads: event.target.value || null })}
                  className="app-select"
                >
                  <option value="">Select</option>
                  {threadOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mb-4 grid gap-3 md:grid-cols-2">
              <label className="text-sm">
                <FieldLabel>Monograms</FieldLabel>
                <input
                  value={monograms}
                  onChange={(event) => onSetConfiguration({ monograms: event.target.value })}
                  placeholder="Initials or placement"
                  className="app-input"
                />
              </label>

              {showJacketFields ? (
                <label className="text-sm">
                  <FieldLabel>Pocket type</FieldLabel>
                  <select
                    value={pocketType ?? ""}
                    onChange={(event) => onSetConfiguration({ pocketType: event.target.value || null })}
                    className="app-select"
                  >
                    <option value="">Select</option>
                    {pocketTypeOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
              ) : null}

              {showCuffField ? (
                <label className="text-sm">
                  <FieldLabel>Cuffs</FieldLabel>
                  <select
                    value={cuffs ?? ""}
                    onChange={(event) => onSetConfiguration({ cuffs: event.target.value || null })}
                    className="app-select"
                  >
                    <option value="">Select</option>
                    {cuffOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
              ) : null}

              {showJacketFields ? (
                <label className="text-sm">
                  <FieldLabel>Lapels</FieldLabel>
                  <select
                    value={lapels ?? ""}
                    onChange={(event) => onSetConfiguration({ lapels: event.target.value || null })}
                    className="app-select"
                  >
                    <option value="">Select</option>
                    {lapelOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>

            <div className="mb-4">
              <FieldLabel>Custom notes</FieldLabel>
              <textarea
                value={customNotes}
                onChange={(event) => onSetConfiguration({ customNotes: event.target.value })}
                rows={3}
                placeholder="Special requests or tailoring notes."
                className="app-input resize-none"
              />
            </div>

            <div>
              <FieldLabel>Pricing band</FieldLabel>
              <div className="grid gap-2 md:grid-cols-3">
                {pricingBands.map((band) => (
                  <button
                    key={band}
                    onClick={() => onSetConfiguration({ pricingBand: band })}
                    className={`border px-3 py-3 text-left text-sm ${
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
