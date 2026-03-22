import type {
  CustomOrderEventType,
  MeasurementStatus,
  OpenOrderPaymentStatus,
  OrderType,
  PickupLocation,
  WorkflowMode,
} from "../types";

export type DbLocation = {
  id: string;
  name: PickupLocation;
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
  notes: string;
  isVip?: boolean;
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

export type DbOrder = {
  id: string;
  displayId: string;
  payerCustomerId: string | null;
  payerName: string;
  orderType: OrderType;
  createdAt: string;
  status: "open" | "partially_ready" | "partially_picked_up" | "complete";
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
  quantity: number;
  unitPrice: number;
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
  customerId: string | null;
  scheduledFor: string;
  locationId: string;
  status: "scheduled" | "completed";
  summary: string;
  issue: string;
};

export type DbServiceAppointment = {
  id: string;
  customerId?: string;
  customerName: string;
  workflow: WorkflowMode;
  locationId: string;
  scheduledFor: string;
  type: string;
  status: string;
  issue: string;
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

export type DbAirtableLink = {
  orderId: string;
  airtableRecordId: string;
};

export type PrototypeDatabase = {
  generatedAt: string;
  locations: DbLocation[];
  customers: DbCustomer[];
  customerEvents: DbCustomerEvent[];
  measurementSets: DbMeasurementSet[];
  orders: DbOrder[];
  orderScopes: DbOrderScope[];
  orderScopeLines: DbOrderScopeLine[];
  pickupNotifications: DbPickupNotification[];
  pickupAppointments: DbPickupAppointment[];
  serviceAppointments: DbServiceAppointment[];
  payments: DbPaymentRecord[];
  squareLinks: DbSquareLink[];
  airtableLinks: DbAirtableLink[];
};
