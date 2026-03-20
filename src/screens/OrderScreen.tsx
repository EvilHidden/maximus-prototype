import { Clock, Receipt, Ruler, Scissors, Shirt, ShoppingBag, Trash2 } from "lucide-react";
import { Search, UserPlus } from "lucide-react";
import { alterationCatalog, customCatalog, customers, pricingBands } from "../data/fixtures";
import { useMemo, useState } from "react";
import type { AlterationService, Customer, OrderType, Screen, WorkflowDraft } from "../types";
import { ActionButton, Card, SectionHeader } from "../components/ui/primitives";

type OrderScreenProps = {
  draft: WorkflowDraft;
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer) => void;
  onDraftChange: (patch: Partial<WorkflowDraft>) => void;
  onScreenChange: (screen: Screen) => void;
  onOrderTypeChange: (orderType: OrderType) => void;
};

export function OrderScreen({
  draft,
  selectedCustomer,
  onSelectCustomer,
  onDraftChange,
  onScreenChange,
  onOrderTypeChange,
}: OrderScreenProps) {
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerQuery, setCustomerQuery] = useState("");
  const [pickupModalOpen, setPickupModalOpen] = useState(false);
  const [measurementPickerOpen, setMeasurementPickerOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [pendingDeleteItemId, setPendingDeleteItemId] = useState<number | null>(null);
  const hasAlterations = draft.orderType === "alteration" || draft.orderType === "mixed";
  const hasCustom = draft.orderType === "custom" || draft.orderType === "mixed";
  const activeWorkflow = draft.activeWorkflow ?? (hasAlterations ? "alteration" : hasCustom ? "custom" : null);
  const showAlterationWorkflow = activeWorkflow === "alteration";
  const showCustomWorkflow = activeWorkflow === "custom";
  const garmentOptions = alterationCatalog.map((garment) => garment.category);
  const currentServices = alterationCatalog.find((garment) => garment.category === draft.selectedGarment)?.services ?? [];
  const currentAlterationSubtotal = draft.selectedMods.reduce((sum, modifier) => sum + modifier.price, 0);
  const alterationSubtotal = draft.alterationItems.reduce((sum, item) => sum + item.subtotal, 0);
  const hasCustomConfigured = hasCustom && Boolean(draft.selectedCustomItem);
  const customSubtotal = !draft.selectedCustomItem
    ? 0
    : draft.selectedCustomItem === "Bundle" || draft.bundleType === "Bundle"
      ? 2495
      : 1495;
  const subtotal = alterationSubtotal + (hasCustom ? customSubtotal : 0);
  const taxAmount = subtotal * 0.08875;
  const projectedTotal = subtotal + taxAmount;
  const depositDue = hasCustomConfigured ? Math.round(customSubtotal * 0.5 * 100) / 100 : 0;
  const editingItem = draft.alterationItems.find((item) => item.id === editingItemId) ?? null;
  const editingServices = alterationCatalog.find((garment) => garment.category === editingItem?.garment)?.services ?? [];
  const filteredCustomers = useMemo(() => {
    const query = customerQuery.trim().toLowerCase();
    if (!query) {
      return customers;
    }

    return customers.filter((customer) => {
      return (
        customer.name.toLowerCase().includes(query) ||
        customer.phone.includes(query) ||
        customer.notes.toLowerCase().includes(query)
      );
    });
  }, [customerQuery]);
  const suggestedMeasurementSet = selectedCustomer
    ? selectedCustomer.measurementsStatus === "On file"
      ? "Version 4 • Latest on file"
      : selectedCustomer.measurementsStatus === "Needs update"
        ? "Version 4 • Review before use"
        : null
    : null;
  const availableMeasurementSets = selectedCustomer
    ? [
        ...(suggestedMeasurementSet ? [suggestedMeasurementSet] : []),
        "Version 3 • Jan 22 • Tuxedo order",
        "Version 2 • Sep 14 • Alteration profile",
      ]
    : [];

  const toggleModifier = (service: AlterationService) => {
    const isSelected = draft.selectedMods.some((modifier) => modifier.name === service.name);
    onDraftChange({
      selectedMods: isSelected
        ? draft.selectedMods.filter((modifier) => modifier.name !== service.name)
        : [...draft.selectedMods, service],
    });
  };

  const addAlterationItem = () => {
    if (draft.selectedMods.length === 0) {
      return;
    }

    onDraftChange({
      alterationItems: [
        ...draft.alterationItems,
        {
          id: Date.now(),
          garment: draft.selectedGarment,
          modifiers: [...draft.selectedMods],
          subtotal: currentAlterationSubtotal,
        },
      ],
      selectedMods: [],
    });
  };

  const updateAlterationItem = (itemId: number, patch: Partial<{ garment: string; modifiers: AlterationService[] }>) => {
    onDraftChange({
      alterationItems: draft.alterationItems.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        const garment = patch.garment ?? item.garment;
        const modifiers = patch.modifiers ?? item.modifiers;
        return {
          ...item,
          garment,
          modifiers,
          subtotal: modifiers.reduce((sum, modifier) => sum + modifier.price, 0),
        };
      }),
    });
  };

  const removeAlterationItem = (itemId: number) => {
    onDraftChange({
      alterationItems: draft.alterationItems.filter((item) => item.id !== itemId),
    });
    setEditingItemId(null);
    setPendingDeleteItemId(null);
  };

  const clearCart = () => {
    onDraftChange({
      orderType: null,
      activeWorkflow: null,
      linkedMeasurementSet: null,
      selectedGarment: "",
      selectedMods: [],
      alterationItems: [],
      pickupDate: "",
      pickupTime: "",
      selectedCustomItem: null,
      construction: null,
      bundleType: null,
      selectedBand: null,
    });
    setEditingItemId(null);
    setPickupModalOpen(false);
  };

  const toggleWorkflow = (nextType: Exclude<OrderType, "mixed">) => {
    const nextHasAlterations = nextType === "alteration" ? true : hasAlterations;
    const nextHasCustom = nextType === "custom" ? true : hasCustom;

    const nextOrderType = nextHasAlterations && nextHasCustom
      ? "mixed"
      : nextHasAlterations
        ? "alteration"
        : nextHasCustom
          ? "custom"
          : null;

    onOrderTypeChange(nextOrderType ?? "alteration");
    onDraftChange({ orderType: nextOrderType, activeWorkflow: nextType });
  };

  const requestDeleteItem = (itemId: number) => {
    setPendingDeleteItemId(itemId);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
      <div className="space-y-4">
        <Card className="p-4">
          <SectionHeader icon={Receipt} title="Create order" subtitle="Select workflow" />

          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "alteration" as const, label: "Alterations", icon: Scissors },
              { key: "custom" as const, label: "Custom garment", icon: Shirt },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  toggleWorkflow(item.key);
                }}
                className={`rounded-2xl border p-4 text-left ${
                  activeWorkflow === item.key
                    ? "border-slate-900 bg-slate-50"
                    : (item.key === "alteration" ? hasAlterations : hasCustom)
                      ? "border-slate-300 bg-white"
                      : "border-slate-200"
                }`}
              >
                <item.icon className="mb-3 h-5 w-5" />
                <div className="font-semibold">{item.label}</div>
                <div className="mt-1 text-sm text-slate-500">
                  {item.key === "alteration" ? "Garments and modifiers" : "Measurements and pricing"}
                </div>
              </button>
            ))}
          </div>

          {draft.orderType === null ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              Select an order type.
            </div>
          ) : null}
        </Card>

        {showAlterationWorkflow ? (
          <>
            <Card className="p-4">
              <SectionHeader icon={Scissors} title="Alteration intake" subtitle="Build item" />

              <div className="mb-4">
                <div className="mb-2 text-sm font-semibold text-slate-900">Select garment</div>
                <div className="grid gap-2 md:grid-cols-6">
                  {garmentOptions.map((garment) => (
                    <button
                      key={garment}
                      onClick={() => onDraftChange({ selectedGarment: garment, selectedMods: [] })}
                      className={`flex min-h-11 items-center rounded-2xl border px-3 py-2.5 text-left text-sm leading-none ${draft.selectedGarment === garment ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:bg-slate-50"}`}
                    >
                      <span>{garment}</span>
                    </button>
                  ))}
                </div>
                {!draft.selectedGarment ? (
                  <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
                    Select a garment.
                  </div>
                ) : null}
              </div>

              <div>
                {draft.selectedGarment ? (
                  <div className="grid max-h-[360px] gap-2 overflow-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
                    {currentServices.map((service) => (
                      <button
                        key={`${draft.selectedGarment}-${service.name}`}
                        onClick={() => toggleModifier(service)}
                        className={`rounded-2xl border p-3 text-left text-sm ${draft.selectedMods.some((modifier) => modifier.name === service.name) ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:bg-slate-50"}`}
                      >
                        <div className="font-medium text-slate-900">{service.name}</div>
                        <div className="mt-1 text-xs text-slate-500">${service.price.toFixed(2)}</div>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
                <div className="text-sm text-slate-700">
                  <div className="font-medium text-slate-900">Current item subtotal</div>
                  <div className="text-xs text-slate-500">Add item to order.</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-lg font-semibold text-slate-900">${currentAlterationSubtotal.toFixed(2)}</div>
                  <ActionButton tone="primary" disabled={!draft.selectedGarment || draft.selectedMods.length === 0} onClick={addAlterationItem}>
                    Add to order
                  </ActionButton>
                </div>
              </div>
            </Card>

          </>
        ) : null}

        {showCustomWorkflow ? (
          <>
            <Card className="p-4">
              <SectionHeader icon={Ruler} title="Measurements" subtitle="Required for custom" />

              {!selectedCustomer ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
                  Select a customer first.
                </div>
              ) : draft.linkedMeasurementSet ? (
                <>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Linked set</div>
                    <div className="mt-1 text-sm font-medium text-slate-900">{draft.linkedMeasurementSet}</div>
                    <div className="mt-1 text-xs text-slate-500">{selectedCustomer.name}</div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <ActionButton tone="secondary" className="px-3 py-2.5 text-xs" onClick={() => setMeasurementPickerOpen(true)}>
                      Choose another
                    </ActionButton>
                    <ActionButton tone="secondary" className="px-3 py-2.5 text-xs" onClick={() => onScreenChange("measurements")}>
                      New measurements
                    </ActionButton>
                  </div>
                </>
              ) : suggestedMeasurementSet ? (
                <>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Suggested set</div>
                    <div className="mt-1 text-sm font-medium text-slate-900">{suggestedMeasurementSet}</div>
                    <div className="mt-1 text-xs text-slate-500">{selectedCustomer.name}</div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <ActionButton tone="primary" className="px-3 py-2.5 text-xs" onClick={() => onDraftChange({ linkedMeasurementSet: suggestedMeasurementSet })}>
                      Use suggested
                    </ActionButton>
                    <ActionButton tone="secondary" className="px-3 py-2.5 text-xs" onClick={() => setMeasurementPickerOpen(true)}>
                      Choose another
                    </ActionButton>
                    <ActionButton tone="secondary" className="px-3 py-2.5 text-xs" onClick={() => onScreenChange("measurements")}>
                      New measurements
                    </ActionButton>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
                    No measurement set linked.
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <ActionButton tone="secondary" className="px-3 py-2.5 text-xs" onClick={() => setMeasurementPickerOpen(true)}>
                      Choose set
                    </ActionButton>
                    <ActionButton tone="primary" className="px-3 py-2.5 text-xs" onClick={() => onScreenChange("measurements")}>
                      New measurements
                    </ActionButton>
                  </div>
                </>
              )}
            </Card>

            <Card className="p-4">
              <SectionHeader icon={Ruler} title="Custom garment" subtitle="Select garment" />
              <div className="mb-4 grid gap-2 md:grid-cols-4">
                {customCatalog.map((item) => (
                  <button
                    key={item}
                    onClick={() => onDraftChange({ selectedCustomItem: item, construction: null, bundleType: null, selectedBand: null })}
                    className={`flex min-h-11 items-center rounded-2xl border px-3 py-2.5 text-left text-sm leading-none ${draft.selectedCustomItem === item ? "border-slate-900 bg-slate-50" : "border-slate-200"}`}
                  >
                    <span>{item}</span>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <SectionHeader icon={Shirt} title="Configuration" subtitle="Set garment details" />

              {draft.selectedCustomItem ? (
                <>
                  <div className="mb-4 grid gap-3 md:grid-cols-3">
                    <label className="text-sm">
                      <div className="mb-1 text-slate-600">Garment type</div>
                      <input value={draft.selectedCustomItem} readOnly className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-3 outline-none" />
                    </label>
                    <label className="text-sm">
                      <div className="mb-1 text-slate-600">Construction</div>
                      <select value={draft.construction ?? ""} onChange={(event) => onDraftChange({ construction: event.target.value || null })} className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-3 outline-none">
                        <option value="">Select</option>
                        <option>Full canvas</option>
                        <option>Half canvas</option>
                        <option>Fused</option>
                      </select>
                    </label>
                    <label className="text-sm">
                      <div className="mb-1 text-slate-600">Bundle or single</div>
                      <select value={draft.bundleType ?? ""} onChange={(event) => onDraftChange({ bundleType: event.target.value || null })} className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-3 outline-none">
                        <option value="">Select</option>
                        <option>Single garment</option>
                        <option>Bundle</option>
                      </select>
                    </label>
                  </div>

                  <div>
                    <div className="mb-2 text-sm font-semibold text-slate-900">Pricing band</div>
                    <div className="grid gap-2 md:grid-cols-3">
                      {pricingBands.map((band) => (
                        <button
                          key={band}
                          onClick={() => onDraftChange({ selectedBand: band })}
                          className={`rounded-2xl border p-3 text-left text-sm ${draft.selectedBand === band ? "border-slate-900 bg-slate-50" : "border-slate-200"}`}
                        >
                          {band}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
                  Select a garment first.
                </div>
              )}
            </Card>
          </>
        ) : null}
      </div>

      <div className="space-y-4">
        <Card className="sticky top-0 p-4">
          <SectionHeader
            icon={ShoppingBag}
            title="Order bag"
            subtitle="Cart"
            action={
              draft.orderType !== null ? (
                <ActionButton tone="quiet" className="px-3 py-2 text-xs" onClick={clearCart}>
                  Clear cart
                </ActionButton>
              ) : null
            }
          />
          <div className="space-y-4 text-sm text-slate-700">
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="text-xs uppercase tracking-wide text-slate-500">Customer</div>
                <button
                  onClick={() => setCustomerModalOpen(true)}
                  className="text-xs font-medium text-slate-600 underline decoration-slate-300 underline-offset-2 hover:text-slate-900"
                >
                  Change
                </button>
              </div>
              <div className="font-semibold text-slate-900">{selectedCustomer?.name ?? "Customer required"}</div>
              <div className="mt-1 text-xs text-slate-500">{selectedCustomer?.phone ?? "Customer required"}</div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-3">
              <div className="mb-3 flex justify-between">
                <span className="text-slate-500">Items</span>
                <span className="font-medium text-slate-900">{draft.alterationItems.length + (hasCustom ? 1 : 0)}</span>
              </div>

              <div className="max-h-[280px] space-y-2 overflow-auto">
                {draft.alterationItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="group w-full rounded-2xl bg-slate-50 p-3 transition hover:bg-slate-100"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        onClick={() => setEditingItemId(item.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="font-medium text-slate-900">{index + 1}. Alteration - {item.garment}</div>
                        <div className="mt-1 text-xs text-slate-500">{item.modifiers.map((modifier) => modifier.name).join(", ")}</div>
                      </button>
                      <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                        <div className="text-sm font-semibold text-slate-900">${item.subtotal.toFixed(2)}</div>
                        <button
                          onClick={() => requestDeleteItem(item.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 opacity-0 transition group-hover:opacity-100 hover:text-rose-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {hasCustomConfigured ? (
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-slate-900">Custom Garment - {draft.selectedCustomItem}</div>
                        <div className="mt-1 text-xs text-slate-500">{draft.linkedMeasurementSet || "Measurements required"} • {draft.construction || "Construction required"} • {draft.selectedBand || "Pricing required"} • {draft.bundleType || "Bundle required"}</div>
                      </div>
                      <div className="text-sm font-semibold text-slate-900">${customSubtotal.toFixed(2)}</div>
                    </div>
                  </div>
                ) : null}

                {draft.alterationItems.length === 0 && !hasCustom ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-3 text-xs text-slate-500">No items added yet.</div>
                ) : null}
              </div>
            </div>

            {hasAlterations ? (
              <div className="space-y-2 rounded-2xl border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Pickup</div>
                  <button
                    onClick={() => setPickupModalOpen(true)}
                    className="text-xs font-medium text-slate-600 underline decoration-slate-300 underline-offset-2 hover:text-slate-900"
                  >
                    {draft.pickupDate && draft.pickupTime ? "Change" : "Set"}
                  </button>
                </div>
                <div className="flex justify-between"><span className="text-slate-500">Date</span><span className="font-medium text-slate-900">{draft.pickupDate || "Required"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Time</span><span className="font-medium text-slate-900">{draft.pickupTime || "Required"}</span></div>
                {!draft.pickupDate || !draft.pickupTime ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-600">
                    Pickup date and time required.
                  </div>
                ) : null}
              </div>
            ) : null}

            {draft.orderType !== null ? (
              <div className="rounded-2xl border border-slate-200 p-3">
                <div className="mb-3 text-xs uppercase tracking-wide text-slate-500">Pricing</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Alterations</span>
                    <span className="font-medium text-slate-900">${alterationSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Custom garments</span>
                    <span className="font-medium text-slate-900">${hasCustomConfigured ? customSubtotal.toFixed(2) : "0.00"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tax</span>
                    <span className="font-medium text-slate-900">${taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Deposit due</span>
                    <span className="font-medium text-slate-900">${depositDue.toFixed(2)}</span>
                  </div>
                </div>
                <div className="mt-3 border-t border-slate-200 pt-3">
                  <div className="flex justify-between text-base">
                    <span className="font-semibold text-slate-900">Total</span>
                    <span className="font-semibold text-slate-900">${projectedTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-600">
                No summary yet.
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <ActionButton tone="secondary">Save draft</ActionButton>
              <ActionButton
                tone="primary"
                disabled={draft.orderType === null || !selectedCustomer || (hasAlterations && (!draft.pickupDate || !draft.pickupTime))}
                onClick={() => onScreenChange(showCustomWorkflow ? "measurements" : "checkout")}
              >
                {showCustomWorkflow ? "Go to measurements" : "Continue to checkout"}
              </ActionButton>
            </div>
          </div>
        </Card>
      </div>

      {customerModalOpen ? (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setCustomerModalOpen(false)} />
          <div className="absolute left-1/2 top-1/2 w-full max-w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="formal-section-title text-slate-900">Change linked customer</div>
                <div className="formal-section-copy text-slate-500">Search or create</div>
              </div>
              <ActionButton tone="secondary" onClick={() => setCustomerModalOpen(false)} className="px-3 py-2 text-xs">
                Close
              </ActionButton>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input
                value={customerQuery}
                onChange={(event) => setCustomerQuery(event.target.value)}
                placeholder="Search name, phone, or note"
                className="w-full rounded-2xl border border-slate-300 py-3 pl-9 pr-3 text-sm outline-none"
              />
            </div>

            <div className="max-h-[320px] space-y-2 overflow-auto">
              {filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => {
                    onSelectCustomer(customer);
                    setCustomerModalOpen(false);
                    setCustomerQuery("");
                  }}
                  className="flex w-full items-start justify-between rounded-2xl border border-slate-200 p-3 text-left hover:bg-slate-50"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{customer.name}</div>
                    <div className="mt-1 text-xs text-slate-500">{customer.phone}</div>
                    <div className="mt-1 text-xs text-slate-500">{customer.notes}</div>
                  </div>
                  <div className="text-xs text-slate-500">{customer.lastVisit}</div>
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
              <div className="text-xs text-slate-500">Need someone new?</div>
              <ActionButton tone="secondary" className="flex items-center gap-2 px-3 py-2 text-xs">
                <UserPlus className="h-3.5 w-3.5" />
                Create customer
              </ActionButton>
            </div>
          </div>
        </div>
      ) : null}

      {measurementPickerOpen ? (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMeasurementPickerOpen(false)} />
          <div className="absolute left-1/2 top-1/2 w-full max-w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="formal-section-title text-slate-900">Choose measurement set</div>
                <div className="formal-section-copy text-slate-500">{selectedCustomer?.name ?? "No customer selected"}</div>
              </div>
              <ActionButton tone="secondary" onClick={() => setMeasurementPickerOpen(false)} className="px-3 py-2 text-xs">
                Close
              </ActionButton>
            </div>

            <div className="space-y-2">
              {availableMeasurementSets.map((setName) => (
                <button
                  key={setName}
                  onClick={() => {
                    onDraftChange({ linkedMeasurementSet: setName });
                    setMeasurementPickerOpen(false);
                  }}
                  className="flex w-full items-start justify-between rounded-2xl border border-slate-200 p-3 text-left hover:bg-slate-50"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-900">{setName}</div>
                    <div className="mt-1 text-xs text-slate-500">Attach to this order</div>
                  </div>
                  {draft.linkedMeasurementSet === setName ? <div className="text-xs font-medium text-slate-900">Current</div> : null}
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
              <div className="text-xs text-slate-500">Need a new set instead?</div>
              <ActionButton tone="primary" className="px-3 py-2 text-xs" onClick={() => {
                setMeasurementPickerOpen(false);
                onScreenChange("measurements");
              }}>
                New measurements
              </ActionButton>
            </div>
          </div>
        </div>
      ) : null}

      {pickupModalOpen ? (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setPickupModalOpen(false)} />
          <div className="absolute left-1/2 top-1/2 w-full max-w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="formal-section-title text-slate-900">Set pickup schedule</div>
                <div className="formal-section-copy text-slate-500">Set date and time</div>
              </div>
              <ActionButton tone="secondary" onClick={() => setPickupModalOpen(false)} className="px-3 py-2 text-xs">
                Close
              </ActionButton>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm">
                <div className="mb-1 text-slate-600">Pickup date</div>
                <input
                  value={draft.pickupDate}
                  onChange={(event) => onDraftChange({ pickupDate: event.target.value })}
                  type="date"
                  className="w-full rounded-2xl border border-slate-300 px-3 py-3 outline-none"
                />
              </label>
              <label className="text-sm">
                <div className="mb-1 text-slate-600">Pickup time</div>
                <input
                  value={draft.pickupTime}
                  onChange={(event) => onDraftChange({ pickupTime: event.target.value })}
                  type="time"
                  className="w-full rounded-2xl border border-slate-300 px-3 py-3 outline-none"
                />
              </label>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
              <div className="text-xs text-slate-500">Required for alterations.</div>
              <ActionButton
                tone="primary"
                onClick={() => setPickupModalOpen(false)}
                disabled={!draft.pickupDate || !draft.pickupTime}
              >
                Save pickup
              </ActionButton>
            </div>
          </div>
        </div>
      ) : null}

      {editingItem ? (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setEditingItemId(null)} />
          <div className="absolute left-1/2 top-1/2 w-full max-w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="formal-section-title text-slate-900">Edit order item</div>
                <div className="formal-section-copy text-slate-500">Update garment or modifiers</div>
              </div>
              <ActionButton tone="secondary" onClick={() => setEditingItemId(null)} className="px-3 py-2 text-xs">
                Close
              </ActionButton>
            </div>

            <div className="mb-4">
              <div className="mb-2 text-sm font-semibold text-slate-900">Garment</div>
              <div className="grid gap-2 md:grid-cols-4">
                {garmentOptions.map((garment) => (
                  <button
                    key={garment}
                    onClick={() => updateAlterationItem(editingItem.id, { garment, modifiers: [] })}
                    className={`flex min-h-11 items-center rounded-2xl border px-3 py-2.5 text-left text-sm leading-none ${editingItem.garment === garment ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:bg-slate-50"}`}
                  >
                    <span>{garment}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold text-slate-900">Modifiers</div>
              <div className="grid max-h-[240px] gap-2 overflow-auto pr-1 md:grid-cols-2">
                {editingServices.map((service) => {
                  const isSelected = editingItem.modifiers.some((modifier) => modifier.name === service.name);
                  return (
                    <button
                      key={`${editingItem.garment}-${service.name}`}
                      onClick={() =>
                        updateAlterationItem(editingItem.id, {
                          modifiers: isSelected
                            ? editingItem.modifiers.filter((modifier) => modifier.name !== service.name)
                            : [...editingItem.modifiers, service],
                        })
                      }
                      className={`rounded-2xl border p-3 text-left text-sm ${isSelected ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:bg-slate-50"}`}
                    >
                      <div className="font-medium text-slate-900">{service.name}</div>
                      <div className="mt-1 text-xs text-slate-500">${service.price.toFixed(2)}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
              <div className="text-sm text-slate-600">
                Item subtotal: <span className="font-semibold text-slate-900">${editingItem.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <ActionButton tone="secondary" onClick={() => requestDeleteItem(editingItem.id)}>
                  Remove item
                </ActionButton>
                <ActionButton tone="primary" onClick={() => setEditingItemId(null)}>
                  Done
                </ActionButton>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {pendingDeleteItemId !== null ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setPendingDeleteItemId(null)} />
          <div className="absolute left-1/2 top-1/2 w-full max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-2 formal-section-title text-slate-900">Remove item</div>
            <div className="text-sm text-slate-600">Remove this line item from the order?</div>

            <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
              <ActionButton tone="secondary" onClick={() => setPendingDeleteItemId(null)}>
                Cancel
              </ActionButton>
              <ActionButton tone="primary" onClick={() => removeAlterationItem(pendingDeleteItemId)}>
                Remove
              </ActionButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
