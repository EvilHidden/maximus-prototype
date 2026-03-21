import { Scissors } from "lucide-react";
import type { AlterationService } from "../../../types";
import { ActionButton, Card, EmptyState, FieldLabel, SectionHeader } from "../../../components/ui/primitives";

type AlterationBuilderProps = {
  garmentOptions: string[];
  selectedGarment: string;
  currentServices: AlterationService[];
  selectedModifiers: AlterationService[];
  currentSubtotal: number;
  onSelectGarment: (garment: string) => void;
  onToggleModifier: (modifier: AlterationService) => void;
  onAddItem: () => void;
};

export function AlterationBuilder({
  garmentOptions,
  selectedGarment,
  currentServices,
  selectedModifiers,
  currentSubtotal,
  onSelectGarment,
  onToggleModifier,
  onAddItem,
}: AlterationBuilderProps) {
  return (
    <Card className="p-4">
      <SectionHeader icon={Scissors} title="Alteration intake" subtitle="Build line item" />

      <div className="mb-4">
        <FieldLabel>Select garment</FieldLabel>
        <div className="grid gap-2 md:grid-cols-6">
          {garmentOptions.map((garment) => (
            <button
              key={garment}
              onClick={() => onSelectGarment(garment)}
              className={`flex min-h-12 items-center border px-3 py-3 text-left leading-none ${
                selectedGarment === garment ? "app-workflow-toggle app-workflow-toggle--active" : "app-workflow-toggle"
              }`}
            >
              <span className="app-text-body font-medium">{garment}</span>
            </button>
          ))}
        </div>
        {!selectedGarment ? <EmptyState className="mt-3">Select a garment.</EmptyState> : null}
      </div>

      {selectedGarment ? (
        <div className="grid max-h-[360px] gap-2 overflow-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
          {currentServices.map((service) => {
            const isSelected = selectedModifiers.some((modifier) => modifier.name === service.name);

            return (
              <button
                key={`${selectedGarment}-${service.name}`}
                onClick={() => onToggleModifier(service)}
                className={`border px-3 py-3 text-left ${isSelected ? "app-workflow-toggle app-workflow-toggle--active" : "app-workflow-toggle"}`}
              >
                <div className="app-text-body font-medium">{service.name}</div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="app-text-caption">Service</div>
                  <div className="app-text-strong">${service.price.toFixed(2)}</div>
                </div>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-3 app-panel-section">
        <div>
          <div className="app-text-body font-medium">Current item</div>
          <div className="app-text-caption">Ready to add</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="app-text-value">${currentSubtotal.toFixed(2)}</div>
          <ActionButton tone="primary" disabled={!selectedGarment || selectedModifiers.length === 0} onClick={onAddItem}>
            Add to order
          </ActionButton>
        </div>
      </div>
    </Card>
  );
}
