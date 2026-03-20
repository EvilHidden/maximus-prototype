import { Search, User } from "lucide-react";
import { useMemo, useState } from "react";
import { customerOrders, customers } from "../data";
import type { Customer, MeasurementSet, Screen } from "../types";
import { Card, SectionHeader, StatusPill } from "../components/ui/primitives";
import { CustomerProfileDrawer } from "../components/customer/CustomerProfileDrawer";
import { filterCustomers, getMeasurementStatusLabel } from "../features/customer/selectors";

type CustomerScreenProps = {
  measurementSets: MeasurementSet[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer) => void;
  onScreenChange: (screen: Screen) => void;
};

export function CustomerScreen({ measurementSets, selectedCustomer, onSelectCustomer, onScreenChange }: CustomerScreenProps) {
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filteredCustomers = useMemo(() => {
    return filterCustomers(customers, query);
  }, [query]);

  return (
    <div className="relative">
      <Card className="p-4">
        <SectionHeader icon={User} title="Customers" subtitle="Directory" />

        <div className="mb-4 flex items-center gap-3 rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-[var(--app-text-soft)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, phone, or customer ID"
            className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-[var(--app-text)] outline-none placeholder:text-[var(--app-text-soft)]"
          />
        </div>

        <div className="app-table-shell">
          <div className="app-table-head grid grid-cols-[minmax(0,1.4fr)_170px_150px_150px_48px] gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-wide">
            <div>Customer</div>
            <div>Phone</div>
            <div>Measurements</div>
            <div>Last visit</div>
            <div />
          </div>

          <div className="max-h-[560px] divide-y divide-[var(--app-border)] overflow-auto">
            {filteredCustomers.map((customer) => (
              <button
                key={customer.id}
                onClick={() => {
                  onSelectCustomer(customer);
                  setDrawerOpen(true);
                }}
                className="app-table-row grid w-full grid-cols-[minmax(0,1.4fr)_170px_150px_150px_48px] items-center gap-3 px-4 py-3 text-left text-sm"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate font-semibold text-[var(--app-text)]">{customer.name}</div>
                    {customer.isVip ? <StatusPill tone="dark">VIP</StatusPill> : null}
                  </div>
                  <div className="truncate text-xs text-[var(--app-text-muted)]">{customer.notes}</div>
                </div>
                <div className="truncate text-[var(--app-text-muted)]">{customer.phone}</div>
                <div className="text-[var(--app-text-muted)]">{getMeasurementStatusLabel(customer.measurementsStatus)}</div>
                <div className="text-[var(--app-text-muted)]">{customer.lastVisit}</div>
                <div className="flex justify-end text-[var(--app-text-soft)]">›</div>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {drawerOpen ? (
        <CustomerProfileDrawer
          customer={selectedCustomer}
          orders={selectedCustomer ? customerOrders[selectedCustomer.id] ?? [] : []}
          measurementSets={selectedCustomer ? measurementSets.filter((set) => set.customerId === selectedCustomer.id) : []}
          onClose={() => setDrawerOpen(false)}
          onScreenChange={onScreenChange}
        />
      ) : null}
    </div>
  );
}
