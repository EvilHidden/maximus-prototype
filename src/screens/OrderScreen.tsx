import { useMemo, useState } from "react";
import { ArrowLeft, FilePenLine, Receipt } from "lucide-react";
import type { Customer, MeasurementSet, Screen } from "../types";
import type { Dispatch } from "react";
import type { AppAction } from "../state/appState";
import type { AppReferenceData } from "../db";
import { WorkflowSelector } from "../features/order/components/WorkflowSelector";
import { AlterationBuilder } from "../features/order/components/AlterationBuilder";
import { MeasurementsCard } from "../features/order/components/MeasurementsCard";
import { CustomGarmentBuilder } from "../features/order/components/CustomGarmentBuilder";
import { ItemEditBanner } from "../features/order/components/ItemEditBanner";
import { OrderBag } from "../features/order/components/OrderBag";
import { ActionButton, SectionHeader, StatusPill, Surface, cx } from "../components/ui/primitives";
import { CustomerPickerModal } from "../features/order/modals/CustomerPickerModal";
import { PickupScheduleModal } from "../features/order/modals/PickupScheduleModal";
import { MeasurementSetModal } from "../features/order/modals/MeasurementSetModal";
import { ConfirmRemoveItemModal } from "../features/order/modals/ConfirmRemoveItemModal";
import { ConfirmClearBagModal } from "../features/order/modals/ConfirmClearBagModal";
import { CustomerEditorModal } from "../components/customer/CustomerEditorModal";
import type { AppState } from "../state/appState";
import { useToast } from "../components/ui/toast";
import { useOrderBuilderController } from "../features/order/hooks/useOrderBuilderController";
import { createNextCustomerId } from "../features/customer/selectors";

type OrderScreenProps = {
  customers: Customer[];
  measurementSets: MeasurementSet[];
  referenceData: AppReferenceData;
  payerCustomer: Customer | null;
  order: AppState["order"];
  editingOpenOrderId: number | null;
  dispatch: Dispatch<AppAction>;
  onScreenChange: (screen: Screen) => void;
  onBackToOrderDetails?: () => void;
  onOpenDraftCheckout: () => void;
  onSaveDraftOrder: (paymentStatus: "due_later" | "ready_to_collect", openCheckout?: boolean) => void;
  onSaveEditedOrder: () => void;
};

export function OrderScreen({
  customers,
  measurementSets,
  referenceData,
  payerCustomer,
  order,
  editingOpenOrderId,
  dispatch,
  onScreenChange,
  onBackToOrderDetails,
  onOpenDraftCheckout,
  onSaveDraftOrder,
  onSaveEditedOrder,
}: OrderScreenProps) {
  const { showToast } = useToast();
  const [customerCreateTarget, setCustomerCreateTarget] = useState<"payer" | "wearer" | null>(null);
  const controller = useOrderBuilderController({
    customers,
    measurementSets,
    referenceData,
    payerCustomer,
    order,
    dispatch,
    onScreenChange,
    onOpenDraftCheckout,
    onSaveDraftOrder,
    showToast,
  });
  const customerDateFormatter = useMemo(
    () => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }),
    [],
  );
  const isEditingExistingOrder = editingOpenOrderId !== null;
  const hasActiveItemEdit = controller.editingCustomItem !== null || controller.isEditingAlterationItem;
  const continueLabel =
    order.activeWorkflow === "custom" && order.custom.draft.selectedGarment && !order.custom.draft.linkedMeasurementSetId
      ? "Go to measurements"
      : isEditingExistingOrder
        ? "Save order changes"
        : controller.continueLabel;
  const continueDisabled = (
    controller.orderType === null ||
    controller.summaryGuardrail.missingCustomer ||
    controller.summaryGuardrail.missingPickup ||
    controller.summaryGuardrail.customIncomplete ||
    hasActiveItemEdit
  );
  const continueDisabledReason = hasActiveItemEdit
    ? "Finish editing this item before saving the order."
    : controller.continueDisabledReason;

  const handleCreateCustomer = (target: "payer" | "wearer") => {
    if (target === "payer") {
      controller.setCustomerModalOpen(false);
    } else {
      controller.setWearerModalOpen(false);
    }
    controller.setCustomerQuery("");
    setCustomerCreateTarget(target);
  };

  const handleSaveNewCustomer = (draft: Customer) => {
    const nextCustomer: Customer = {
      ...draft,
      id: createNextCustomerId(customers),
      lastVisit: customerDateFormatter.format(new Date()),
      measurementsStatus: "missing",
    };

    dispatch({ type: "addCustomer", customer: nextCustomer });

    if (customerCreateTarget === "wearer") {
      dispatch({ type: "selectCustomWearer", customerId: nextCustomer.id });
      dispatch({ type: "setCustomer", customerId: nextCustomer.id });
    } else {
      dispatch({ type: "setOrderPayer", customerId: nextCustomer.id });
      dispatch({ type: "setCustomer", customerId: nextCustomer.id });
    }

    showToast(`${nextCustomer.name} added.`);
    setCustomerCreateTarget(null);
  };

  return (
    <div className="space-y-4">
      {isEditingExistingOrder ? (
        <Surface
          tone="control"
          className="border-[var(--app-border-strong)] bg-[var(--app-surface)]"
        >
          <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="rounded-[var(--app-radius-sm)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-2 text-[var(--app-text-muted)]">
                <FilePenLine className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <StatusPill tone="warn">Editing order</StatusPill>
                </div>
                <div className="app-text-strong">Order #{editingOpenOrderId}</div>
                <div className="app-text-caption mt-1">Save changes to update this order.</div>
              </div>
            </div>

            {onBackToOrderDetails ? (
              <ActionButton
                tone="secondary"
                className="px-3 py-2 text-xs"
                onClick={onBackToOrderDetails}
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to order details</span>
              </ActionButton>
            ) : null}
          </div>
        </Surface>
      ) : (
        <SectionHeader
          icon={Receipt}
          title="New order"
          subtitle="Build the order and finish the order details."
        />
      )}

      <div className="grid items-start gap-3.5 xl:grid-cols-[minmax(0,1fr)_minmax(19rem,21rem)]">
        <div className="space-y-3.5">
          <WorkflowSelector
            activeWorkflow={order.activeWorkflow}
            hasAlterationContent={controller.hasAlterationContent}
            hasCustomContent={controller.hasCustomContent}
            onActivate={(workflow) => dispatch({ type: "activateWorkflow", workflow })}
          />

          {order.activeWorkflow === "alteration" ? (
            <div>
              {controller.isEditingAlterationItem ? (
                <ItemEditBanner
                  label={controller.editingItem?.garment ?? "Alteration item"}
                  detail={order.alteration.selectedModifiers.map((modifier) => modifier.name).join(" • ") || null}
                />
              ) : null}

              <AlterationBuilder
                garmentOptions={controller.garmentOptions}
                selectedGarment={order.alteration.selectedGarment}
                currentServices={controller.currentServices}
                selectedModifiers={order.alteration.selectedModifiers}
                selectedRush={order.alteration.selectedRush}
                currentSubtotal={controller.currentAlterationSubtotal}
                isEditing={controller.isEditingAlterationItem}
                editingLabel={controller.editingItem?.garment ?? null}
                addDisabledReason={controller.addToCartDisabledReason}
                onShowDisabledReason={controller.handleShowAlterationDisabledReason}
                showValidation={controller.alterationValidationVisible}
                missingGarment={controller.missingAlterationGarment}
                missingServices={controller.missingAlterationServices}
                onSelectGarment={(garment) => dispatch({ type: "selectAlterationGarment", garment })}
                onToggleModifier={(modifier) => dispatch({ type: "toggleAlterationModifier", modifier })}
                onToggleRush={() => dispatch({ type: "toggleAlterationRush" })}
                onAddItem={controller.handleAddOrSaveAlterationItem}
                onCancelEdit={controller.handleCancelAlterationEdit}
              />
            </div>
          ) : null}

          {order.activeWorkflow === "custom" ? (
            <div className="space-y-3.5">
              {controller.editingCustomItem ? (
                <ItemEditBanner
                  label={controller.editingCustomItem.selectedGarment ?? "Custom garment"}
                  detail={[
                    controller.editingCustomItem.wearerName ?? null,
                    controller.editingCustomItem.linkedMeasurementLabel ?? null,
                  ]
                    .filter(Boolean)
                    .join(" • ")}
                />
              ) : null}

              <Surface tone="work" className="p-4">
                <div className="space-y-6">
                  <MeasurementsCard
                    model={controller.measurementsCardModel}
                    showValidation={controller.customValidationVisible}
                    missingWearer={controller.missingCustomWearer}
                    missingMeasurementSet={controller.missingCustomMeasurements}
                    onChooseWearer={() => controller.setWearerModalOpen(true)}
                    onChooseAnother={() => controller.setMeasurementPickerOpen(true)}
                    onCreateNew={() => {
                      if (controller.wearerCustomer) {
                        dispatch({ type: "setCustomer", customerId: controller.wearerCustomer.id });
                      }
                      onScreenChange("measurements");
                    }}
                  />
                  <div className="border-t border-[var(--app-border)]/70 pt-6">
                    <CustomGarmentBuilder
                      garmentOptionsByGender={referenceData.customGarmentOptionsByGender}
                      jacketBasedCustomGarments={referenceData.jacketBasedCustomGarments}
                      pocketTypeOptions={referenceData.pocketTypeOptions}
                      lapelOptions={referenceData.lapelOptions}
                      canvasOptions={referenceData.canvasOptions}
                      selectedGender={order.custom.draft.gender}
                      selectedGarment={order.custom.draft.selectedGarment}
                      isRush={order.custom.draft.isRush}
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
                      canAddToOrder={controller.canAddCustomDraftToOrder}
                      addDisabledReason={controller.customAddDisabledReason}
                      onShowDisabledReason={controller.handleShowCustomDisabledReason}
                      showValidation={controller.customValidationVisible}
                      missingGender={controller.missingCustomGender}
                      missingGarment={controller.missingCustomGarment}
                      missingWearer={controller.missingCustomWearer}
                      missingMeasurements={controller.missingCustomMeasurements}
                      missingBuildDetails={controller.missingCustomBuildDetails}
                      missingStyleDetails={controller.missingCustomStyleDetails}
                      isEditing={controller.editingCustomItemId !== null}
                      wearerName={controller.wearerCustomer?.name ?? null}
                      measurementVersionLabel={
                        controller.measurementsCardModel.kind === "linked"
                          ? controller.measurementsCardModel.set.version
                          : controller.wearerCustomer
                            ? "Draft"
                            : null
                      }
                      onSelectGender={(gender) => dispatch({ type: "selectCustomGender", gender })}
                      onSelectGarment={(garment) => dispatch({ type: "selectCustomGarment", garment })}
                      onAddToOrder={controller.handleAddOrSaveCustomItem}
                      onCancelEdit={controller.handleCancelCustomEdit}
                      onSetConfiguration={(patch) => dispatch({ type: "setCustomConfiguration", patch })}
                    />
                  </div>
                </div>
              </Surface>
            </div>
          ) : null}
        </div>

        <div className={cx("space-y-3.5 xl:min-w-[19rem] xl:flex xl:flex-col", order.activeWorkflow === "alteration" && "xl:min-h-0")}>
          <OrderBag
            customer={payerCustomer}
            lineItems={controller.lineItems}
            pricing={controller.pricing}
            orderType={controller.orderType}
            activeWorkflow={order.activeWorkflow}
            continueLabel={continueLabel}
            pickupRequired={controller.pickupRequired}
            pickupSchedules={order.fulfillment}
            onOpenCustomerModal={() => controller.setCustomerModalOpen(true)}
            onOpenPickupModal={(scope) => controller.setPickupModalScope(scope)}
            onEditAlterationItem={controller.handleOpenEditAlterationItem}
            onEditCustomItem={controller.handleOpenEditCustomItem}
            onRequestRemoveItem={controller.handleRequestRemoveItem}
            onClearCart={() => controller.setClearBagConfirmOpen(true)}
            onShowDisabledReason={showToast}
            onContinue={isEditingExistingOrder ? onSaveEditedOrder : controller.handleContinue}
            continueDisabled={continueDisabled}
            continueDisabledReason={continueDisabledReason}
          />
        </div>
      </div>

      {controller.customerModalOpen ? (
        <CustomerPickerModal
          customers={controller.filteredCustomers}
          query={controller.customerQuery}
          onQueryChange={controller.setCustomerQuery}
          onSelectCustomer={(customerId) => {
            dispatch({ type: "setOrderPayer", customerId });
            dispatch({ type: "setCustomer", customerId });
            controller.setCustomerModalOpen(false);
            controller.setCustomerQuery("");
          }}
          onCreateCustomer={() => handleCreateCustomer("payer")}
          onClose={() => {
            controller.setCustomerModalOpen(false);
            controller.setCustomerQuery("");
          }}
        />
      ) : null}

      {controller.pickupModalScope === "alteration" ? (
        <PickupScheduleModal
          scope="alteration"
          schedule={order.fulfillment.alteration}
          pickupLocations={referenceData.pickupLocations}
          onChange={(patch) => dispatch({ type: "setAlterationPickup", payload: patch })}
          onClose={() => controller.setPickupModalScope(null)}
        />
      ) : null}

      {controller.pickupModalScope === "custom" ? (
        <PickupScheduleModal
          scope="custom"
          schedule={order.fulfillment.custom}
          pickupLocations={referenceData.pickupLocations}
          onChange={(patch) => dispatch({ type: "setCustomOccasion", payload: patch })}
          onClose={() => controller.setPickupModalScope(null)}
        />
      ) : null}

      {controller.wearerModalOpen ? (
        <CustomerPickerModal
          customers={controller.filteredCustomers}
          query={controller.customerQuery}
          onQueryChange={controller.setCustomerQuery}
          onSelectCustomer={(customerId) => {
            dispatch({ type: "selectCustomWearer", customerId });
            dispatch({ type: "setCustomer", customerId });
            controller.setWearerModalOpen(false);
            controller.setCustomerQuery("");
          }}
          onCreateCustomer={() => handleCreateCustomer("wearer")}
          onClose={() => {
            controller.setWearerModalOpen(false);
            controller.setCustomerQuery("");
          }}
        />
      ) : null}

      {customerCreateTarget ? (
        <CustomerEditorModal
          mode="add"
          onClose={() => setCustomerCreateTarget(null)}
          onSave={handleSaveNewCustomer}
        />
      ) : null}

      {controller.measurementPickerOpen && controller.wearerCustomer ? (
        <MeasurementSetModal
          customerName={controller.wearerCustomer.name}
          currentMeasurementSetId={order.custom.draft.linkedMeasurementSetId}
          options={controller.measurementOptions}
          onSelect={(measurementSetId) => {
            const selectedSet = controller.measurementOptions.find((option) => option.id === measurementSetId);
            dispatch({
              type: "replaceMeasurements",
              values: selectedSet?.values ?? {},
              measurementSetId,
            });
            controller.setMeasurementPickerOpen(false);
          }}
          onCreateNew={() => {
            controller.setMeasurementPickerOpen(false);
            dispatch({ type: "setCustomer", customerId: controller.wearerCustomer!.id });
            onScreenChange("measurements");
          }}
          onClose={() => controller.setMeasurementPickerOpen(false)}
        />
      ) : null}

      {controller.pendingDeleteItemId !== null ? (
        <ConfirmRemoveItemModal
          onConfirm={() => {
            dispatch({ type: "removeAlterationItem", itemId: controller.pendingDeleteItemId! });
            controller.setEditingItemId(null);
            controller.setPendingDeleteItemId(null);
          }}
          onClose={() => controller.setPendingDeleteItemId(null)}
        />
      ) : null}

      {controller.clearBagConfirmOpen ? (
        <ConfirmClearBagModal
          onConfirm={() => {
            dispatch({ type: "clearOrder" });
            controller.setEditingItemId(null);
            controller.setEditingCustomItemId(null);
            controller.setPendingDeleteItemId(null);
            controller.setClearBagConfirmOpen(false);
          }}
          onClose={() => controller.setClearBagConfirmOpen(false)}
        />
      ) : null}
    </div>
  );
}
