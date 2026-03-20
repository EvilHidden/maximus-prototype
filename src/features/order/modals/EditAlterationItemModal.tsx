import type { AlterationService } from "../../../types";
import { ActionButton, FieldLabel, ModalShell } from "../../../components/ui/primitives";

type EditAlterationItemModalProps = {
  garment: string;
  garmentOptions: string[];
  services: AlterationService[];
  selectedModifiers: AlterationService[];
  subtotal: number;
  onSetGarment: (garment: string) => void;
  onToggleModifier: (modifier: AlterationService) => void;
  onRequestRemove: () => void;
  onClose: () => void;
};

export function EditAlterationItemModal({
  garment,
  garmentOptions,
  services,
  selectedModifiers,
  subtotal,
  onSetGarment,
  onToggleModifier,
  onRequestRemove,
  onClose,
}: EditAlterationItemModalProps) {
  return (
    <ModalShell
      title="Edit order item"
      subtitle="Update garment or modifiers"
      onClose={onClose}
      widthClassName="max-w-[620px]"
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-[var(--app-text-muted)]">
            Item subtotal: <span className="font-semibold text-[var(--app-text)]">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <ActionButton tone="secondary" onClick={onRequestRemove}>
              Remove item
            </ActionButton>
            <ActionButton tone="primary" onClick={onClose}>
              Done
            </ActionButton>
          </div>
        </div>
      }
    >
      <div className="mb-4">
        <FieldLabel>Garment</FieldLabel>
        <div className="grid gap-2 md:grid-cols-4">
          {garmentOptions.map((option) => (
            <button
              key={option}
              onClick={() => onSetGarment(option)}
              className={`flex min-h-11 items-center border px-3 py-2.5 text-left text-sm leading-none ${
                garment === option ? "app-workflow-toggle app-workflow-toggle--active" : "app-workflow-toggle"
              }`}
            >
              <span>{option}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <FieldLabel>Modifiers</FieldLabel>
        <div className="grid max-h-[240px] gap-2 overflow-auto pr-1 md:grid-cols-2">
          {services.map((service) => {
            const isSelected = selectedModifiers.some((modifier) => modifier.name === service.name);
            return (
              <button
                key={`${garment}-${service.name}`}
                onClick={() => onToggleModifier(service)}
                className={`border p-3 text-left text-sm ${
                  isSelected ? "app-workflow-toggle app-workflow-toggle--active" : "app-workflow-toggle"
                }`}
              >
                <div className="font-medium text-[var(--app-text)]">{service.name}</div>
                <div className="mt-1 text-xs text-[var(--app-text-muted)]">${service.price.toFixed(2)}</div>
              </button>
            );
          })}
        </div>
      </div>
    </ModalShell>
  );
}
