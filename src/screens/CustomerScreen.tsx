import { Mail, MapPin, Phone, Plus, Ruler, Search, User, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { customerOrders, customers } from "../data";
import type { Customer, MeasurementSet, Screen } from "../types";
import { ActionButton, SectionHeader, StatusPill } from "../components/ui/primitives";
import { CustomerProfileDrawer } from "../components/customer/CustomerProfileDrawer";
import {
  filterCustomers,
  getCustomerLastOrderSummary,
} from "../features/customer/selectors";

type CustomerScreenProps = {
  measurementSets: MeasurementSet[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer) => void;
  onScreenChange: (screen: Screen) => void;
};

function CustomerRow({
  customer,
  lastOrderSummary,
  onOpen,
}: {
  customer: Customer;
  lastOrderSummary: string | null;
  onOpen: () => void;
}) {
  const hasMeasurementsOnFile = customer.measurementsStatus === "on_file";
  const lastOrderParts = lastOrderSummary?.split(" • ", 2) ?? [];
  const lastOrderLabel = lastOrderParts.length === 2 ? lastOrderParts[0] : lastOrderSummary;
  const lastOrderDate = lastOrderParts.length === 2 ? lastOrderParts[1] : null;

  return (
    <button
      onClick={onOpen}
      className="w-full rounded-[var(--app-radius-lg)] border border-[var(--app-border)]/55 bg-[var(--app-surface)] px-4 py-3 text-left shadow-[var(--app-shadow-sm)] transition hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface)]"
    >
      <div className="grid gap-3 xl:grid-cols-[minmax(0,2fr)_340px] xl:items-stretch">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="app-icon-chip mt-0.5">
                <User className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="app-text-value truncate">{customer.name}</div>
                  {customer.isVip ? <StatusPill tone="dark">VIP</StatusPill> : null}
                </div>
              </div>
            </div>
            <div className="app-text-caption shrink-0">{customer.id}</div>
          </div>

          <div className="mt-2 grid gap-x-5 gap-y-3 md:grid-cols-2">
            <div className="min-w-0 py-1">
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-[var(--app-text-soft)]" />
                <div className="app-text-overline">Phone</div>
              </div>
              <div className="app-text-body mt-1 font-medium">{customer.phone}</div>
            </div>
            <div className="min-w-0 py-1">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-[var(--app-text-soft)]" />
                <div className="app-text-overline">Email</div>
              </div>
              <div className="app-text-body mt-1 truncate font-medium">{customer.email}</div>
            </div>
            <div className="min-w-0 py-1">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-[var(--app-text-soft)]" />
                <div className="app-text-overline">Address</div>
              </div>
              <div className="app-text-body mt-1 font-medium">{customer.address}</div>
            </div>
            <div className="min-w-0 py-1">
              <div className="app-text-overline">Notes</div>
              <div className="app-text-caption mt-0.5">{customer.notes}</div>
            </div>
          </div>
        </div>

        <div className="grid h-full gap-x-4 gap-y-2 rounded-[var(--app-radius-md)] border border-[var(--app-border)]/35 bg-[var(--app-surface-muted)]/16 px-3 py-2.5 sm:grid-cols-2">
          <div className="min-w-0 self-start">
            <div className="app-text-overline">Preferred location</div>
            <div className="app-text-body mt-0.5 font-medium">{customer.preferredLocation}</div>
          </div>
          <div className="min-w-0 self-start">
            <div className="app-text-overline">Last visit</div>
            <div className="app-text-body mt-0.5 font-medium">{customer.lastVisit}</div>
          </div>
          <div className="min-w-0 self-start">
            <div className="app-text-overline">Measurements</div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <StatusPill tone={hasMeasurementsOnFile ? "success" : "default"}>
                <Ruler className="h-3.5 w-3.5" />
                {hasMeasurementsOnFile ? "On file" : "Not on file"}
              </StatusPill>
            </div>
          </div>
          <div className="min-w-0 self-start">
            <div className="app-text-overline">Last order</div>
            {lastOrderSummary ? (
              <>
                <div className="app-text-body mt-0.5 font-medium">{lastOrderDate ?? "Recent"}</div>
                <div className="app-text-caption mt-0.5">{lastOrderLabel}</div>
              </>
            ) : (
              <div className="app-text-caption mt-0.5">No order history yet</div>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

export function CustomerScreen({ measurementSets, selectedCustomer, onSelectCustomer, onScreenChange }: CustomerScreenProps) {
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);

  const filteredCustomers = useMemo(() => filterCustomers(customers, query), [query]);

  useEffect(() => {
    if (!actionToast) {
      return;
    }

    const timeoutId = window.setTimeout(() => setActionToast(null), 2400);
    return () => window.clearTimeout(timeoutId);
  }, [actionToast]);

  return (
    <div className="relative space-y-4">
      <div className="space-y-4">
        <SectionHeader
          icon={Users}
          title="Customers"
          subtitle="Service directory"
        />

        <div className="flex flex-wrap items-end gap-3">
          <label className="block min-w-[320px] flex-1">
            <div className="app-text-overline mb-2">Search customers</div>
            <div className="rounded-[var(--app-radius-lg)] border border-[var(--app-border)]/55 bg-[var(--app-surface)] px-4 py-3.5 shadow-[var(--app-shadow-sm)]">
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
          <ActionButton
            tone="primary"
            className="min-h-[3.625rem] px-4 py-2.5 text-sm"
            onClick={() => setActionToast("New customer intake is ready to be connected next.")}
          >
            <Plus className="h-4 w-4" />
            Add customer
          </ActionButton>
        </div>

        <div className="border-t border-[var(--app-border)]/55 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="app-text-value">Customer board</div>
              <div className="app-text-caption mt-1">Tap any profile to open service history, measurements, and actions.</div>
            </div>
            <div className="app-text-overline">{filteredCustomers.length} customers</div>
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-2">
            {filteredCustomers.map((customer) => {
              const lastOrderSummary = getCustomerLastOrderSummary(customerOrders[customer.id] ?? []);

              return (
                <CustomerRow
                  key={customer.id}
                  customer={customer}
                  lastOrderSummary={lastOrderSummary}
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

      {actionToast ? (
        <div className="pointer-events-none fixed bottom-5 right-5 z-50 max-w-[320px] rounded-[var(--app-radius-md)] border border-[var(--app-border-strong)] bg-[var(--app-surface)] px-4 py-3 shadow-[var(--app-shadow-lg)]">
          <div className="app-text-body font-medium">{actionToast}</div>
        </div>
      ) : null}

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
