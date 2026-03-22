import { ChevronRight, Mail, MapPin, Phone, Plus, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import type { Customer, CustomerOrder, MeasurementSet, Screen } from "../types";
import { ActionButton, EmptyState, SearchField, SectionHeader, Surface } from "../components/ui/primitives";
import { MeasurementStatusPill, VipPill } from "../components/ui/pills";
import { useToast } from "../components/ui/toast";
import { CustomerEditorModal } from "../components/customer/CustomerEditorModal";
import { CustomerProfileDrawer } from "../components/customer/CustomerProfileDrawer";
import {
  createNextCustomerId,
  filterCustomers,
  getCustomerLastOrderSummary,
} from "../features/customer/selectors";

type CustomerScreenProps = {
  customers: Customer[];
  customerOrders: Record<string, CustomerOrder[]>;
  measurementSets: MeasurementSet[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer) => void;
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
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
  const lastOrderParts = lastOrderSummary?.split(" • ", 2) ?? [];
  const lastOrderLabel = lastOrderParts.length === 2 ? lastOrderParts[0] : lastOrderSummary;
  const lastOrderDate = lastOrderParts.length === 2 ? lastOrderParts[1] : null;

  return (
    <button
      onClick={onOpen}
      className="grid w-full gap-3 border-b border-[var(--app-border)]/45 px-4 py-3 text-left transition hover:bg-[var(--app-surface-muted)]/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-border-strong)] sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.7fr)_180px_140px_180px_24px] xl:items-center"
    >
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <div className="app-text-strong truncate">{customer.name}</div>
          {customer.isVip ? <VipPill /> : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <div className="app-text-caption flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" />
            {customer.phone}
          </div>
        </div>
        <div className="app-text-caption mt-1 flex items-center gap-1.5 truncate">
          <Mail className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{customer.email || "No email on file"}</span>
        </div>
      </div>

      <div className="min-w-0">
        <div className="app-text-overline xl:hidden">Measurements</div>
        <div className="mt-1">
          <MeasurementStatusPill status={customer.measurementsStatus} showIcon />
        </div>
      </div>

      <div className="min-w-0">
        <div className="app-text-overline xl:hidden">Location</div>
        <div className="app-text-body mt-1 inline-flex items-center gap-1.5 font-medium">
          <MapPin className="h-3.5 w-3.5 text-[var(--app-text-soft)]" />
          <span>{customer.preferredLocation}</span>
        </div>
      </div>

      <div className="min-w-0">
        <div className="app-text-overline xl:hidden">Last order</div>
        {lastOrderSummary ? (
          <>
            <div className="app-text-body mt-1 font-medium">{lastOrderDate ?? "Recent"}</div>
            <div className="app-text-caption mt-1 truncate">{lastOrderLabel}</div>
          </>
        ) : (
          <div className="app-text-caption mt-1">No order history</div>
        )}
      </div>

      <div className="hidden justify-self-end xl:block">
        <ChevronRight className="h-4 w-4 text-[var(--app-text-soft)]" />
      </div>
    </button>
  );
}

export function CustomerScreen({
  customers,
  customerOrders,
  measurementSets,
  selectedCustomer,
  onSelectCustomer,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onScreenChange,
}: CustomerScreenProps) {
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(selectedCustomer?.id ?? null);
  const [editorMode, setEditorMode] = useState<"add" | "edit" | null>(null);

  const filteredCustomers = useMemo(() => filterCustomers(customers, query), [customers, query]);
  const activeCustomer = useMemo(
    () => customers.find((customer) => customer.id === activeCustomerId) ?? null,
    [customers, activeCustomerId],
  );

  return (
    <div className="relative space-y-4">
      <div className="space-y-4">
        <SectionHeader
          icon={Users}
          title="Customers"
          subtitle="Service directory"
        />

        <Surface tone="control" className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <SearchField
              label="Search customers"
              value={query}
              onChange={setQuery}
              placeholder="Search by name, phone, customer ID, or notes"
              icon={Search}
              className="min-w-[320px] flex-1"
            />
            <ActionButton
              tone="primary"
              className="min-h-[3.625rem] px-4 py-2.5 text-sm"
              onClick={() => setEditorMode("add")}
            >
              <Plus className="h-4 w-4" />
              Add customer
            </ActionButton>
          </div>
        </Surface>

        <div className="border-t border-[var(--app-border)]/55 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="app-text-value">Customer directory</div>
              <div className="app-text-caption mt-1">Scan the essentials here. Open a row for profile history, measurements, and actions.</div>
            </div>
            <div className="app-text-overline">{filteredCustomers.length} customers</div>
          </div>

          <div className="mt-4 overflow-hidden rounded-[var(--app-radius-md)] border border-[var(--app-border)]/55 bg-[var(--app-surface)] shadow-[var(--app-shadow-sm)]">
            <div className="hidden gap-3 border-b border-[var(--app-border)]/45 bg-[var(--app-surface-muted)]/85 px-4 py-2 xl:grid xl:grid-cols-[minmax(0,1.7fr)_180px_140px_180px_24px]">
              <div className="app-text-overline">Customer</div>
              <div className="app-text-overline">Measurements</div>
              <div className="app-text-overline">Location</div>
              <div className="app-text-overline">Last order</div>
              <div />
            </div>

            {filteredCustomers.length ? (
              <div className="divide-y divide-[var(--app-border)]/35">
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
            ) : (
              <EmptyState className="rounded-none border-0 bg-transparent shadow-none">
                <div className="app-text-body">No customers match this search.</div>
                <div className="app-text-caption mt-1">Try a name, phone number, customer ID, or note.</div>
              </EmptyState>
            )}
          </div>
        </div>
      </div>

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

            onDeleteCustomer(activeCustomer.id);
            showToast(`${activeCustomer.name} deleted.`);
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
                id: createNextCustomerId(customers),
                lastVisit: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date()),
                measurementsStatus: "missing",
              };
              onAddCustomer(nextCustomer);
              setActiveCustomerId(nextCustomer.id);
              onSelectCustomer(nextCustomer);
              showToast(`${nextCustomer.name} added.`);
            } else if (activeCustomer) {
              const updatedCustomer: Customer = {
                ...activeCustomer,
                ...draft,
              };
              onUpdateCustomer(updatedCustomer);
              setActiveCustomerId(updatedCustomer.id);
              onSelectCustomer(updatedCustomer);
              showToast(`${updatedCustomer.name} updated.`);
            }

            setEditorMode(null);
          }}
        />
      ) : null}
    </div>
  );
}
