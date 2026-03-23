import type {
  AppointmentConfirmationStatus,
  AppointmentSource,
  AppointmentStatusKey,
  AppointmentTypeKey,
  CustomOrderEventType,
  CustomGarmentGender,
  MeasurementStatus,
  OpenOrderPaymentStatus,
  OrderLineComponentKind,
  OrderType,
  PickupLocation,
  WorkflowMode,
  OrderWorkflowState,
} from "../types";

export type DbLocation = {
  id: string;
  name: PickupLocation;
};

export type DbAlterationServiceDefinition = {
  id: string;
  category: string;
  name: string;
  price: number;
};

export type DbCustomGarmentDefinition = {
  id: string;
  gender: CustomGarmentGender;
  label: string;
  jacketBased: boolean;
};

export type DbStyleOptionDefinition = {
  id: string;
  kind: "lapel" | "pocket_type" | "canvas";
  label: string;
};

export type DbMeasurementFieldDefinition = {
  id: string;
  label: string;
  sortOrder: number;
};

export type DbCustomer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  preferredLocationId: string;
  lastVisitLabel: string;
  measurementsStatus: MeasurementStatus;
  marketingOptIn: boolean;
  notes: string;
  isVip?: boolean;
  status?: "active" | "archived";
};

export type DbCustomerEvent = {
  id: string;
  customerId: string;
  type: CustomOrderEventType;
  title: string;
  eventDate: string;
};

export type DbMeasurementSet = {
  id: string;
  customerId: string;
  label: string;
  takenAt?: string;
  note: string;
  values: Record<string, string>;
  suggested?: boolean;
  isDraft?: boolean;
};

export type DbDraftOrder = {
  id: string;
  payerCustomerId: string | null;
  updatedAt: string;
  snapshot: OrderWorkflowState;
};

export type DbOrder = {
  id: string;
  displayId: string;
  payerCustomerId: string | null;
  payerName: string;
  orderType: OrderType;
  createdAt: string;
  status: "open" | "partially_ready" | "partially_picked_up" | "complete" | "canceled";
  operationalStatus?: "accepted" | "in_progress";
  holdUntilAllScopesReady: boolean;
};

export type DbOrderScope = {
  id: string;
  orderId: string;
  workflow: WorkflowMode;
  phase: "in_progress" | "ready" | "picked_up";
  promisedReadyAt: string | null;
  readyAt: string | null;
  eventId: string | null;
  appointmentOptional: boolean;
};

export type DbOrderScopeLine = {
  id: string;
  scopeId: string;
  label: string;
  garmentLabel: string;
  quantity: number;
  unitPrice: number;
  wearerCustomerId: string | null;
  wearerName: string | null;
  measurementSetId: string | null;
  measurementSetLabel: string | null;
  measurementSnapshot: Record<string, string> | null;
};

export type DbOrderScopeLineComponent = {
  id: string;
  lineId: string;
  kind: OrderLineComponentKind;
  label: string;
  value: string;
  sortOrder: number;
};

export type DbPickupNotification = {
  id: string;
  scopeId: string;
  channel: "sms" | "phone" | "email" | "in_person";
  status: "sent" | "requested_pickup" | "acknowledged";
  sentAt: string;
  note: string;
};

export type DbPickupAppointment = {
  id: string;
  orderId: string;
  scopeId: string | null;
  scopeLineId: string | null;
  customerId: string | null;
  scheduledFor: string;
  locationId: string;
  source: AppointmentSource;
  durationMinutes: number;
  typeKey: Extract<AppointmentTypeKey, "pickup">;
  statusKey: Extract<AppointmentStatusKey, "scheduled" | "completed" | "canceled">;
  summary: string;
  confirmationStatus: AppointmentConfirmationStatus | null;
  rush: boolean;
};

export type DbServiceAppointment = {
  id: string;
  customerId?: string;
  orderId: string | null;
  scopeId: string | null;
  scopeLineId: string | null;
  customerName: string;
  workflow: WorkflowMode;
  locationId: string;
  scheduledFor: string;
  source: AppointmentSource;
  durationMinutes: number;
  typeKey: Extract<
    AppointmentTypeKey,
    "alteration_fitting" | "custom_consult" | "first_fitting" | "custom_fitting" | "wedding_party_fitting"
  >;
  statusKey: Extract<AppointmentStatusKey, "scheduled" | "ready_to_check_in" | "prep_required" | "completed" | "canceled">;
  confirmationStatus: AppointmentConfirmationStatus | null;
  rush: boolean;
};

export type DbPaymentRecord = {
  id: string;
  orderId: string;
  source: "square" | "prototype";
  status: OpenOrderPaymentStatus;
  amount: number;
  collectedAt: string | null;
  squarePaymentId: string | null;
};

export type DbSquareLink = {
  orderId: string;
  squareOrderId: string;
};

export type PrototypeDatabase = {
  generatedAt: string;
  locations: DbLocation[];
  alterationServiceDefinitions: DbAlterationServiceDefinition[];
  customGarmentDefinitions: DbCustomGarmentDefinition[];
  styleOptionDefinitions: DbStyleOptionDefinition[];
  measurementFieldDefinitions: DbMeasurementFieldDefinition[];
  customers: DbCustomer[];
  customerEvents: DbCustomerEvent[];
  measurementSets: DbMeasurementSet[];
  draftOrders: DbDraftOrder[];
  orders: DbOrder[];
  orderScopes: DbOrderScope[];
  orderScopeLines: DbOrderScopeLine[];
  orderScopeLineComponents: DbOrderScopeLineComponent[];
  pickupNotifications: DbPickupNotification[];
  pickupAppointments: DbPickupAppointment[];
  serviceAppointments: DbServiceAppointment[];
  payments: DbPaymentRecord[];
  squareLinks: DbSquareLink[];
};
