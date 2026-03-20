import { Search, UserPlus } from "lucide-react";
import type { Customer } from "../../../types";
import { ActionButton, ModalShell } from "../../../components/ui/primitives";

type CustomerPickerModalProps = {
  customers: Customer[];
  query: string;
  onQueryChange: (value: string) => void;
  onSelectCustomer: (customerId: string) => void;
  onClose: () => void;
};

export function CustomerPickerModal({
  customers,
  query,
  onQueryChange,
  onSelectCustomer,
  onClose,
}: CustomerPickerModalProps) {
  return (
    <ModalShell title="Change linked customer" subtitle="Search or create" onClose={onClose} widthClassName="max-w-[560px]">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-3.5 h-4 w-4 text-[var(--app-text-soft)]" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search name, phone, or note"
          className="app-input py-3 pl-9 pr-3 text-sm"
        />
      </div>

      <div className="max-h-[320px] space-y-2 overflow-auto">
        {customers.map((customer) => (
          <button
            key={customer.id}
            onClick={() => onSelectCustomer(customer.id)}
            className="app-entity-row w-full text-left"
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[var(--app-text)]">{customer.name}</div>
              <div className="mt-1 text-xs text-[var(--app-text-muted)]">{customer.phone}</div>
              <div className="mt-1 text-xs text-[var(--app-text-muted)]">{customer.notes}</div>
            </div>
            <div className="text-xs text-[var(--app-text-muted)]">{customer.lastVisit}</div>
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--app-border)] pt-4">
        <div className="text-xs text-[var(--app-text-muted)]">Need someone new?</div>
        <ActionButton tone="secondary" className="flex items-center gap-2 px-3 py-2 text-xs">
          <UserPlus className="h-3.5 w-3.5" />
          Create customer
        </ActionButton>
      </div>
    </ModalShell>
  );
}
