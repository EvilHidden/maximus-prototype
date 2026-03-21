import { AlertCircle, Ruler, Search, User } from "lucide-react";
import { useMemo, useState } from "react";
import { customerOrders, customers } from "../data";
import type { Customer, MeasurementSet, Screen } from "../types";
import { ActionButton, SectionHeader, StatusPill } from "../components/ui/primitives";
import { CustomerProfileDrawer } from "../components/customer/CustomerProfileDrawer";
import { filterCustomers, getMeasurementStatusLabel, getMeasurementStatusTone } from "../features/customer/selectors";

type CustomerScreenProps = {
  measurementSets: MeasurementSet[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer) => void;
  onScreenChange: (screen: Screen) => void;
};

function CustomerRow({
  customer,
  measurementCount,
  onOpen,
}: {
  customer: Customer;
  measurementCount: number;
  onOpen: () => void;
}) {
  const statusTone = getMeasurementStatusTone(customer.measurementsStatus);
  const statusClasses =
    statusTone === "success"
      ? "border-emerald-500/45 bg-emerald-500/10 text-emerald-200"
      : "border-amber-500/45 bg-amber-500/10 text-amber-200";

  return (
    <button
      onClick={onOpen}
      className="w-full rounded-[var(--app-radius-md)] border border-[var(--app-border)]/45 bg-[var(--app-surface)]/24 px-4 py-4 text-left transition hover:bg-[var(--app-surface)]/38"
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_220px_220px_120px] xl:items-center">
        <div className="min-w-0 space-y-3">
          <div className="flex items-center gap-2">
            <div className="app-text-value truncate">{customer.name}</div>
            {customer.isVip ? <StatusPill tone="dark">VIP</StatusPill> : null}
          </div>
          <div className="app-text-caption">{customer.notes}</div>
          <div className="space-y-1">
            <div className="app-text-overline">Phone</div>
            <div className="app-text-body font-medium">{customer.phone}</div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="app-text-overline">Phone</div>
          <div className="app-text-body font-medium">{customer.phone}</div>
        </div>

        <div className="space-y-2">
          <div className="space-y-1">
            <div className="app-text-overline">Measurements</div>
            <div className="flex flex-col items-start gap-2">
              <div
                className={`inline-flex min-h-11 min-w-[132px] items-center justify-center gap-2 rounded-full border px-3 py-2 text-sm font-medium ${statusClasses}`}
              >
                {customer.measurementsStatus === "on_file" ? <Ruler className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                <span className="leading-tight">{getMeasurementStatusLabel(customer.measurementsStatus)}</span>
              </div>
              <div className="pl-2 app-text-caption">{measurementCount} sets</div>
            </div>
          </div>

        </div>

        <div className="flex items-center justify-between gap-4 xl:block xl:justify-self-end xl:text-right">
          <div className="space-y-1">
            <div className="app-text-overline">Last visit</div>
            <div className="app-text-body font-medium">{customer.lastVisit}</div>
          </div>

          <ActionButton tone="secondary" className="min-h-12 shrink-0 px-4 py-2.5 text-sm xl:mt-3 xl:w-full">
            Open
          </ActionButton>
        </div>
      </div>
    </button>
  );
}

export function CustomerScreen({ measurementSets, selectedCustomer, onSelectCustomer, onScreenChange }: CustomerScreenProps) {
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filteredCustomers = useMemo(() => filterCustomers(customers, query), [query]);

  const summary = useMemo(() => {
    return {
      total: filteredCustomers.length,
      onFile: filteredCustomers.filter((customer) => customer.measurementsStatus === "on_file").length,
      needsUpdate: filteredCustomers.filter((customer) => customer.measurementsStatus === "needs_update").length,
      vip: filteredCustomers.filter((customer) => customer.isVip).length,
    };
  }, [filteredCustomers]);

  return (
    <div className="relative space-y-4">
      <div className="space-y-4">
        <SectionHeader icon={User} title="Customers" subtitle="Service directory" />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-end">
          <label className="block">
            <div className="app-text-overline mb-2">Search customers</div>
            <div className="rounded-[var(--app-radius-md)] border border-[var(--app-border)]/55 bg-[var(--app-surface)]/18 px-4 py-3.5">
              <div className="flex items-center gap-3">
                <Search className="h-4 w-4 shrink-0 text-[var(--app-text-soft)]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by name, phone, customer ID, or notes"
                  className="min-w-0 flex-1 border-0 bg-transparent p-0 app-text-body outline-none placeholder:text-[var(--app-text-soft)]"
                />
              </div>
            </div>
          </label>

          <div className="grid grid-cols-2 gap-x-6 gap-y-2 xl:justify-self-end">
            <div>
              <div className="app-text-overline">Visible</div>
              <div className="app-text-value mt-1">{summary.total}</div>
            </div>
            <div>
              <div className="app-text-overline">On file</div>
              <div className="app-text-value mt-1">{summary.onFile}</div>
            </div>
            <div>
              <div className="app-text-overline">Needs update</div>
              <div className="app-text-value mt-1">{summary.needsUpdate}</div>
            </div>
            <div>
              <div className="app-text-overline">VIP</div>
              <div className="app-text-value mt-1">{summary.vip}</div>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--app-border)]/55 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="app-text-value">Customer board</div>
              <div className="app-text-caption mt-1">Tap any profile to open service history, measurements, and actions.</div>
            </div>
            <div className="app-text-overline">{filteredCustomers.length} customers</div>
          </div>

          <div className="mt-4 space-y-3">
            {filteredCustomers.map((customer) => {
              const measurementCount = measurementSets.filter((set) => set.customerId === customer.id).length;

              return (
                <CustomerRow
                  key={customer.id}
                  customer={customer}
                  measurementCount={measurementCount}
                  onOpen={() => {
                    onSelectCustomer(customer);
                    setDrawerOpen(true);
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

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
