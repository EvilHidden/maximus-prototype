import { Search, UserPlus } from "lucide-react";
import type { Customer } from "../../../types";
import { ActionButton, EntityRow, InlineEmptyState, ModalShell, SearchField } from "../../../components/ui/primitives";
import { ModalFooterActions, ModalSectionHeading } from "../../../components/ui/modalPatterns";

type CustomerPickerModalProps = {
  customers: Customer[];
  query: string;
  onQueryChange: (value: string) => void;
  onSelectCustomer: (customerId: string) => void;
  onCreateCustomer: () => void;
  onClose: () => void;
};

export function CustomerPickerModal({
  customers,
  query,
  onQueryChange,
  onSelectCustomer,
  onCreateCustomer,
  onClose,
}: CustomerPickerModalProps) {
  return (
    <ModalShell
      title="Change linked customer"
      onClose={onClose}
      widthClassName="max-w-[560px]"
      footer={
        <ModalFooterActions leading={<div className="app-text-caption">Need someone new instead?</div>}>
          <ActionButton tone="secondary" className="flex items-center gap-2 px-3 py-2 text-xs" onClick={onCreateCustomer}>
            <UserPlus className="h-3.5 w-3.5" />
            Create customer
          </ActionButton>
        </ModalFooterActions>
      }
    >
      <div className="space-y-4">
        <SearchField
          label="Find customer"
          value={query}
          onChange={onQueryChange}
          placeholder="Search name, phone, or note"
          className=""
          icon={Search}
        />

        <div className="space-y-2">
          <ModalSectionHeading
            title={customers.length === 1 ? "1 customer" : `${customers.length} customers`}
            description="Choose who this order should stay linked to."
          />
          <div className="max-h-[min(320px,calc(100vh-19rem))] space-y-2 overflow-auto rounded-[var(--app-radius-md)] border border-[var(--app-border)]/60 bg-[var(--app-surface-muted)]/22 p-2">
            {customers.length ? customers.map((customer) => (
              <EntityRow
                key={customer.id}
                onClick={() => onSelectCustomer(customer.id)}
                title={customer.name}
                subtitle={
                  <div className="space-y-1">
                    <div className="app-text-caption">{customer.phone}</div>
                    {customer.notes ? <div className="app-text-caption">{customer.notes}</div> : null}
                  </div>
                }
                meta={<div className="app-text-caption">{customer.lastVisit}</div>}
                className="w-full rounded-[var(--app-radius-md)] bg-[var(--app-surface)] px-4 py-3"
              />
            )) : (
              <InlineEmptyState>No active customers match this search.</InlineEmptyState>
            )}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
