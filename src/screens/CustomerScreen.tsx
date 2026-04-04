import { ChevronRight, Mail, MapPin, Phone, Plus, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import type { Customer, CustomerOrder, MeasurementSet, PickupLocation, Screen, ServiceAppointmentType } from "../types";
import { ActionButton, EmptyState, RowChevronAffordance, SearchField, SectionHeader, Surface } from "../components/ui/primitives";
import { MeasurementStatusPill, VipPill } from "../components/ui/pills";
import { StatusPill } from "../components/ui/primitives";
import { useToast } from "../components/ui/toast";
import { CustomerEditorModal } from "../components/customer/CustomerEditorModal";
import { CustomerProfileDrawer } from "../components/customer/CustomerProfileDrawer";
import {
  createNextCustomerId,
  filterCustomers,
  getActiveCustomers,
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
  onArchiveCustomer: (customerId: string) => void;
  onStartOrderForCustomer: (customerId: string) => void;
  onCreateAppointment: (payload: {
    customerId: string;
    typeKey: ServiceAppointmentType;
    location: PickupLocation;
    scheduledFor: string;
  }) => void;
  pickupLocations: PickupLocation[];
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
      className="app-customer-directory-row group"
    >
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <div className="app-text-strong truncate">{customer.name}</div>
          {customer.isVip ? <VipPill /> : null}
          {customer.archived ? <StatusPill tone="default">Archived</StatusPill> : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <div className="app-text-caption flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" />
            {customer.phone}
          </div>
          <div className="app-text-caption flex min-w-0 items-center gap-1.5 truncate">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{customer.email || "No email on file"}</span>
          </div>
        </div>
        {lastOrderSummary ? (
          <div className="mt-2 md:hidden">
            <div className="app-text-caption line-clamp-2 break-words">
              <span className="font-medium text-[var(--app-text)]">{lastOrderDate ?? "Recent"}</span>
              <span className="mx-1 text-[var(--app-text-soft)]">•</span>
              <span>{lastOrderLabel}</span>
            </div>
          </div>
        ) : (
          <div className="app-text-caption mt-2 md:hidden">No order history</div>
        )}
      </div>

      <div className="min-w-0 self-start justify-self-end md:flex md:min-h-full md:items-center md:justify-self-auto">
        <div className="app-text-overline hidden md:block">Measurements</div>
        <div className="mt-0 md:mt-0">
          <MeasurementStatusPill status={customer.measurementsStatus} showIcon />
        </div>
      </div>

      <div className="hidden min-w-0 md:flex md:min-h-full md:items-center">
        <div className="app-text-body mt-1 inline-flex items-center gap-1.5 font-medium md:mt-0">
          <MapPin className="h-3.5 w-3.5 text-[var(--app-text-soft)]" />
          <span>{customer.preferredLocation}</span>
        </div>
      </div>

      <div className="hidden min-w-0 md:flex md:min-h-full md:items-center">
        {lastOrderSummary ? (
          <div className="min-w-0 w-full">
            <div className="hidden app-text-body truncate font-medium md:block md:mt-0">{lastOrderDate ?? "Recent"}</div>
            <div className="hidden app-text-caption mt-1 line-clamp-2 break-words md:block">{lastOrderLabel}</div>
          </div>
        ) : (
          <div className="hidden app-text-caption md:block md:mt-0">No order history</div>
        )}
      </div>

      <div className="app-desktop-only justify-self-end">
        <ChevronRight className="h-4 w-4 text-[var(--app-text-soft)]" />
      </div>
      <RowChevronAffordance hideAboveDesktop />
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
  onArchiveCustomer,
  onStartOrderForCustomer,
  onCreateAppointment,
  pickupLocations,
  onScreenChange,
}: CustomerScreenProps) {
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(selectedCustomer?.id ?? null);
  const [editorMode, setEditorMode] = useState<"add" | "edit" | null>(null);

  const filteredCustomers = useMemo(() => {
    return filterCustomers(getActiveCustomers(customers), query);
  }, [customers, query]);
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
          subtitle="Find people and open their profiles"
        />

        <Surface tone="control" className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <SearchField
              label="Search customers"
              value={query}
              onChange={setQuery}
              placeholder="Search by name, phone, customer ID, or notes"
              icon={Search}
              className="min-w-0 basis-full md:min-w-[320px] md:flex-1"
            />
            <ActionButton
              tone="primary"
              className="min-h-[3.625rem] w-full px-4 py-2.5 text-sm md:w-auto"
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
              <div className="app-text-value">All customers</div>
              <div className="app-text-caption mt-1">Search here, then open a row for details, measurements, and actions.</div>
            </div>
            <div className="app-text-overline">{filteredCustomers.length} customers</div>
          </div>

          <div className="mt-4 overflow-hidden rounded-[var(--app-radius-md)] border border-[var(--app-border)]/55 bg-[var(--app-surface)] shadow-[var(--app-shadow-sm)]">
            <div className="app-customer-directory-head">
              <div className="app-text-overline">Customer</div>
              <div className="app-text-overline">Location</div>
              <div className="app-text-overline">Measurements</div>
              <div className="app-text-overline">Last order</div>
              <div className="app-desktop-only" />
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

            onArchiveCustomer(activeCustomer.id);
            showToast(`${activeCustomer.name} moved out of the active customer list.`, {
              title: "Customer archived",
              tone: "warning",
            });
            setDrawerOpen(false);
            setActiveCustomerId(null);
          }}
          onStartOrderForCustomer={onStartOrderForCustomer}
          onCreateAppointment={onCreateAppointment}
          pickupLocations={pickupLocations}
          customers={customers}
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
              showToast(`${nextCustomer.name} is now in the customer directory.`, {
                title: "Customer added",
                tone: "success",
              });
            } else if (activeCustomer) {
              const updatedCustomer: Customer = {
                ...activeCustomer,
                ...draft,
              };
              onUpdateCustomer(updatedCustomer);
              setActiveCustomerId(updatedCustomer.id);
              onSelectCustomer(updatedCustomer);
              showToast(`${updatedCustomer.name} has been updated.`, {
                title: "Customer updated",
                tone: "success",
              });
            }

            setEditorMode(null);
          }}
        />
      ) : null}
    </div>
  );
}
