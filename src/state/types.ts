import type {
  AlterationCheckoutIntent,
  AlterationService,
  AppointmentTypeKey,
  Customer,
  CustomOrderEventType,
  CustomGarmentGender,
  MeasurementSet,
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
  editingOpenOrderId: number | null;
  database: PrototypeDatabase;
  order: OrderWorkflowState;
};

export type SetAlterationItemPayload = {
  itemId: number;
  garment?: string;
  modifiers?: AlterationService[];
};

export type SetPickupSchedulePayload = {
  scope: WorkflowMode;
  pickupDate: string;
  pickupTime: string;
  pickupLocation: PickupLocation | "";
  eventType: CustomOrderEventType;
  eventDate: string;
};

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
  | { type: "setAlterationCheckoutIntent"; intent: AlterationCheckoutIntent }
  | { type: "saveOpenOrder"; paymentStatus: OpenOrder["paymentStatus"]; openCheckout: boolean }
  | { type: "startOpenOrderPayment"; openOrderId: number }
  | { type: "captureOpenOrderPayment"; openOrderId: number }
  | { type: "markOpenOrderPickupReady"; openOrderId: number; pickupId: string }
  | { type: "completeOpenOrderPickup"; openOrderId: number }
  | { type: "cancelOpenOrder"; openOrderId: number }
  | { type: "createAppointment"; payload: CreateAppointmentPayload }
  | { type: "rescheduleAppointment"; payload: RescheduleAppointmentPayload }
  | { type: "completeAppointment"; appointmentId: string }
  | { type: "cancelAppointment"; appointmentId: string }
  | { type: "selectAlterationGarment"; garment: string }
  | { type: "toggleAlterationModifier"; modifier: AlterationService }
  | { type: "addAlterationItem" }
  | { type: "setAlterationItem"; payload: SetAlterationItemPayload }
  | { type: "removeAlterationItem"; itemId: number }
  | { type: "setPickupSchedule"; payload: SetPickupSchedulePayload }
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
  | { type: "replaceMeasurementSetRecords"; measurementSets: MeasurementSet[] }
  | { type: "clearOrder" };
