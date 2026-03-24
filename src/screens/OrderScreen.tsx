import { Receipt } from "lucide-react";
import type { Customer, MeasurementSet, Screen } from "../types";
import type { Dispatch } from "react";
import type { AppAction } from "../state/appState";
import type { AppReferenceData } from "../db";
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
import { useToast } from "../components/ui/toast";
import { useOrderBuilderController } from "../features/order/hooks/useOrderBuilderController";

type OrderScreenProps = {
  customers: Customer[];
  measurementSets: MeasurementSet[];
  referenceData: AppReferenceData;
  payerCustomer: Customer | null;
  order: AppState["order"];
  editingOpenOrderId: number | null;
  dispatch: Dispatch<AppAction>;
  onScreenChange: (screen: Screen) => void;
  onOpenDraftCheckout: () => void;
  onSaveDraftOrder: (paymentStatus: "due_later" | "ready_to_collect", openCheckout?: boolean) => void;
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
  onOpenDraftCheckout,
  onSaveDraftOrder,
}: OrderScreenProps) {
  const { showToast } = useToast();
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

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={Receipt}
        title={editingOpenOrderId ? `Edit Order #${editingOpenOrderId}` : "New order"}
        subtitle={editingOpenOrderId ? "Update the order and save it." : "Build the order and set the pickup details."}
      />

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
            hasAlterationContent={controller.hasAlterationContent}
            hasCustomContent={controller.hasCustomContent}
            onActivate={(workflow) => dispatch({ type: "activateWorkflow", workflow })}
          />

          {order.activeWorkflow === "alteration" ? (
            <div className="xl:min-h-0 xl:flex-1">
              <AlterationBuilder
                garmentOptions={controller.garmentOptions}
                selectedGarment={order.alteration.selectedGarment}
                currentServices={controller.currentServices}
                selectedModifiers={order.alteration.selectedModifiers}
                currentSubtotal={controller.currentAlterationSubtotal}
                addDisabledReason={controller.addToCartDisabledReason}
                onShowDisabledReason={controller.handleShowAlterationDisabledReason}
                showValidation={controller.alterationValidationVisible}
                missingGarment={controller.missingAlterationGarment}
                missingServices={controller.missingAlterationServices}
                onSelectGarment={(garment) => dispatch({ type: "selectAlterationGarment", garment })}
                onToggleModifier={(modifier) => dispatch({ type: "toggleAlterationModifier", modifier })}
                onAddItem={() => {
                  controller.setAlterationValidationVisible(false);
                  dispatch({ type: "addAlterationItem" });
                }}
              />
            </div>
          ) : null}

          {order.activeWorkflow === "custom" ? (
            <div className="space-y-3.5">
              {controller.editingCustomItem ? (
                <Callout
                  tone="warn"
                  className="mb-0"
                  action={
                    <ActionButton
                      tone="secondary"
                      className="shrink-0 border-[var(--app-warn-border)] bg-[var(--app-surface)]"
                      onClick={controller.handleCancelCustomEdit}
                    >
                      Cancel edit
                    </ActionButton>
                  }
                >
                  <div className="app-text-overline text-[var(--app-warn-text)]">Editing this item</div>
                  <div className="app-text-value mt-1 truncate text-[var(--app-text)]">
                    {controller.editingCustomItem.selectedGarment ?? "Custom garment"}
                  </div>
                  <div className="app-text-caption mt-1 text-[var(--app-text-muted)]">
                    {controller.editingCustomItem.wearerName ?? "Wearer required"}
                    {controller.editingCustomItem.linkedMeasurementLabel ? ` • ${controller.editingCustomItem.linkedMeasurementLabel}` : ""}
                  </div>
                  <div className="app-text-caption mt-2 text-[var(--app-warn-text)]">
                    Saving will update this item instead of adding a new one.
                  </div>
                </Callout>
              ) : null}

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
              <CustomGarmentBuilder
                garmentOptionsByGender={referenceData.customGarmentOptionsByGender}
                jacketBasedCustomGarments={referenceData.jacketBasedCustomGarments}
                pocketTypeOptions={referenceData.pocketTypeOptions}
                lapelOptions={referenceData.lapelOptions}
                canvasOptions={referenceData.canvasOptions}
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
                editingLabel={controller.editingCustomItem?.selectedGarment ?? null}
                wearerName={controller.wearerCustomer?.name ?? null}
                onSelectGender={(gender) => dispatch({ type: "selectCustomGender", gender })}
                onSelectGarment={(garment) => dispatch({ type: "selectCustomGarment", garment })}
                onAddToOrder={controller.handleAddOrSaveCustomItem}
                onCancelEdit={controller.handleCancelCustomEdit}
                onSetConfiguration={(patch) => dispatch({ type: "setCustomConfiguration", patch })}
              />
            </div>
          ) : null}
        </div>

        <div className={cx(order.activeWorkflow === "alteration" && "xl:min-h-0", "space-y-3.5")}>
          <OrderBag
            customer={payerCustomer}
            lineItems={controller.lineItems}
            pricing={controller.pricing}
            orderType={controller.orderType}
            activeWorkflow={order.activeWorkflow}
            continueLabel={controller.continueLabel}
            pickupRequired={controller.pickupRequired}
            pickupSchedules={order.fulfillment}
            onOpenCustomerModal={() => controller.setCustomerModalOpen(true)}
            onOpenPickupModal={(scope) => controller.setPickupModalScope(scope)}
            onEditAlterationItem={(itemId) => controller.setEditingItemId(itemId)}
            onEditCustomItem={controller.handleOpenEditCustomItem}
            onRequestRemoveItem={controller.handleRequestRemoveItem}
            onClearCart={() => controller.setClearBagConfirmOpen(true)}
            onShowDisabledReason={showToast}
            onContinue={controller.handleContinue}
            continueDisabled={
              controller.orderType === null ||
              controller.summaryGuardrail.missingCustomer ||
              controller.summaryGuardrail.missingPickup ||
              controller.summaryGuardrail.customIncomplete
            }
            continueDisabledReason={controller.continueDisabledReason}
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
          onClose={() => {
            controller.setCustomerModalOpen(false);
            controller.setCustomerQuery("");
          }}
        />
      ) : null}

      {controller.pickupModalScope ? (
        <PickupScheduleModal
          scope={controller.pickupModalScope}
          schedule={order.fulfillment[controller.pickupModalScope]}
          pickupLocations={referenceData.pickupLocations}
          onChange={(patch) => dispatch({ type: "setPickupSchedule", payload: { scope: controller.pickupModalScope!, ...patch } })}
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
          onClose={() => {
            controller.setWearerModalOpen(false);
            controller.setCustomerQuery("");
          }}
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

      {controller.editingItem ? (
        <EditAlterationItemModal
          garment={controller.editingItem.garment}
          garmentOptions={controller.garmentOptions}
          services={controller.editingServices}
          selectedModifiers={controller.editingItem.modifiers}
          subtotal={controller.editingItem.subtotal}
          onSetGarment={(garment) => dispatch({ type: "setAlterationItem", payload: { itemId: controller.editingItem!.id, garment, modifiers: [] } })}
          onToggleModifier={(modifier) => {
            const isSelected = controller.editingItem!.modifiers.some((selectedModifier) => selectedModifier.name === modifier.name);
            dispatch({
              type: "setAlterationItem",
              payload: {
                itemId: controller.editingItem!.id,
                modifiers: isSelected
                  ? controller.editingItem!.modifiers.filter((selectedModifier) => selectedModifier.name !== modifier.name)
                  : [...controller.editingItem!.modifiers, modifier],
              },
            });
          }}
          onRequestRemove={() => controller.setPendingDeleteItemId(controller.editingItem!.id)}
          onClose={() => controller.setEditingItemId(null)}
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
