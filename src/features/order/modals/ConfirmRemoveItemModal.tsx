import { ActionButton, ModalShell } from "../../../components/ui/primitives";
import { ModalFooterActions, ModalSummaryCard } from "../../../components/ui/modalPatterns";

type ConfirmRemoveItemModalProps = {
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmRemoveItemModal({ onConfirm, onClose }: ConfirmRemoveItemModalProps) {
  return (
    <ModalShell
      title="Remove item"
      onClose={onClose}
      showCloseButton={false}
      widthClassName="max-w-[420px]"
      footer={
        <ModalFooterActions>
          <ActionButton tone="secondary" onClick={onClose}>
            Keep item
          </ActionButton>
          <ActionButton tone="danger" onClick={onConfirm}>
            Remove
          </ActionButton>
        </ModalFooterActions>
      }
    >
      <div className="space-y-3">
        <ModalSummaryCard
          eyebrow="Order bag"
          title="This line item will be removed"
          description="Use this when the item should come out of the order, not just be changed."
        />
        <div className="app-text-body-muted">
          This item comes out of the order bag right away.
        </div>
      </div>
    </ModalShell>
  );
}
