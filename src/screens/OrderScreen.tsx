import { useMemo, useState } from "react";
import {
  alterationCatalog,
  canvasOptions,
  customGarmentOptionsByGender,
  lapelOptions,
  pocketTypeOptions,
} from "../data";
import type { Customer, MeasurementSet, Screen } from "../types";
import type { Dispatch } from "react";
import type { AppAction } from "../state/appState";
import {
  filterCustomers,
} from "../features/customer/selectors";
import {
  getCanAddCustomDraftToOrder,
  getHasAlterationContent,
  getHasCustomContent,
  getOrderBagLineItems,
  getOrderType,
  getPickupRequired,
  getPricingSummary,
  getSummaryGuardrail,
} from "../features/order/selectors";
import { getCustomMeasurementsCardModel, getMeasurementOptions } from "../features/measurements/selectors";
import { WorkflowSelector } from "../features/order/components/WorkflowSelector";
import { AlterationBuilder } from "../features/order/components/AlterationBuilder";
import { MeasurementsCard } from "../features/order/components/MeasurementsCard";
import { CustomGarmentBuilder } from "../features/order/components/CustomGarmentBuilder";
import { OrderBag } from "../features/order/components/OrderBag";
import { ActionButton, cx } from "../components/ui/primitives";
import { CustomerPickerModal } from "../features/order/modals/CustomerPickerModal";
import { PickupScheduleModal } from "../features/order/modals/PickupScheduleModal";
import { MeasurementSetModal } from "../features/order/modals/MeasurementSetModal";
import { EditAlterationItemModal } from "../features/order/modals/EditAlterationItemModal";
import { ConfirmRemoveItemModal } from "../features/order/modals/ConfirmRemoveItemModal";
import { ConfirmClearBagModal } from "../features/order/modals/ConfirmClearBagModal";
import type { AppState } from "../state/appState";
import { useCustomMeasurementDefaults } from "../features/measurements/hooks/useCustomMeasurementDefaults";

type OrderScreenProps = {
  customers: Customer[];
  measurementSets: MeasurementSet[];
  payerCustomer: Customer | null;
  order: AppState["order"];
  dispatch: Dispatch<AppAction>;
  onScreenChange: (screen: Screen) => void;
};

export function OrderScreen({
  customers,
  measurementSets,
  payerCustomer,
  order,
  dispatch,
  onScreenChange,
}: OrderScreenProps) {
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [wearerModalOpen, setWearerModalOpen] = useState(false);
  const [customerQuery, setCustomerQuery] = useState("");
  const [pickupModalOpen, setPickupModalOpen] = useState(false);
  const [measurementPickerOpen, setMeasurementPickerOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingCustomItemId, setEditingCustomItemId] = useState<number | null>(null);
  const [pendingDeleteItemId, setPendingDeleteItemId] = useState<number | null>(null);
  const [clearBagConfirmOpen, setClearBagConfirmOpen] = useState(false);

  const hasAlterationContent = getHasAlterationContent(order);
  const hasCustomContent = getHasCustomContent(order);
  const orderType = getOrderType(order);
  const pickupRequired = getPickupRequired(order);
  const pricing = getPricingSummary(order);
  const lineItems = getOrderBagLineItems(order, customers);
  const canAddCustomDraftToOrder = getCanAddCustomDraftToOrder(order);
  const summaryGuardrail = getSummaryGuardrail(order, payerCustomer);
  const wearerCustomer = useMemo(
    () => customers.find((customer) => customer.id === order.custom.draft.wearerCustomerId) ?? null,
    [customers, order.custom.draft.wearerCustomerId],
  );
  const continueLabel =
    order.activeWorkflow === "custom" && order.custom.draft.selectedGarment && !order.custom.draft.linkedMeasurementSetId
      ? "Go to measurements"
      : "Continue to checkout";

  const garmentOptions = alterationCatalog.map((garment) => garment.category);
  const currentServices = alterationCatalog.find((garment) => garment.category === order.alteration.selectedGarment)?.services ?? [];
  const currentAlterationSubtotal = order.alteration.selectedModifiers.reduce((sum, modifier) => sum + modifier.price, 0);
  const filteredCustomers = useMemo(() => filterCustomers(customers, customerQuery), [customers, customerQuery]);
  const measurementsCardModel = getCustomMeasurementsCardModel(
    wearerCustomer,
    order.custom.draft.linkedMeasurementSetId ? measurementSets.find((set) => set.id === order.custom.draft.linkedMeasurementSetId) ?? null : null,
    measurementSets,
  );
  const measurementOptions = getMeasurementOptions(measurementSets, wearerCustomer);
  const editingItem = order.alteration.items.find((item) => item.id === editingItemId) ?? null;
  const editingCustomItem = editingCustomItemId !== null
    ? order.custom.items.find((item) => item.id === editingCustomItemId) ?? null
    : null;
  const editingServices = alterationCatalog.find((garment) => garment.category === editingItem?.garment)?.services ?? [];

  useCustomMeasurementDefaults({
    measurementSets,
    wearerCustomerId: wearerCustomer?.id ?? null,
    order,
    dispatch,
  });

  return (
    <div
      className={cx(
        "grid gap-3.5 xl:grid-cols-[1.25fr_0.75fr]",
        order.activeWorkflow === "alteration" && "xl:h-[calc(100vh-2.5rem)] xl:min-h-0",
      )}
    >
      <div
        className={cx(
          "space-y-3.5",
          order.activeWorkflow === "alteration" && "xl:flex xl:min-h-0 xl:flex-col",
        )}
      >
        <WorkflowSelector
          activeWorkflow={order.activeWorkflow}
          hasAlterationContent={hasAlterationContent}
          hasCustomContent={hasCustomContent}
          onActivate={(workflow) => dispatch({ type: "activateWorkflow", workflow })}
        />

        {order.activeWorkflow === "alteration" ? (
          <div className="xl:min-h-0 xl:flex-1">
            <AlterationBuilder
              garmentOptions={garmentOptions}
              selectedGarment={order.alteration.selectedGarment}
              currentServices={currentServices}
              selectedModifiers={order.alteration.selectedModifiers}
              currentSubtotal={currentAlterationSubtotal}
              onSelectGarment={(garment) => dispatch({ type: "selectAlterationGarment", garment })}
              onToggleModifier={(modifier) => dispatch({ type: "toggleAlterationModifier", modifier })}
              onAddItem={() => dispatch({ type: "addAlterationItem" })}
            />
          </div>
        ) : null}

        {order.activeWorkflow === "custom" ? (
          <div className="space-y-3.5">
            {editingCustomItem ? (
              <div className="rounded-[var(--app-radius-md)] border border-[var(--app-warn-border)] bg-[var(--app-warn-bg)] px-4 py-3 shadow-[var(--app-shadow-sm)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--app-warn-text)]">Editing existing line item</div>
                    <div className="mt-1 truncate text-[1rem] font-semibold leading-tight text-[var(--app-text)]">
                      {editingCustomItem.selectedGarment ?? "Custom garment"}
                    </div>
                    <div className="mt-1 text-[0.8125rem] leading-relaxed text-[var(--app-text-muted)]">
                      {editingCustomItem.wearerName ?? "Wearer required"}
                      {editingCustomItem.linkedMeasurementLabel ? ` • ${editingCustomItem.linkedMeasurementLabel}` : ""}
                    </div>
                    <div className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--app-warn-text)]">
                      Saving will overwrite this cart item instead of creating a new one.
                    </div>
                  </div>
                  <ActionButton
                    tone="secondary"
                    className="shrink-0 border-[var(--app-warn-border)] bg-[var(--app-surface)]"
                    onClick={() => {
                      setEditingCustomItemId(null);
                      dispatch({ type: "resetCustomDraft" });
                    }}
                  >
                    Cancel edit
                  </ActionButton>
                </div>
              </div>
            ) : null}

            <MeasurementsCard
              model={measurementsCardModel}
              onChooseWearer={() => setWearerModalOpen(true)}
              onChooseAnother={() => setMeasurementPickerOpen(true)}
              onCreateNew={() => {
                if (wearerCustomer) {
                  dispatch({ type: "setCustomer", customerId: wearerCustomer.id });
                }
                onScreenChange("measurements");
              }}
            />
            <CustomGarmentBuilder
              garmentOptionsByGender={customGarmentOptionsByGender}
              pocketTypeOptions={pocketTypeOptions}
              lapelOptions={lapelOptions}
              canvasOptions={canvasOptions}
              selectedGender={order.custom.draft.gender}
              selectedGarment={order.custom.draft.selectedGarment}
              fabric={order.custom.draft.fabric}
              buttons={order.custom.draft.buttons}
              lining={order.custom.draft.lining}
              threads={order.custom.draft.threads}
              monogramLeft={order.custom.draft.monogramLeft}
              monogramCenter={order.custom.draft.monogramCenter}
              monogramRight={order.custom.draft.monogramRight}
              pocketType={order.custom.draft.pocketType}
              lapel={order.custom.draft.lapel}
              canvas={order.custom.draft.canvas}
              canAddToOrder={canAddCustomDraftToOrder}
              isEditing={editingCustomItemId !== null}
              editingLabel={editingCustomItem?.selectedGarment ?? null}
              onSelectGender={(gender) => dispatch({ type: "selectCustomGender", gender })}
              onSelectGarment={(garment) => dispatch({ type: "selectCustomGarment", garment })}
              onAddToOrder={() => {
                if (editingCustomItemId !== null) {
                  dispatch({
                    type: "saveCustomItem",
                    payload: {
                      itemId: editingCustomItemId,
                      wearerName: wearerCustomer?.name ?? null,
                      linkedMeasurementLabel:
                        measurementsCardModel.kind === "linked" ? measurementsCardModel.set.version : wearerCustomer ? "Draft" : null,
                    },
                  });
                  setEditingCustomItemId(null);
                  return;
                }

                dispatch({
                  type: "addCustomItem",
                  payload: {
                    wearerName: wearerCustomer?.name ?? null,
                    linkedMeasurementLabel:
                      measurementsCardModel.kind === "linked" ? measurementsCardModel.set.version : wearerCustomer ? "Draft" : null,
                  },
                });
              }}
              onCancelEdit={() => {
                setEditingCustomItemId(null);
                dispatch({ type: "resetCustomDraft" });
              }}
              onSetConfiguration={(patch) => dispatch({ type: "setCustomConfiguration", patch })}
            />
          </div>
        ) : null}
      </div>

      <div className={cx(order.activeWorkflow === "alteration" && "xl:min-h-0", "space-y-3.5")}>
        <OrderBag
          customer={payerCustomer}
          lineItems={lineItems}
          pricing={pricing}
          activeWorkflow={order.activeWorkflow}
          continueLabel={continueLabel}
          pickupRequired={pickupRequired}
          pickupDate={order.fulfillment.pickupDate}
          pickupTime={order.fulfillment.pickupTime}
          pickupLocation={order.fulfillment.pickupLocation}
          onOpenCustomerModal={() => setCustomerModalOpen(true)}
          onOpenPickupModal={() => setPickupModalOpen(true)}
          onEditAlterationItem={(itemId) => setEditingItemId(itemId)}
          onEditCustomItem={(itemId) => {
            setEditingItemId(null);
            setEditingCustomItemId(itemId);
            dispatch({ type: "loadCustomItemForEdit", itemId });
          }}
          onRequestRemoveItem={(kind, itemId) => {
            if (kind === "alteration") {
              setPendingDeleteItemId(itemId);
              return;
            }

            if (editingCustomItemId === itemId) {
              setEditingCustomItemId(null);
              dispatch({ type: "resetCustomDraft" });
            }
            dispatch({ type: "removeCustomItem", itemId });
          }}
          onClearCart={() => setClearBagConfirmOpen(true)}
          onContinue={() => {
            if (order.activeWorkflow === "custom" && order.custom.draft.selectedGarment && !order.custom.draft.linkedMeasurementSetId) {
              if (wearerCustomer) {
                dispatch({ type: "setCustomer", customerId: wearerCustomer.id });
              }
              onScreenChange("measurements");
              return;
            }

            onScreenChange("checkout");
          }}
          continueDisabled={
            orderType === null ||
            summaryGuardrail.missingCustomer ||
            summaryGuardrail.missingPickup ||
            summaryGuardrail.customIncomplete
          }
        />
      </div>

      {customerModalOpen ? (
        <CustomerPickerModal
          customers={filteredCustomers}
          query={customerQuery}
          onQueryChange={setCustomerQuery}
          onSelectCustomer={(customerId) => {
            dispatch({ type: "setOrderPayer", customerId });
            dispatch({ type: "setCustomer", customerId });
            setCustomerModalOpen(false);
            setCustomerQuery("");
          }}
          onClose={() => {
            setCustomerModalOpen(false);
            setCustomerQuery("");
          }}
        />
      ) : null}

      {pickupModalOpen ? (
        <PickupScheduleModal
          pickupDate={order.fulfillment.pickupDate}
          pickupTime={order.fulfillment.pickupTime}
          pickupLocation={order.fulfillment.pickupLocation}
          onChange={(patch) => dispatch({ type: "setPickupSchedule", payload: patch })}
          onClose={() => setPickupModalOpen(false)}
        />
      ) : null}

      {wearerModalOpen ? (
        <CustomerPickerModal
          customers={filteredCustomers}
          query={customerQuery}
          onQueryChange={setCustomerQuery}
          onSelectCustomer={(customerId) => {
            dispatch({ type: "selectCustomWearer", customerId });
            dispatch({ type: "setCustomer", customerId });
            setWearerModalOpen(false);
            setCustomerQuery("");
          }}
          onClose={() => {
            setWearerModalOpen(false);
            setCustomerQuery("");
          }}
        />
      ) : null}

      {measurementPickerOpen && wearerCustomer ? (
        <MeasurementSetModal
          customerName={wearerCustomer.name}
          currentMeasurementSetId={order.custom.draft.linkedMeasurementSetId}
          options={measurementOptions}
          onSelect={(measurementSetId) => {
            const selectedSet = measurementOptions.find((option) => option.id === measurementSetId);
            dispatch({
              type: "replaceMeasurements",
              values: selectedSet?.values ?? {},
              measurementSetId,
            });
            setMeasurementPickerOpen(false);
          }}
          onCreateNew={() => {
            setMeasurementPickerOpen(false);
            dispatch({ type: "setCustomer", customerId: wearerCustomer.id });
            onScreenChange("measurements");
          }}
          onClose={() => setMeasurementPickerOpen(false)}
        />
      ) : null}

      {editingItem ? (
        <EditAlterationItemModal
          garment={editingItem.garment}
          garmentOptions={garmentOptions}
          services={editingServices}
          selectedModifiers={editingItem.modifiers}
          subtotal={editingItem.subtotal}
          onSetGarment={(garment) => dispatch({ type: "setAlterationItem", payload: { itemId: editingItem.id, garment, modifiers: [] } })}
          onToggleModifier={(modifier) => {
            const isSelected = editingItem.modifiers.some((selectedModifier) => selectedModifier.name === modifier.name);
            dispatch({
              type: "setAlterationItem",
              payload: {
                itemId: editingItem.id,
                modifiers: isSelected
                  ? editingItem.modifiers.filter((selectedModifier) => selectedModifier.name !== modifier.name)
                  : [...editingItem.modifiers, modifier],
              },
            });
          }}
          onRequestRemove={() => setPendingDeleteItemId(editingItem.id)}
          onClose={() => setEditingItemId(null)}
        />
      ) : null}

      {pendingDeleteItemId !== null ? (
        <ConfirmRemoveItemModal
          onConfirm={() => {
            dispatch({ type: "removeAlterationItem", itemId: pendingDeleteItemId });
            setEditingItemId(null);
            setPendingDeleteItemId(null);
          }}
          onClose={() => setPendingDeleteItemId(null)}
        />
      ) : null}

      {clearBagConfirmOpen ? (
        <ConfirmClearBagModal
          onConfirm={() => {
            dispatch({ type: "clearOrder" });
            setEditingItemId(null);
            setEditingCustomItemId(null);
            setPendingDeleteItemId(null);
            setClearBagConfirmOpen(false);
          }}
          onClose={() => setClearBagConfirmOpen(false)}
        />
      ) : null}
    </div>
  );
}
