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
      <SectionHeader icon={Scissors} title="Alteration intake" subtitle="Build item" />

      <div className="mb-4">
        <FieldLabel>Select garment</FieldLabel>
        <div className="grid gap-2 md:grid-cols-6">
          {garmentOptions.map((garment) => (
            <button
              key={garment}
              onClick={() => onSelectGarment(garment)}
              className={`flex min-h-11 items-center border px-3 py-2.5 text-left text-sm leading-none ${
                selectedGarment === garment ? "app-workflow-toggle app-workflow-toggle--active" : "app-workflow-toggle"
              }`}
            >
              <span>{garment}</span>
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
                className={`border p-3 text-left text-sm ${isSelected ? "app-workflow-toggle app-workflow-toggle--active" : "app-workflow-toggle"}`}
              >
                <div className="font-medium text-[var(--app-text)]">{service.name}</div>
                <div className="mt-1 text-xs text-[var(--app-text-muted)]">${service.price.toFixed(2)}</div>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-3 app-panel-section">
        <div className="text-sm text-[var(--app-text-muted)]">
          <div className="font-medium text-[var(--app-text)]">Current item subtotal</div>
          <div className="text-xs text-[var(--app-text-muted)]">Add item to order.</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-lg font-semibold text-[var(--app-text)]">${currentSubtotal.toFixed(2)}</div>
          <ActionButton tone="primary" disabled={!selectedGarment || selectedModifiers.length === 0} onClick={onAddItem}>
            Add to order
          </ActionButton>
        </div>
      </div>
    </Card>
  );
}
