import { Mail, MapPin, Phone, Plus, Ruler, Search, User, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { customerOrders, customers } from "../data";
import type { Customer, MeasurementSet, Screen } from "../types";
import { ActionButton, SectionHeader, StatusPill } from "../components/ui/primitives";
import { CustomerEditorModal } from "../components/customer/CustomerEditorModal";
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
  const hasVisitHistory = Boolean(customer.lastVisit && customer.lastVisit !== "New");
  const lastOrderParts = lastOrderSummary?.split(" • ", 2) ?? [];
  const lastOrderLabel = lastOrderParts.length === 2 ? lastOrderParts[0] : lastOrderSummary;
  const lastOrderDate = lastOrderParts.length === 2 ? lastOrderParts[1] : null;

  return (
    <button
      onClick={onOpen}
      className="w-full rounded-[var(--app-radius-md)] border border-[var(--app-border)]/55 bg-[var(--app-surface)] px-4 py-3 text-left shadow-[var(--app-shadow-sm)] transition hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface)]"
    >
      <div className="space-y-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="app-icon-chip">
            <User className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="app-text-value truncate">{customer.name}</div>
              {customer.isVip ? <StatusPill tone="dark">VIP</StatusPill> : null}
            </div>
          </div>
        </div>

        <div className="grid gap-x-5 gap-y-3 md:grid-cols-2 xl:grid-cols-4">
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
          <div className="min-w-0 py-1">
            <div className="app-text-overline">Preferred location</div>
            <div className="app-text-body mt-0.5 font-medium">{customer.preferredLocation}</div>
          </div>
          <div className="min-w-0 py-1">
            <div className="app-text-overline">Last visit</div>
            <div className={hasVisitHistory ? "app-text-body mt-0.5 font-medium" : "app-text-caption mt-0.5"}>
              {hasVisitHistory ? customer.lastVisit : "No visit history yet"}
            </div>
          </div>
          <div className="min-w-0 py-1">
            <div className="app-text-overline">Measurements</div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <StatusPill tone={hasMeasurementsOnFile ? "success" : "default"}>
                <Ruler className="h-3.5 w-3.5" />
                {hasMeasurementsOnFile ? "On file" : "Not on file"}
              </StatusPill>
            </div>
          </div>
          <div className="min-w-0 py-1">
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
  const [customerRecords, setCustomerRecords] = useState<Customer[]>(customers);
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(selectedCustomer?.id ?? null);
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<"add" | "edit" | null>(null);

  const filteredCustomers = useMemo(() => filterCustomers(customerRecords, query), [customerRecords, query]);
  const activeCustomer = useMemo(
    () => customerRecords.find((customer) => customer.id === activeCustomerId) ?? null,
    [customerRecords, activeCustomerId],
  );

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
            onClick={() => setEditorMode("add")}
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
                    setActiveCustomerId(customer.id);
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
          customer={activeCustomer}
          orders={activeCustomer ? customerOrders[activeCustomer.id] ?? [] : []}
          measurementSets={activeCustomer ? measurementSets.filter((set) => set.customerId === activeCustomer.id) : []}
          onClose={() => setDrawerOpen(false)}
          onEditCustomer={() => setEditorMode("edit")}
          onDeleteCustomer={() => {
            if (!activeCustomer) {
              return;
            }

            setCustomerRecords((current) => current.filter((customer) => customer.id !== activeCustomer.id));
            setActionToast(`${activeCustomer.name} deleted.`);
            setDrawerOpen(false);
            setActiveCustomerId(null);
          }}
          onScreenChange={onScreenChange}
        />
      ) : null}

      {editorMode ? (
        <CustomerEditorModal
          mode={editorMode}
          customer={editorMode === "edit" ? activeCustomer : null}
          onClose={() => setEditorMode(null)}
          onSave={(draft) => {
            if (editorMode === "add") {
              const nextCustomer: Customer = {
                ...draft,
                id: `C-${Math.floor(1000 + Math.random() * 9000)}`,
                lastVisit: "",
                measurementsStatus: "missing",
              };
              setCustomerRecords((current) => [nextCustomer, ...current]);
              setActiveCustomerId(nextCustomer.id);
              onSelectCustomer(nextCustomer);
              setActionToast(`${nextCustomer.name} added.`);
            } else if (activeCustomer) {
              const updatedCustomer: Customer = {
                ...activeCustomer,
                ...draft,
              };
              setCustomerRecords((current) =>
                current.map((customer) => (customer.id === updatedCustomer.id ? updatedCustomer : customer)),
              );
              setActiveCustomerId(updatedCustomer.id);
              onSelectCustomer(updatedCustomer);
              setActionToast(`${updatedCustomer.name} updated.`);
            }

            setEditorMode(null);
          }}
        />
      ) : null}
    </div>
  );
}
