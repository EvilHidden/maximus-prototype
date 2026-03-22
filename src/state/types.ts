import type {
  AlterationCheckoutIntent,
  AlterationService,
  Customer,
  CustomOrderEventType,
  CustomGarmentGender,
  OpenOrder,
  OrderWorkflowState,
  PickupLocation,
  Screen,
  WorkflowMode,
} from "../types";

export type AppState = {
  screen: Screen;
  selectedCustomerId: string | null;
  customers: Customer[];
  openOrders: OpenOrder[];
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

export type AppAction =
  | { type: "setScreen"; screen: Screen }
  | { type: "setCustomer"; customerId: string | null }
  | { type: "addCustomer"; customer: Customer }
  | { type: "updateCustomer"; customer: Customer }
  | { type: "deleteCustomer"; customerId: string }
  | { type: "setOrderPayer"; customerId: string | null }
  | { type: "activateWorkflow"; workflow: WorkflowMode }
  | { type: "setAlterationCheckoutIntent"; intent: AlterationCheckoutIntent }
  | { type: "completeOpenOrder"; openOrder: OpenOrder }
  | { type: "markOpenOrderPickupReady"; openOrderId: number; pickupId: string }
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
  | { type: "clearOrder" };
