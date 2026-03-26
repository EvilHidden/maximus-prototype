import type {
  AlterationPickup,
  AppointmentConfirmationStatus,
  AppointmentTypeKey,
  AlterationService,
  Customer,
  CustomOccasion,
  CustomGarmentGender,
  OpenOrder,
  OrderWorkflowState,
  PickupLocation,
  ServiceAppointmentType,
  Screen,
  WorkflowMode,
} from "../types";
import type { PrototypeDatabase } from "../db/schema";

export type AppState = {
  screen: Screen;
  selectedCustomerId: string | null;
  checkoutOpenOrderId: number | null;
  checkoutJustSavedOpenOrderId: number | null;
  checkoutJustCompletedOpenOrderId: number | null;
  editingOpenOrderId: number | null;
  database: PrototypeDatabase;
  order: OrderWorkflowState;
};

export type SetAlterationItemPayload = {
  itemId: number;
  garment?: string;
  modifiers?: AlterationService[];
};

export type SetAlterationPickupPayload = AlterationPickup;
export type SetCustomOccasionPayload = CustomOccasion;

export type AddCustomItemPayload = {
  wearerName: string | null;
  linkedMeasurementLabel: string | null;
};

export type SaveCustomItemPayload = AddCustomItemPayload & {
  itemId: number;
};

export type CreateAppointmentPayload = {
  customerId: string;
  typeKey: ServiceAppointmentType;
  location: PickupLocation;
  scheduledFor: string;
};

export type RescheduleAppointmentPayload = {
  appointmentId: string;
  location: PickupLocation;
  scheduledFor: string;
};

export type UpdateAppointmentPayload = {
  appointmentId: string;
  customerId: string;
  typeKey: AppointmentTypeKey;
  location: PickupLocation;
  scheduledFor: string;
  confirmationStatus: AppointmentConfirmationStatus;
};

export type SaveMeasurementSetPayload = {
  mode: "update" | "copy";
  title?: string;
};

export type AppAction =
  | { type: "setScreen"; screen: Screen }
  | { type: "startOrderForCustomer"; customerId: string }
  | { type: "openCheckoutForDraft" }
  | { type: "openCheckoutForOpenOrder"; openOrderId: number }
  | { type: "openOrderForEdit"; openOrderId: number }
  | { type: "setCustomer"; customerId: string | null }
  | { type: "addCustomer"; customer: Customer }
  | { type: "updateCustomer"; customer: Customer }
  | { type: "archiveCustomer"; customerId: string }
  | { type: "setOrderPayer"; customerId: string | null }
  | { type: "activateWorkflow"; workflow: WorkflowMode }
  | { type: "saveOpenOrder"; paymentStatus: OpenOrder["paymentStatus"]; openCheckout: boolean }
  | { type: "assignOpenOrderTailor"; openOrderId: number; staffId: string | null }
  | { type: "startOpenOrderWork"; openOrderId: number }
  | { type: "completeOpenOrderCheckout"; openOrderId: number }
  | { type: "markOpenOrderPickupReady"; openOrderId: number; pickupId: string }
  | { type: "completeOpenOrderPickup"; openOrderId: number }
  | { type: "cancelOpenOrder"; openOrderId: number }
  | { type: "createAppointment"; payload: CreateAppointmentPayload }
  | { type: "rescheduleAppointment"; payload: RescheduleAppointmentPayload }
  | { type: "updateAppointment"; payload: UpdateAppointmentPayload }
  | { type: "confirmAppointment"; appointmentId: string }
  | { type: "completeAppointment"; appointmentId: string }
  | { type: "cancelAppointment"; appointmentId: string }
  | { type: "startNewMeasurementSet" }
  | { type: "saveMeasurementSet"; payload: SaveMeasurementSetPayload }
  | { type: "deleteMeasurementSet"; measurementSetId: string }
  | { type: "selectAlterationGarment"; garment: string }
  | { type: "toggleAlterationModifier"; modifier: AlterationService }
  | { type: "addAlterationItem" }
  | { type: "setAlterationItem"; payload: SetAlterationItemPayload }
  | { type: "removeAlterationItem"; itemId: number }
  | { type: "setAlterationPickup"; payload: SetAlterationPickupPayload }
  | { type: "setCustomOccasion"; payload: SetCustomOccasionPayload }
  | { type: "selectCustomGender"; gender: CustomGarmentGender | null }
  | { type: "selectCustomWearer"; customerId: string | null }
  | { type: "selectCustomGarment"; garment: string | null }
  | { type: "setCustomConfiguration"; patch: Partial<OrderWorkflowState["custom"]["draft"]> }
  | { type: "addCustomItem"; payload: AddCustomItemPayload }
  | { type: "loadCustomItemForEdit"; itemId: number }
  | { type: "saveCustomItem"; payload: SaveCustomItemPayload }
  | { type: "resetCustomDraft" }
  | { type: "removeCustomItem"; itemId: number }
  | { type: "updateMeasurements"; field: string; value: string }
  | { type: "replaceMeasurements"; values: Record<string, string>; measurementSetId: string | null }
  | { type: "linkMeasurementSet"; measurementSetId: string | null }
  | { type: "clearOrder" };
