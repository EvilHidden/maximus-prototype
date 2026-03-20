import type { ReactNode } from "react";

export type Screen = "home" | "customer" | "order" | "measurements" | "checkout";
export type OrderType = "alteration" | "custom" | "mixed";
export type StatusTone = "default" | "dark" | "warn";

export type Customer = {
  id: string;
  name: string;
  phone: string;
  lastVisit: string;
  measurementsStatus: string;
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
  time: string;
  day: "today" | "tomorrow";
  kind: "appointment" | "pickup";
  customer: string;
  type: string;
  status: string;
  missing: string;
  route: OrderType | "pickup";
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

export type WorkflowDraft = {
  orderType: OrderType | null;
  activeWorkflow: Exclude<OrderType, "mixed"> | null;
  linkedMeasurementSet: string | null;
  selectedCustomItem: string | null;
  selectedGarment: string;
  selectedMods: AlterationService[];
  alterationItems: AlterationItem[];
  pickupDate: string;
  pickupTime: string;
  construction: string | null;
  bundleType: string | null;
  selectedBand: string | null;
  measurements: Record<string, string>;
};

export type NavItem = {
  key: Screen;
  label: string;
};

export type DefinitionItem = {
  label: string;
  value: ReactNode;
};
