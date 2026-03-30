import { ShoppingBag } from "lucide-react";
import { ActionButton, ModalShell } from "../../../components/ui/primitives";
import { ModalFooterActions, ModalSummaryCard } from "../../../components/ui/modalPatterns";

type ConfirmClearBagModalProps = {
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmClearBagModal({ onConfirm, onClose }: ConfirmClearBagModalProps) {
  return (
    <ModalShell
      title="Clear cart"
      subtitle="Remove everything from the current order bag?"
      onClose={onClose}
      showCloseButton={false}
      widthClassName="max-w-[420px]"
      footer={
        <ModalFooterActions>
          <ActionButton tone="secondary" onClick={onClose}>
            Keep bag
          </ActionButton>
          <ActionButton tone="danger" onClick={onConfirm}>
            Clear cart
          </ActionButton>
        </ModalFooterActions>
      }
    >
      <div className="space-y-3">
        <ModalSummaryCard
          eyebrow="Current order bag"
          title="All line items will be removed"
          description="This clears the bag, the pickup details, and any custom work you started in this draft."
          aside={
            <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)]/60 bg-[var(--app-surface)] px-3 py-2 text-[var(--app-text-soft)]">
              <ShoppingBag className="h-4 w-4" />
            </div>
          }
        />
        <div className="app-text-body-muted">
          After this, you will need to build the order again from scratch.
        </div>
      </div>
    </ModalShell>
  );
}
