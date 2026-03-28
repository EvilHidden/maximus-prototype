import { useId } from "react";
import { Search, UserPlus } from "lucide-react";
import type { Customer } from "../../../types";
import { ActionButton, ModalShell } from "../../../components/ui/primitives";

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
  const searchFieldId = useId();

  return (
    <ModalShell title="Change linked customer" subtitle="Search or create" onClose={onClose} widthClassName="max-w-[560px]">
      <div className="mb-4 flex items-center gap-3 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3">
        <Search className="h-4 w-4 shrink-0 text-[var(--app-text-soft)]" />
        <label htmlFor={searchFieldId} className="sr-only">
          Search customers
        </label>
        <input
          id={searchFieldId}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search name, phone, or note"
          type="search"
          name="customer-search"
          autoComplete="off"
          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-[var(--app-text)] outline-none placeholder:text-[var(--app-text-soft)]"
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
        <ActionButton tone="secondary" className="flex items-center gap-2 px-3 py-2 text-xs" onClick={onCreateCustomer}>
          <UserPlus className="h-3.5 w-3.5" />
          Create customer
        </ActionButton>
      </div>
    </ModalShell>
  );
}
