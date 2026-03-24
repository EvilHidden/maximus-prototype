import { useMemo, useState } from "react";
import type { Dispatch } from "react";
import type { AppReferenceData } from "../../../db";
import type { AppAction, AppState } from "../../../state/appState";
import type { Customer, MeasurementSet, Screen } from "../../../types";
import { filterCustomers, getActiveCustomers } from "../../customer/selectors";
import {
  getCanAddCustomDraftToOrder,
  getHasAlterationContent,
  getHasCustomContent,
  getOrderBagLineItems,
  getOrderType,
  getPickupRequired,
  getPricingSummary,
  getSummaryGuardrail,
} from "../selectors";
import { getCustomMeasurementsCardModel, getMeasurementOptions } from "../../measurements/selectors";
import { useCustomMeasurementDefaults } from "../../measurements/hooks/useCustomMeasurementDefaults";

type UseOrderBuilderControllerArgs = {
  customers: Customer[];
  measurementSets: MeasurementSet[];
  referenceData: AppReferenceData;
  payerCustomer: Customer | null;
  order: AppState["order"];
  dispatch: Dispatch<AppAction>;
  onScreenChange: (screen: Screen) => void;
  onOpenDraftCheckout: () => void;
  onSaveDraftOrder: (paymentStatus: "due_later" | "ready_to_collect", openCheckout?: boolean) => void;
  showToast: (message: string) => void;
};

export function useOrderBuilderController({
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
}: UseOrderBuilderControllerArgs) {
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
      : "Review order";
  const addToCartDisabledReason = !order.alteration.selectedGarment
    ? "Select a garment before adding anything to the cart."
    : order.alteration.selectedModifiers.length === 0
      ? "Choose at least one alteration service before adding this item to the cart."
      : undefined;
  const missingAlterationGarment = !order.alteration.selectedGarment;
  const missingAlterationServices = Boolean(order.alteration.selectedGarment) && order.alteration.selectedModifiers.length === 0;

  const garmentOptions = referenceData.alterationCatalog.map((garment) => garment.category);
  const currentServices = referenceData.alterationCatalog.find((garment) => garment.category === order.alteration.selectedGarment)?.services ?? [];
  const currentAlterationSubtotal = order.alteration.selectedModifiers.reduce((sum, modifier) => sum + modifier.price, 0);
  const activeCustomers = useMemo(() => getActiveCustomers(customers), [customers]);
  const filteredCustomers = useMemo(() => filterCustomers(activeCustomers, customerQuery), [activeCustomers, customerQuery]);
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
  const editingServices = referenceData.alterationCatalog.find((garment) => garment.category === editingItem?.garment)?.services ?? [];
  const continueDisabledReason =
    orderType === null
      ? "Add at least one item to the cart before moving forward."
      : summaryGuardrail.missingCustomer
        ? "Choose the customer paying for this order before you continue."
        : summaryGuardrail.missingPickup
          ? orderType === "mixed"
            ? "Set both pickup times before you continue."
            : "Set the pickup date, time, and location before you continue."
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
                referenceData.jacketBasedCustomGarments.has(order.custom.draft.selectedGarment) &&
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
    referenceData.jacketBasedCustomGarments.has(order.custom.draft.selectedGarment) &&
    (!order.custom.draft.pocketType || !order.custom.draft.lapel || !order.custom.draft.canvas);

  useCustomMeasurementDefaults({
    measurementSets,
    wearerCustomerId: wearerCustomer?.id ?? null,
    order,
    dispatch,
  });

  const handleShowAlterationDisabledReason = (reason: string) => {
    setAlterationValidationVisible(true);
    showToast(reason);
  };

  const handleShowCustomDisabledReason = (reason: string) => {
    setCustomValidationVisible(false);
    showToast(reason);
  };

  const handleAddOrSaveCustomItem = () => {
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
  };

  const handleCancelCustomEdit = () => {
    setEditingCustomItemId(null);
    setCustomValidationVisible(false);
    dispatch({ type: "resetCustomDraft" });
  };

  const handleContinue = () => {
    if (order.activeWorkflow === "custom" && order.custom.draft.selectedGarment && !order.custom.draft.linkedMeasurementSetId) {
      if (wearerCustomer) {
        dispatch({ type: "setCustomer", customerId: wearerCustomer.id });
      }
      onScreenChange("measurements");
      return;
    }

    onOpenDraftCheckout();
  };

  return {
    customerModalOpen,
    setCustomerModalOpen,
    wearerModalOpen,
    setWearerModalOpen,
    customerQuery,
    setCustomerQuery,
    pickupModalScope,
    setPickupModalScope,
    measurementPickerOpen,
    setMeasurementPickerOpen,
    editingItemId,
    setEditingItemId,
    editingCustomItemId,
    setEditingCustomItemId,
    pendingDeleteItemId,
    setPendingDeleteItemId,
    clearBagConfirmOpen,
    setClearBagConfirmOpen,
    alterationValidationVisible,
    setAlterationValidationVisible,
    customValidationVisible,
    setCustomValidationVisible,
    hasAlterationContent,
    hasCustomContent,
    orderType,
    pickupRequired,
    pricing,
    lineItems,
    canAddCustomDraftToOrder,
    summaryGuardrail,
    wearerCustomer,
    continueLabel,
    addToCartDisabledReason,
    missingAlterationGarment,
    missingAlterationServices,
    garmentOptions,
    currentServices,
    currentAlterationSubtotal,
    filteredCustomers,
    measurementsCardModel,
    measurementOptions,
    editingItem,
    editingCustomItem,
    editingServices,
    continueDisabledReason,
    customAddDisabledReason,
    missingCustomGender,
    missingCustomGarment,
    missingCustomWearer,
    missingCustomMeasurements,
    missingCustomBuildDetails,
    missingCustomStyleDetails,
    handleShowAlterationDisabledReason,
    handleShowCustomDisabledReason,
    handleAddOrSaveCustomItem,
    handleCancelCustomEdit,
    handleContinue,
    handleOpenEditCustomItem: (itemId: number) => {
      setEditingItemId(null);
      setEditingCustomItemId(itemId);
      dispatch({ type: "loadCustomItemForEdit", itemId });
    },
    handleRequestRemoveItem: (kind: "alteration" | "custom", itemId: number) => {
      if (kind === "alteration") {
        setPendingDeleteItemId(itemId);
        return;
      }

      if (editingCustomItemId === itemId) {
        setEditingCustomItemId(null);
        dispatch({ type: "resetCustomDraft" });
      }
      dispatch({ type: "removeCustomItem", itemId });
    },
  };
}
