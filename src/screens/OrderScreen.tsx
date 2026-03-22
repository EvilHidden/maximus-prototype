import { useMemo, useState } from "react";
import { Receipt } from "lucide-react";
import {
  alterationCatalog,
  canvasOptions,
  customGarmentOptionsByGender,
  jacketBasedCustomGarments,
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
import { ActionButton, Callout, SectionHeader, cx } from "../components/ui/primitives";
import { CustomerPickerModal } from "../features/order/modals/CustomerPickerModal";
import { PickupScheduleModal } from "../features/order/modals/PickupScheduleModal";
import { MeasurementSetModal } from "../features/order/modals/MeasurementSetModal";
import { EditAlterationItemModal } from "../features/order/modals/EditAlterationItemModal";
import { ConfirmRemoveItemModal } from "../features/order/modals/ConfirmRemoveItemModal";
import { ConfirmClearBagModal } from "../features/order/modals/ConfirmClearBagModal";
import type { AppState } from "../state/appState";
import { useCustomMeasurementDefaults } from "../features/measurements/hooks/useCustomMeasurementDefaults";
import { useToast } from "../components/ui/toast";

type OrderScreenProps = {
  customers: Customer[];
  measurementSets: MeasurementSet[];
  payerCustomer: Customer | null;
  order: AppState["order"];
  dispatch: Dispatch<AppAction>;
  onScreenChange: (screen: Screen) => void;
  onCompleteOrder: (paymentStatus: "pay_later" | "prepaid") => void;
};

export function OrderScreen({
  customers,
  measurementSets,
  payerCustomer,
  order,
  dispatch,
  onScreenChange,
  onCompleteOrder,
}: OrderScreenProps) {
  const { showToast } = useToast();
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [wearerModalOpen, setWearerModalOpen] = useState(false);
  const [customerQuery, setCustomerQuery] = useState("");
  const [pickupModalScope, setPickupModalScope] = useState<"alteration" | "custom" | null>(null);
  const [measurementPickerOpen, setMeasurementPickerOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingCustomItemId, setEditingCustomItemId] = useState<number | null>(null);
  const [pendingDeleteItemId, setPendingDeleteItemId] = useState<number | null>(null);
  const [clearBagConfirmOpen, setClearBagConfirmOpen] = useState(false);
  const [alterationValidationVisible, setAlterationValidationVisible] = useState(false);
  const [customValidationVisible, setCustomValidationVisible] = useState(false);

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
  const addToCartDisabledReason = !order.alteration.selectedGarment
    ? "Select a garment before adding anything to the cart."
    : order.alteration.selectedModifiers.length === 0
      ? "Choose at least one alteration service before adding this item to the cart."
      : undefined;
  const missingAlterationGarment = !order.alteration.selectedGarment;
  const missingAlterationServices = Boolean(order.alteration.selectedGarment) && order.alteration.selectedModifiers.length === 0;

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
  const continueDisabledReason =
    orderType === null
      ? "Add at least one item to the cart before moving forward."
      : summaryGuardrail.missingCustomer
        ? "Link a paying customer before moving this order forward."
        : summaryGuardrail.missingPickup
          ? orderType === "mixed"
            ? "Set both the alteration pickup and custom pickup before moving this order forward."
            : "Set the pickup date, time, and location before moving this order forward."
          : summaryGuardrail.customIncomplete
            ? "Finish the custom garment configuration before continuing to checkout."
            : undefined;
  const customAddDisabledReason = !order.custom.draft.gender
    ? "Select a gender before building the custom garment."
    : !order.custom.draft.selectedGarment
      ? "Choose a garment before adding the custom item to the cart."
      : !order.custom.draft.wearerCustomerId
        ? "Assign a wearer before adding the custom garment to the cart."
        : !order.custom.draft.linkedMeasurementSetId
          ? "Choose or create a measurement set before adding the custom garment to the cart."
          : !order.custom.draft.fabric || !order.custom.draft.buttons || !order.custom.draft.lining || !order.custom.draft.threads
          ? "Complete fabric, buttons, lining, and thread details before adding this garment to the cart."
            : order.custom.draft.selectedGarment &&
                jacketBasedCustomGarments.has(order.custom.draft.selectedGarment) &&
                (!order.custom.draft.pocketType || !order.custom.draft.lapel || !order.custom.draft.canvas)
              ? "Choose the canvas, lapel, and pocket details before adding this jacket-based garment to the cart."
              : undefined;
  const missingCustomGender = !order.custom.draft.gender;
  const missingCustomGarment = Boolean(order.custom.draft.gender) && !order.custom.draft.selectedGarment;
  const missingCustomWearer = Boolean(order.custom.draft.selectedGarment) && !order.custom.draft.wearerCustomerId;
  const missingCustomMeasurements = Boolean(order.custom.draft.wearerCustomerId) && !order.custom.draft.linkedMeasurementSetId;
  const missingCustomBuildDetails =
    Boolean(order.custom.draft.linkedMeasurementSetId) &&
    (!order.custom.draft.fabric || !order.custom.draft.buttons || !order.custom.draft.lining || !order.custom.draft.threads);
  const missingCustomStyleDetails =
    Boolean(order.custom.draft.selectedGarment) &&
    jacketBasedCustomGarments.has(order.custom.draft.selectedGarment) &&
    (!order.custom.draft.pocketType || !order.custom.draft.lapel || !order.custom.draft.canvas);

  useCustomMeasurementDefaults({
    measurementSets,
    wearerCustomerId: wearerCustomer?.id ?? null,
    order,
    dispatch,
  });

  return (
    <div className="space-y-4">
      <SectionHeader icon={Receipt} title="Order Builder" subtitle="Compose tailoring work and prepare checkout." />

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
                addDisabledReason={addToCartDisabledReason}
                onShowDisabledReason={(reason) => {
                  setAlterationValidationVisible(true);
                  showToast(reason);
                }}
                showValidation={alterationValidationVisible}
                missingGarment={missingAlterationGarment}
                missingServices={missingAlterationServices}
                onSelectGarment={(garment) => dispatch({ type: "selectAlterationGarment", garment })}
                onToggleModifier={(modifier) => dispatch({ type: "toggleAlterationModifier", modifier })}
                onAddItem={() => {
                  setAlterationValidationVisible(false);
                  dispatch({ type: "addAlterationItem" });
                }}
              />
            </div>
          ) : null}

          {order.activeWorkflow === "custom" ? (
            <div className="space-y-3.5">
              {editingCustomItem ? (
                <Callout
                  tone="warn"
                  className="mb-0"
                  action={
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
                  }
                >
                  <div className="app-text-overline text-[var(--app-warn-text)]">Editing existing line item</div>
                  <div className="app-text-value mt-1 truncate text-[var(--app-text)]">
                    {editingCustomItem.selectedGarment ?? "Custom garment"}
                  </div>
                  <div className="app-text-caption mt-1 text-[var(--app-text-muted)]">
                    {editingCustomItem.wearerName ?? "Wearer required"}
                    {editingCustomItem.linkedMeasurementLabel ? ` • ${editingCustomItem.linkedMeasurementLabel}` : ""}
                  </div>
                  <div className="app-text-caption mt-2 text-[var(--app-warn-text)]">
                    Saving will overwrite this cart item instead of creating a new one.
                  </div>
                </Callout>
              ) : null}

              <MeasurementsCard
                model={measurementsCardModel}
                showValidation={customValidationVisible}
                missingWearer={missingCustomWearer}
                missingMeasurementSet={missingCustomMeasurements}
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
                addDisabledReason={customAddDisabledReason}
                onShowDisabledReason={(reason) => {
                  setCustomValidationVisible(false);
                  showToast(reason);
                }}
                showValidation={customValidationVisible}
                missingGender={missingCustomGender}
                missingGarment={missingCustomGarment}
                missingWearer={missingCustomWearer}
                missingMeasurements={missingCustomMeasurements}
                missingBuildDetails={missingCustomBuildDetails}
                missingStyleDetails={missingCustomStyleDetails}
                isEditing={editingCustomItemId !== null}
                editingLabel={editingCustomItem?.selectedGarment ?? null}
                wearerName={wearerCustomer?.name ?? null}
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
                    setCustomValidationVisible(false);
                    return;
                  }

                  setCustomValidationVisible(false);
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
                  setCustomValidationVisible(false);
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
            orderType={orderType}
            activeWorkflow={order.activeWorkflow}
            continueLabel={continueLabel}
            pickupRequired={pickupRequired}
            pickupSchedules={order.fulfillment}
            onOpenCustomerModal={() => setCustomerModalOpen(true)}
            onOpenPickupModal={(scope) => setPickupModalScope(scope)}
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
            onSchedulePayLater={() => {
              onCompleteOrder("pay_later");
            }}
            onSchedulePrepay={() => {
              dispatch({ type: "setAlterationCheckoutIntent", intent: "prepay_now" });
              onScreenChange("checkout");
            }}
            onShowDisabledReason={showToast}
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
            continueDisabledReason={continueDisabledReason}
          />
        </div>
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

      {pickupModalScope ? (
        <PickupScheduleModal
          scope={pickupModalScope}
          schedule={order.fulfillment[pickupModalScope]}
          onChange={(patch) => dispatch({ type: "setPickupSchedule", payload: { scope: pickupModalScope, ...patch } })}
          onClose={() => setPickupModalScope(null)}
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
