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
import type { FabricLookupType, GarmentSurchargeKind, PricingProgramKey } from "./customPricingCatalog";

export type DbLocation = {
  id: string;
  name: PickupLocation;
  isActive: boolean;
};

export type DbStaffMember = {
  id: string;
  name: string;
  role: "tailor";
  primaryLocationId: string;
};

export type DbAlterationServiceDefinition = {
  id: string;
  category: string;
  name: string;
  price: number;
  supportsAdjustment: boolean;
  requiresAdjustment: boolean;
  isActive: boolean;
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
  isActive: boolean;
};

export type DbOrganizationSettings = {
  id: string;
  organizationName: string;
  defaultLocationId: string;
  taxRate: number;
  customDepositRate: number;
};

export type DbPricingProgram = {
  id: string;
  key: PricingProgramKey;
  label: string;
  sortOrder: number;
  isActive: boolean;
};

export type DbPricingTier = {
  id: string;
  key: string;
  programKey: PricingProgramKey;
  label: string;
  sortOrder: number;
  floorPrice: number | null;
  isActive: boolean;
};

export type DbMillBook = {
  id: string;
  key: string;
  programKey: PricingProgramKey;
  tierKey: string;
  label: string;
  manufacturer: string;
  notes: string;
  sortOrder: number;
  isActive: boolean;
};

export type DbFabricCatalogItem = {
  id: string;
  programKey: PricingProgramKey;
  tierKey: string;
  bookId: string;
  sku: string;
  label: string;
  composition?: string;
  yarn?: string;
  weight?: string;
  lookupType: FabricLookupType;
  hasQrCode: boolean;
  qrCodeRawValue: string | null;
  qrResolvedUrl: string | null;
  externalReference: string | null;
  swatch: string;
  swatchImage?: string;
  isActive: boolean;
};

export type DbGarmentBasePrice = {
  id: string;
  programKey: PricingProgramKey;
  tierKey: string;
  garmentLabel: string;
  amount: number;
  isActive: boolean;
};

export type DbGarmentSurchargeRule = {
  id: string;
  programKey: PricingProgramKey;
  garmentLabel: string;
  kind: GarmentSurchargeKind;
  optionValue: string;
  label: string;
  amount: number;
  isActive: boolean;
};

export type DbCatalogItem = {
  id: string;
  key: string;
  label: string;
  kind: "product";
  isActive: boolean;
};

export type DbCatalogVariation = {
  id: string;
  itemId: string;
  key: string;
  label: string;
  programKey: PricingProgramKey;
  fallbackAmount: number;
  supportsCanvas: boolean;
  supportsCustomLining: boolean;
  supportsLapel: boolean;
  supportsPocketType: boolean;
  isActive: boolean;
};

export type DbCatalogOptionGroup = {
  id: string;
  itemId: string;
  key: "fabric" | "buttons" | "lining" | "threads" | "lapel" | "pocket_type";
  label: string;
  sortOrder: number;
  isActive: boolean;
};

export type DbCatalogModifierGroup = {
  id: string;
  itemId: string;
  key: "canvas" | "custom_lining";
  label: string;
  sortOrder: number;
  isActive: boolean;
};

export type DbCatalogModifierOption = {
  id: string;
  groupId: string;
  optionValue: string;
  label: string;
  amount: number;
  isActive: boolean;
};

export type DbCatalogVariationTierPrice = {
  id: string;
  variationId: string;
  tierKey: string;
  amount: number;
  isActive: boolean;
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
  selectedCustomerId: string | null;
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
  acceptedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  canceledAt: string | null;
  status: "open" | "partially_ready" | "partially_picked_up" | "complete" | "canceled";
  operationalStatus?: "accepted" | "in_progress";
  holdUntilAllScopesReady: boolean;
};

export type DbOrderScope = {
  id: string;
  orderId: string;
  workflow: WorkflowMode;
  phase: "in_progress" | "ready" | "picked_up";
  assigneeStaffId: string | null;
  promisedReadyAt: string | null;
  readyAt: string | null;
  pickedUpAt: string | null;
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
  isRush: boolean;
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
  referenceId?: string | null;
  numericValue?: number | null;
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
};

export type DbPaymentRecord = {
  id: string;
  orderId: string;
  source: "square" | "prototype";
  status: OpenOrderPaymentStatus;
  allocation?: "custom_deposit" | "alteration_balance" | "custom_balance" | "full_balance";
  amount: number;
  collectedAt: string | null;
  squarePaymentId: string | null;
};

export type DbOrderTimelineEvent = {
  id: string;
  orderId: string;
  type:
    | "order_created"
    | "order_accepted"
    | "order_started"
    | "payment_captured"
    | "scope_ready"
    | "scope_picked_up"
    | "order_complete"
    | "order_canceled";
  label: string;
  occurredAt: string;
  amount: number | null;
};

export type DbSquareLink = {
  orderId: string;
  squareOrderId: string;
};

export type PrototypeDatabase = {
  generatedAt: string;
  organizationSettings: DbOrganizationSettings;
  locations: DbLocation[];
  staffMembers: DbStaffMember[];
  alterationServiceDefinitions: DbAlterationServiceDefinition[];
  catalogItems: DbCatalogItem[];
  catalogVariations: DbCatalogVariation[];
  catalogOptionGroups: DbCatalogOptionGroup[];
  catalogModifierGroups: DbCatalogModifierGroup[];
  catalogModifierOptions: DbCatalogModifierOption[];
  catalogVariationTierPrices: DbCatalogVariationTierPrice[];
  pricingPrograms: DbPricingProgram[];
  pricingTiers: DbPricingTier[];
  millBooks: DbMillBook[];
  fabricCatalogItems: DbFabricCatalogItem[];
  garmentBasePrices: DbGarmentBasePrice[];
  garmentSurchargeRules: DbGarmentSurchargeRule[];
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
  orderTimelineEvents: DbOrderTimelineEvent[];
  squareLinks: DbSquareLink[];
};
