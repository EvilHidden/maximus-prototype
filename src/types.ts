export type ThemeMode = "light" | "dark";
export type Screen = "home" | "customer" | "order" | "measurements" | "checkout" | "openOrders" | "appointments";
export type WorkflowMode = "alteration" | "custom";
export type OrderType = WorkflowMode | "mixed";
export type StatusTone = "default" | "dark" | "warn" | "success" | "danger";
export type MeasurementStatus = "on_file" | "needs_update" | "missing";
export type PickupLocation = "Fifth Avenue" | "Queens" | "Long Island";
export type CustomGarmentGender = "male" | "female";
export type AlterationCheckoutIntent = "pay_later" | "prepay_now" | null;
export type OpenOrderPaymentStatus = "due_later" | "ready_to_collect" | "pending" | "captured";
export type CustomOrderEventType = "none" | "wedding" | "prom";
export type AppointmentSource = "square" | "manual" | "prototype";
export type ServiceAppointmentType =
  | "alteration_fitting"
  | "custom_consult"
  | "first_fitting"
  | "custom_fitting"
  | "wedding_party_fitting";
export type PickupAppointmentType = "pickup";
export type AppointmentTypeKey = ServiceAppointmentType | PickupAppointmentType;
export type ServiceAppointmentStatus = "scheduled" | "ready_to_check_in" | "prep_required" | "completed" | "canceled";
export type PickupAppointmentStatus = "scheduled" | "completed" | "canceled";
export type AppointmentStatusKey = ServiceAppointmentStatus | PickupAppointmentStatus;
export type AppointmentConfirmationStatus = "confirmed" | "unconfirmed";
export type AppointmentPrepFlag = "needs_measurements";
export type AppointmentProfileFlag = "missing_phone" | "missing_email" | "missing_address" | "needs_marketing_opt_in";
export type AppointmentContextFlag = AppointmentConfirmationStatus | "rush";
export type PickupSchedule = {
  pickupDate: string;
  pickupTime: string;
  pickupLocation: PickupLocation | "";
  eventType: CustomOrderEventType;
  eventDate: string;
};

export type OpenOrderPickup = PickupSchedule & {
  id: string;
  scope: WorkflowMode;
  label: string;
  itemSummary: string[];
  itemCount: number;
  readyForPickup: boolean;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  preferredLocation: PickupLocation;
  lastVisit: string;
  measurementsStatus: MeasurementStatus;
  marketingOptIn: boolean;
  notes: string;
  isVip?: boolean;
};

export type CustomerOrder = {
  id: string;
  label: string;
  createdAt: string;
  status: string;
  total: number;
};

export type Appointment = {
  id: string;
  scheduledFor: string;
  kind: "appointment" | "pickup";
  source: AppointmentSource;
  location: PickupLocation;
  customerId?: string;
  customer: string;
  orderId?: string | null;
  scopeId?: string | null;
  scopeLineId?: string | null;
  durationMinutes: number;
  typeKey: AppointmentTypeKey;
  type: string;
  statusKey: AppointmentStatusKey;
  pickupSummary?: string;
  status: string;
  prepFlags: AppointmentPrepFlag[];
  profileFlags: AppointmentProfileFlag[];
  contextFlags: AppointmentContextFlag[];
  route: WorkflowMode | "pickup";
};

export type AlterationService = {
  name: string;
  price: number;
};

export type AlterationCategory = {
  category: string;
  services: AlterationService[];
};

export type AlterationItem = {
  id: number;
  garment: string;
  modifiers: AlterationService[];
  subtotal: number;
};

export type MeasurementSet = {
  id: string;
  customerId: string;
  label: string;
  takenAt?: string;
  note: string;
  values: Record<string, string>;
  isDraft?: boolean;
  suggested?: boolean;
};

export type MeasurementSetOption = MeasurementSet & {
  kind: "history" | "draft";
};

export type OrderBagLineItem = {
  id: string;
  kind: WorkflowMode;
  title: string;
  subtitle: string;
  amount: number;
  removable?: boolean;
  editable?: boolean;
  itemId?: number;
};

export type PricingSummary = {
  alterationsSubtotal: number;
  customSubtotal: number;
  taxAmount: number;
  depositDue: number;
  total: number;
};

export type AlterationBuilderState = {
  selectedGarment: string;
  selectedModifiers: AlterationService[];
  items: AlterationItem[];
};

export type CustomGarmentDraft = {
  gender: CustomGarmentGender | null;
  wearerCustomerId: string | null;
  selectedGarment: string | null;
  linkedMeasurementSetId: string | null;
  measurements: Record<string, string>;
  fabric: string | null;
  buttons: string | null;
  lining: string | null;
  threads: string | null;
  monogramLeft: string;
  monogramCenter: string;
  monogramRight: string;
  pocketType: string | null;
  lapel: string | null;
  canvas: string | null;
};

export type CustomGarmentItem = CustomGarmentDraft & {
  id: number;
  wearerName: string | null;
  linkedMeasurementLabel: string | null;
  measurementSnapshot: Record<string, string>;
};

export type CustomBuilderState = {
  draft: CustomGarmentDraft;
  items: CustomGarmentItem[];
};

export type OrderWorkflowState = {
  activeWorkflow: WorkflowMode | null;
  payerCustomerId: string | null;
  checkoutIntent: AlterationCheckoutIntent;
  alteration: AlterationBuilderState;
  custom: CustomBuilderState;
  fulfillment: {
    alteration: PickupSchedule;
    custom: PickupSchedule;
  };
};

export type OpenOrder = {
  id: number;
  payerCustomerId: string | null;
  payerName: string;
  orderType: OrderType;
  itemCount: number;
  lineItems: OrderBagLineItem[];
  itemSummary: string[];
  pickupSchedules: OpenOrderPickup[];
  paymentStatus: OpenOrderPaymentStatus;
  paymentDueNow: number;
  collectedToday: number;
  balanceDue: number;
  total: number;
  createdAt: string;
};

export type ClosedOrderHistoryItem = {
  id: string;
  customerName: string;
  label: string;
  createdAt: string;
  status: string;
  total: number;
};

export type NavItem = {
  key: Screen;
  label: string;
};
