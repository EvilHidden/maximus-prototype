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
  selectedCustomer: Customer | null;
  order: AppState["order"];
  dispatch: Dispatch<AppAction>;
  onScreenChange: (screen: Screen) => void;
};

export function OrderScreen({
  customers,
  measurementSets,
  selectedCustomer,
  order,
  dispatch,
  onScreenChange,
}: OrderScreenProps) {
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerQuery, setCustomerQuery] = useState("");
  const [pickupModalOpen, setPickupModalOpen] = useState(false);
  const [measurementPickerOpen, setMeasurementPickerOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [pendingDeleteItemId, setPendingDeleteItemId] = useState<number | null>(null);
  const [clearBagConfirmOpen, setClearBagConfirmOpen] = useState(false);

  const hasAlterationContent = getHasAlterationContent(order);
  const hasCustomContent = getHasCustomContent(order);
  const orderType = getOrderType(order);
  const pickupRequired = getPickupRequired(order);
  const pricing = getPricingSummary(order);
  const lineItems = getOrderBagLineItems(order);
  const summaryGuardrail = getSummaryGuardrail(order, selectedCustomer);
  const continueLabel =
    order.activeWorkflow === "custom" && !order.custom.linkedMeasurementSetId
      ? "Go to measurements"
      : "Continue to checkout";

  const garmentOptions = alterationCatalog.map((garment) => garment.category);
  const currentServices = alterationCatalog.find((garment) => garment.category === order.alteration.selectedGarment)?.services ?? [];
  const currentAlterationSubtotal = order.alteration.selectedModifiers.reduce((sum, modifier) => sum + modifier.price, 0);
  const filteredCustomers = useMemo(() => filterCustomers(customers, customerQuery), [customers, customerQuery]);
  const measurementsCardModel = getCustomMeasurementsCardModel(
    selectedCustomer,
    order.custom.linkedMeasurementSetId ? measurementSets.find((set) => set.id === order.custom.linkedMeasurementSetId) ?? null : null,
    measurementSets,
  );
  const measurementOptions = getMeasurementOptions(measurementSets, selectedCustomer);
  const editingItem = order.alteration.items.find((item) => item.id === editingItemId) ?? null;
  const editingServices = alterationCatalog.find((garment) => garment.category === editingItem?.garment)?.services ?? [];

  useCustomMeasurementDefaults({
    measurementSets,
    selectedCustomerId: selectedCustomer?.id ?? null,
    order,
    dispatch,
  });

  return (
    <div className="grid gap-3.5 xl:grid-cols-[1.25fr_0.75fr]">
      <div className="space-y-3.5">
        <WorkflowSelector
          activeWorkflow={order.activeWorkflow}
          hasAlterationContent={hasAlterationContent}
          hasCustomContent={hasCustomContent}
          onActivate={(workflow) => dispatch({ type: "activateWorkflow", workflow })}
        />

        {order.activeWorkflow === "alteration" ? (
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
        ) : null}

        {order.activeWorkflow === "custom" ? (
          <div className="space-y-3.5">
            <MeasurementsCard
              model={measurementsCardModel}
              onChooseAnother={() => setMeasurementPickerOpen(true)}
              onCreateNew={() => onScreenChange("measurements")}
            />
            <CustomGarmentBuilder
              garmentOptionsByGender={customGarmentOptionsByGender}
              pocketTypeOptions={pocketTypeOptions}
              lapelOptions={lapelOptions}
              canvasOptions={canvasOptions}
              selectedGender={order.custom.gender}
              selectedGarment={order.custom.selectedGarment}
              fabric={order.custom.fabric}
              buttons={order.custom.buttons}
              lining={order.custom.lining}
              threads={order.custom.threads}
              monogramLeft={order.custom.monogramLeft}
              monogramCenter={order.custom.monogramCenter}
              monogramRight={order.custom.monogramRight}
              pocketType={order.custom.pocketType}
              lapel={order.custom.lapel}
              canvas={order.custom.canvas}
              onSelectGender={(gender) => dispatch({ type: "selectCustomGender", gender })}
              onSelectGarment={(garment) => dispatch({ type: "selectCustomGarment", garment })}
              onSetConfiguration={(patch) => dispatch({ type: "setCustomConfiguration", patch })}
            />
          </div>
        ) : null}
      </div>

      <div className="space-y-3.5">
        <OrderBag
          customer={selectedCustomer}
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
          onRequestRemoveItem={(itemId) => setPendingDeleteItemId(itemId)}
          onClearCart={() => setClearBagConfirmOpen(true)}
          onContinue={() => onScreenChange(order.activeWorkflow === "custom" && !order.custom.linkedMeasurementSetId ? "measurements" : "checkout")}
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
            dispatch({ type: "setCustomer", customerId });
            setCustomerModalOpen(false);
            setCustomerQuery("");
          }}
          onClose={() => setCustomerModalOpen(false)}
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

      {measurementPickerOpen && selectedCustomer ? (
        <MeasurementSetModal
          customerName={selectedCustomer.name}
          currentMeasurementSetId={order.custom.linkedMeasurementSetId}
          options={measurementOptions}
          onSelect={(measurementSetId) => {
            dispatch({ type: "linkMeasurementSet", measurementSetId });
            setMeasurementPickerOpen(false);
          }}
          onCreateNew={() => {
            setMeasurementPickerOpen(false);
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
            setPendingDeleteItemId(null);
            setClearBagConfirmOpen(false);
          }}
          onClose={() => setClearBagConfirmOpen(false)}
        />
      ) : null}
    </div>
  );
}
