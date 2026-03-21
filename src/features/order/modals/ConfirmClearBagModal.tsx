import { ActionButton, ModalShell } from "../../../components/ui/primitives";

type ConfirmClearBagModalProps = {
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmClearBagModal({ onConfirm, onClose }: ConfirmClearBagModalProps) {
  return (
    <ModalShell
      title="Clear cart"
      subtitle="Remove all line items from the current order?"
      onClose={onClose}
      showCloseButton={false}
      widthClassName="max-w-[420px]"
      footer={
        <div className="flex items-center justify-end gap-2">
          <ActionButton tone="secondary" onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton tone="primary" onClick={onConfirm}>
            Clear cart
          </ActionButton>
        </div>
      }
    >
      <div className="text-sm text-[var(--app-text-muted)]">
        This clears the current order cart, including pickup details and any linked custom configuration.
      </div>
    </ModalShell>
  );
}
