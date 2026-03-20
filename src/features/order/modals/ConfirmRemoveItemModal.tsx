import { ActionButton, ModalShell } from "../../../components/ui/primitives";

type ConfirmRemoveItemModalProps = {
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmRemoveItemModal({ onConfirm, onClose }: ConfirmRemoveItemModalProps) {
  return (
    <ModalShell
      title="Remove item"
      subtitle="Remove this line item from the order?"
      onClose={onClose}
      widthClassName="max-w-[420px]"
      footer={
        <div className="flex items-center justify-end gap-2">
          <ActionButton tone="secondary" onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton tone="primary" onClick={onConfirm}>
            Remove
          </ActionButton>
        </div>
      }
    >
      <div className="text-sm text-[var(--app-text-muted)]">This removes the selected item from the current order bag.</div>
    </ModalShell>
  );
}
