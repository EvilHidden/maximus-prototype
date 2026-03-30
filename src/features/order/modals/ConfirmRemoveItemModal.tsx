import { Trash2 } from "lucide-react";
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
      subtitle="Remove this line item from the order bag?"
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
          aside={
            <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)]/60 bg-[var(--app-surface)] px-3 py-2 text-[var(--app-text-soft)]">
              <Trash2 className="h-4 w-4" />
            </div>
          }
        />
        <div className="app-text-body-muted">
          This item comes out of the order bag right away.
        </div>
      </div>
    </ModalShell>
  );
}
