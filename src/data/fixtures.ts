import type {
  AlterationCategory,
  Customer,
  CustomerOrder,
  Appointment,
  WorkflowDraft,
} from "../types";

export const customers: Customer[] = [
  {
    id: "C-1042",
    name: "James Carter",
    phone: "(555) 201-9044",
    lastVisit: "Feb 28",
    measurementsStatus: "On file",
    notes: "Prefers slim fit",
    isVip: true,
  },
  {
    id: "C-1078",
    name: "Maria Ellis",
    phone: "(555) 884-7712",
    lastVisit: "Mar 10",
    measurementsStatus: "Needs update",
    notes: "Wedding party order",
  },
  {
    id: "C-1116",
    name: "David Nguyen",
    phone: "(555) 490-1162",
    lastVisit: "Mar 14",
    measurementsStatus: "On file",
    notes: "Rush alterations",
  },
];

export const appointments: Appointment[] = [
  {
    time: "9:30 AM",
    day: "today",
    kind: "appointment",
    customer: "Maria Ellis",
    type: "Alteration fitting",
    status: "Ready to check in",
    missing: "Email missing",
    route: "alteration",
  },
  {
    time: "11:00 AM",
    day: "today",
    kind: "appointment",
    customer: "James Carter",
    type: "Custom suit consult",
    status: "Upcoming",
    missing: "Complete",
    route: "custom",
  },
  {
    time: "2:15 PM",
    day: "today",
    kind: "pickup",
    customer: "David Nguyen",
    type: "Pickup appointment",
    status: "Due for pickup today",
    missing: "Phone missing",
    route: "pickup",
  },
  {
    time: "10:00 AM",
    day: "tomorrow",
    kind: "appointment",
    customer: "Andrea Brooks",
    type: "First fitting",
    status: "Prep ticket",
    missing: "Measurements to review",
    route: "alteration",
  },
  {
    time: "1:30 PM",
    day: "tomorrow",
    kind: "appointment",
    customer: "Noah Bennett",
    type: "Custom jacket consult",
    status: "Upcoming",
    missing: "Fabric swatches",
    route: "custom",
  },
  {
    time: "4:00 PM",
    day: "tomorrow",
    kind: "pickup",
    customer: "Maria Ellis",
    type: "Wedding party pickup",
    status: "Prep for tomorrow",
    missing: "Bag and tag",
    route: "pickup",
  },
];

export const customerOrders: Record<string, CustomerOrder[]> = {
  "C-1042": [
    { id: "ORD-8821", label: "Custom navy suit", date: "Feb 28", status: "Delivered", total: "$1,495" },
    { id: "ORD-8610", label: "Trouser hem + taper", date: "Jan 17", status: "Picked up", total: "$65" },
    { id: "ORD-8443", label: "Dinner jacket consult", date: "Dec 05", status: "Quoted", total: "$0" },
  ],
  "C-1078": [
    { id: "ORD-8904", label: "Wedding party alteration set", date: "Mar 10", status: "In progress", total: "$320" },
    { id: "ORD-8732", label: "Bridesmaid dress fitting", date: "Feb 12", status: "Picked up", total: "$95" },
  ],
  "C-1116": [
    { id: "ORD-8940", label: "Rush suit sleeve adjustment", date: "Mar 14", status: "Ready today", total: "$80" },
    { id: "ORD-8528", label: "Pant waist suppression", date: "Jan 08", status: "Delivered", total: "$35" },
  ],
};

export const alterationCatalog: AlterationCategory[] = [
  {
    category: "Dress",
    services: [
      { name: "Strap", price: 35 },
      { name: "Waist", price: 50 },
      { name: "Hem", price: 50 },
      { name: "Shoulder", price: 100 },
      { name: "Zipper replacement", price: 60 },
    ],
  },
  {
    category: "Jacket",
    services: [
      { name: "Length", price: 80 },
      { name: "Sleeve replacement", price: 80 },
      { name: "Lining replacement", price: 150 },
      { name: "Add buttonholes", price: 75 },
      { name: "Lower armhole", price: 30 },
      { name: "Half back", price: 35 },
      { name: "Half seat", price: 40 },
      { name: "Across the chest", price: 75 },
      { name: "Sleeve length", price: 40 },
      { name: "Sleeve length from shoulder", price: 75 },
      { name: "Sleeve width", price: 30 },
      { name: "Change buttons", price: 35 },
      { name: "Chest", price: 30 },
      { name: "Stomach", price: 30 },
      { name: "Bicep", price: 30 },
      { name: "Seat", price: 30 },
      { name: "Lower collar", price: 30 },
      { name: "Restitch felt", price: 20 },
      { name: "Shoulder", price: 75 },
      { name: "Add shoulder pads", price: 35 },
    ],
  },
  {
    category: "Jeans",
    services: [
      { name: "Length", price: 30 },
      { name: "Wide leg length", price: 45 },
      { name: "Knee", price: 20 },
      { name: "Rise", price: 20 },
      { name: "Add belt loops", price: 40 },
      { name: "Repair crotch", price: 40 },
      { name: "Waist", price: 25 },
      { name: "Seat", price: 20 },
      { name: "Thigh", price: 20 },
      { name: "Bottom", price: 20 },
    ],
  },
  {
    category: "Pants",
    services: [
      { name: "Length", price: 30 },
      { name: "Knee", price: 20 },
      { name: "Rise", price: 20 },
      { name: "Add belt loops", price: 40 },
      { name: "Repair crotch", price: 40 },
      { name: "Waist", price: 25 },
      { name: "Seat", price: 20 },
      { name: "Thigh", price: 20 },
      { name: "Bottom", price: 20 },
    ],
  },
  {
    category: "Shirt",
    services: [
      { name: "Seat", price: 25 },
      { name: "Bicep", price: 20 },
      { name: "Sleeve length", price: 35 },
      { name: "Cuff", price: 20 },
      { name: "Neck", price: 10 },
      { name: "Shoulder", price: 45 },
      { name: "Chest", price: 20 },
      { name: "Stomach", price: 25 },
      { name: "Change buttons", price: 20 },
      { name: "Change collar", price: 30 },
    ],
  },
  {
    category: "Vest",
    services: [
      { name: "Chest", price: 30 },
      { name: "Stomach", price: 30 },
      { name: "Seat", price: 30 },
      { name: "Length", price: 50 },
    ],
  },
];

export const customCatalog = ["Suit", "Tuxedo", "Jacket", "Trousers", "Vest", "Shirt", "Bundle"];

export const measurementFields = [
  "Chest",
  "Waist",
  "Seat",
  "Shoulder",
  "Sleeve",
  "Inseam",
  "Outseam",
  "Neck",
  "Jacket Length",
  "Bicep",
  "Wrist",
  "Thigh",
];

export const pricingBands = ["Starter", "Workday", "Special Occasion", "Premium", "Luxury", "Elite"];

export const navItems = [
  { key: "home", label: "Home" },
  { key: "customer", label: "Customer" },
  { key: "order", label: "Order Builder" },
  { key: "measurements", label: "Measurements" },
  { key: "checkout", label: "Checkout" },
] as const;

export const measurementDefaults = measurementFields.reduce<Record<string, string>>((accumulator, field) => {
  accumulator[field] = "";
  return accumulator;
}, {});

export function createInitialWorkflowDraft(): WorkflowDraft {
  return {
    orderType: null,
    activeWorkflow: null,
    linkedMeasurementSet: null,
    selectedCustomItem: null,
    selectedGarment: "",
    selectedMods: [],
    alterationItems: [],
    pickupDate: "",
    pickupTime: "",
    construction: null,
    bundleType: null,
    selectedBand: null,
    measurements: { ...measurementDefaults },
  };
}
