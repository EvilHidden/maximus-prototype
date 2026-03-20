import type { ReactNode } from "react";

export type ThemeMode = "light" | "dark";
export type Screen = "home" | "customer" | "order" | "measurements" | "checkout";
export type WorkflowMode = "alteration" | "custom";
export type OrderType = WorkflowMode | "mixed";
export type StatusTone = "default" | "dark" | "warn" | "success" | "danger";
export type MeasurementStatus = "on_file" | "needs_update" | "missing";

export type Customer = {
  id: string;
  name: string;
  phone: string;
  lastVisit: string;
  measurementsStatus: MeasurementStatus;
  notes: string;
  isVip?: boolean;
};

export type CustomerOrder = {
  id: string;
  label: string;
  date: string;
  status: string;
  total: string;
};

export type Appointment = {
  id: string;
  time: string;
  day: "today" | "tomorrow";
  kind: "appointment" | "pickup";
  customerId?: string;
  customer: string;
  type: string;
  status: string;
  missing: string;
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
  note: string;
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

export type CustomBuilderState = {
  selectedGarment: string | null;
  construction: string | null;
  bundleType: string | null;
  pricingBand: string | null;
  linkedMeasurementSetId: string | null;
  measurements: Record<string, string>;
};

export type OrderWorkflowState = {
  activeWorkflow: WorkflowMode | null;
  alteration: AlterationBuilderState;
  custom: CustomBuilderState;
  fulfillment: {
    pickupDate: string;
    pickupTime: string;
  };
};

export type NavItem = {
  key: Screen;
  label: string;
};

export type DefinitionItem = {
  label: string;
  value: ReactNode;
};
