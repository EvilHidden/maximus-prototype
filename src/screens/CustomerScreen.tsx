import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { customerOrders, customers } from "../data/fixtures";
import type { Customer, Screen } from "../types";
import { Card, SectionHeader, StatusPill } from "../components/ui/primitives";
import { CustomerProfileDrawer } from "../components/customer/CustomerProfileDrawer";

type CustomerScreenProps = {
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer) => void;
  onScreenChange: (screen: Screen) => void;
};

export function CustomerScreen({ selectedCustomer, onSelectCustomer, onScreenChange }: CustomerScreenProps) {
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filteredCustomers = useMemo(() => {
    const lowerQuery = query.toLowerCase();
    return customers.filter((customer) => {
      return (
        lowerQuery.length === 0 ||
        customer.name.toLowerCase().includes(lowerQuery) ||
        customer.phone.includes(lowerQuery) ||
        customer.id.toLowerCase().includes(lowerQuery)
      );
    });
  }, [query]);

  return (
    <div className="relative">
      <Card className="p-4">
        <SectionHeader icon={Search} title="Customers" subtitle="Directory" />

        <div className="relative mb-4">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, phone, or customer ID"
            className="w-full rounded-2xl border border-slate-300 py-3 pl-9 pr-3 text-sm outline-none"
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="grid grid-cols-[minmax(0,1.4fr)_170px_150px_150px_48px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <div>Customer</div>
            <div>Phone</div>
            <div>Measurements</div>
            <div>Last visit</div>
            <div />
          </div>

          <div className="max-h-[560px] divide-y divide-slate-200 overflow-auto">
            {filteredCustomers.map((customer) => (
              <button
                key={customer.id}
                onClick={() => {
                  onSelectCustomer(customer);
                  setDrawerOpen(true);
                }}
                className="grid w-full grid-cols-[minmax(0,1.4fr)_170px_150px_150px_48px] items-center gap-3 bg-white px-4 py-3 text-left text-sm hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate font-semibold text-slate-900">{customer.name}</div>
                    {customer.isVip ? <StatusPill tone="dark">VIP</StatusPill> : null}
                  </div>
                  <div className="truncate text-xs text-slate-500">{customer.notes}</div>
                </div>
                <div className="truncate text-slate-700">{customer.phone}</div>
                <div className="text-slate-700">{customer.measurementsStatus}</div>
                <div className="text-slate-600">{customer.lastVisit}</div>
                <div className="flex justify-end text-slate-400">›</div>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {drawerOpen ? (
        <CustomerProfileDrawer
          customer={selectedCustomer}
          orders={selectedCustomer ? customerOrders[selectedCustomer.id] ?? [] : []}
          onClose={() => setDrawerOpen(false)}
          onScreenChange={onScreenChange}
        />
      ) : null}
    </div>
  );
}
