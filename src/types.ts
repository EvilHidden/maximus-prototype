export type ThemeMode = "light" | "dark";
export type Screen = "home" | "customer" | "order" | "measurements" | "checkout" | "openOrders" | "orderDetails" | "appointments";
export type WorkflowMode = "alteration" | "custom";
export type OrderType = WorkflowMode | "mixed";
export type StatusTone = "default" | "dark" | "warn" | "success" | "danger";
export type MeasurementStatus = "on_file" | "missing";
export type PickupLocation = "Fifth Avenue" | "Queens" | "Long Island";
export type CustomGarmentGender = "male" | "female";
export type OpenOrderPaymentStatus = "due_later" | "ready_to_collect" | "pending" | "captured";
export type CheckoutPaymentMode = "none" | "minimum_due" | "deposit_and_alterations" | "full_balance";
export type OpenOrderOperationalStatus = "accepted" | "in_progress" | "partially_ready" | "ready_for_pickup";
export type CustomOrderEventType = "none" | "wedding" | "prom" | "anniversary";
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
export type AppointmentContextFlag = AppointmentConfirmationStatus;
export type AlterationPickup = {
  pickupDate: string;
  pickupTime: string;
  pickupLocation: PickupLocation | "";
};

export type CustomOccasion = {
  eventType: CustomOrderEventType;
  eventDate: string;
};

export type StaffMember = {
  id: string;
  name: string;
  primaryLocation: PickupLocation;
};

export type OpenOrderPickup = AlterationPickup & CustomOccasion & {
  id: string;
  scope: WorkflowMode;
  label: string;
  itemSummary: string[];
  itemCount: number;
  readyAt?: string | null;
  pickedUpAt?: string | null;
  pickedUp?: boolean;
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
  archived?: boolean;
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

export type AlterationServiceDefinition = {
  id: string;
  name: string;
  price: number;
  supportsAdjustment: boolean;
  requiresAdjustment: boolean;
};

export type AlterationServiceSelection = AlterationServiceDefinition & {
  deltaInches: number | null;
};

export type OrderLineComponentKind =
  | "alteration_service"
  | "wearer"
  | "measurement_set"
  | "fabric"
  | "buttons"
  | "lining"
  | "threads"
  | "canvas"
  | "lapel"
  | "pocket_type"
  | "monogram";

export type OrderLineComponent = {
  id: string;
  kind: OrderLineComponentKind;
  label: string;
  value: string;
  sortOrder: number;
  amount?: number;
  referenceId?: string | null;
  numericValue?: number | null;
};

export type AlterationCategory = {
  category: string;
  services: AlterationServiceDefinition[];
};

export type AlterationItem = {
  id: number;
  garment: string;
  modifiers: AlterationServiceSelection[];
  subtotal: number;
  isRush: boolean;
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
  isRush: boolean;
  sourceLabel: string;
  garmentLabel: string;
  wearerCustomerId?: string | null;
  wearerName?: string | null;
  linkedMeasurementSetId?: string | null;
  linkedMeasurementLabel?: string | null;
  measurementSnapshot?: Record<string, string> | null;
  components: OrderLineComponent[];
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
  selectedModifiers: AlterationServiceSelection[];
  selectedRush: boolean;
  items: AlterationItem[];
};

export type CustomGarmentDraft = {
  gender: CustomGarmentGender | null;
  wearerCustomerId: string | null;
  isRush: boolean;
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
  alteration: AlterationBuilderState;
  custom: CustomBuilderState;
  fulfillment: {
    alteration: AlterationPickup;
    custom: CustomOccasion;
  };
};

export type OpenOrder = {
  id: number;
  payerCustomerId: string | null;
  payerName: string;
  orderType: OrderType;
  operationalStatus: OpenOrderOperationalStatus;
  holdUntilAllScopesReady: boolean;
  inHouseAssignee: StaffMember | null;
  itemCount: number;
  lineItems: OrderBagLineItem[];
  itemSummary: string[];
  pickupSchedules: OpenOrderPickup[];
  paymentStatus: OpenOrderPaymentStatus;
  paymentDueNow: number;
  totalCollected: number;
  collectedToday: number;
  balanceDue: number;
  pickupBalanceDue?: number;
  total: number;
  createdAt: string;
};

export type ClosedOrderHistoryItem = {
  id: string;
  customerName: string;
  label: string;
  createdAt: string;
  completedAt?: string | null;
  status: string;
  total: number;
  displayId?: string;
  payerCustomerId?: string | null;
  payerName?: string;
  orderType?: OrderType;
  inHouseAssignee?: StaffMember | null;
  itemCount?: number;
  lineItems?: OrderBagLineItem[];
  itemSummary?: string[];
  pickupSchedules?: OpenOrderPickup[];
  paymentStatus?: OpenOrderPaymentStatus;
  paymentDueNow?: number;
  totalCollected?: number;
  collectedToday?: number;
  balanceDue?: number;
};

export type DraftOrderRecord = {
  id: string;
  payerCustomerId: string | null;
  selectedCustomerId: string | null;
  updatedAt: string;
  snapshot: OrderWorkflowState;
};

export type NavItem = {
  key: Screen;
  label: string;
};
