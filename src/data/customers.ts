import type { Customer, CustomerOrder, MeasurementSet } from "../types";

const baseValues = {
  "Back Length": "30",
  Shoulder: "18",
  Chest: "40.5",
  Stomach: "35.5",
  Seat: "39.5",
  Bicep: "14",
  "Sleeve Length": "25",
  Neck: "15.5",
  Waist: "34",
  Thigh: "23.5",
  Bottom: "15.5",
  Rise: "11",
  Length: "41.25",
  "Shirt Cuff Left": "8",
  "Shirt Cuff Right": "8",
};

const davidValues = {
  "Back Length": "29",
  Shoulder: "17.5",
  Chest: "38.5",
  Stomach: "33",
  Seat: "37.5",
  Bicep: "13.5",
  "Sleeve Length": "24.75",
  Neck: "15",
  Waist: "32",
  Thigh: "22.75",
  Bottom: "14.75",
  Rise: "10.75",
  Length: "40.25",
  "Shirt Cuff Left": "7.75",
  "Shirt Cuff Right": "7.75",
};

export const customers: Customer[] = [
  {
    id: "C-1042",
    name: "James Carter",
    phone: "(555) 201-9044",
    email: "james.carter@example.com",
    address: "14 E 61st St, New York, NY",
    preferredLocation: "Fifth Avenue",
    lastVisit: "Feb 28",
    measurementsStatus: "on_file",
    notes: "Prefers slim fit",
    isVip: true,
  },
  {
    id: "C-1078",
    name: "Maria Ellis",
    phone: "(555) 884-7712",
    email: "maria.ellis@example.com",
    address: "22-18 33rd Ave, Astoria, NY",
    preferredLocation: "Queens",
    lastVisit: "Mar 10",
    measurementsStatus: "missing",
    notes: "Wedding party order",
  },
  {
    id: "C-1116",
    name: "David Nguyen",
    phone: "(555) 490-1162",
    email: "d.nguyen@example.com",
    address: "48 Harbor Ln, Huntington, NY",
    preferredLocation: "Long Island",
    lastVisit: "Mar 14",
    measurementsStatus: "on_file",
    notes: "Rush alterations",
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

export const measurementSets: MeasurementSet[] = [
  {
    id: "SET-C1042-V4",
    customerId: "C-1042",
    label: "Version 4",
    note: "Latest on file",
    values: baseValues,
    suggested: true,
  },
  {
    id: "SET-C1042-V3",
    customerId: "C-1042",
    label: "Version 3",
    note: "Jan 22 • Tuxedo order",
    values: { ...baseValues, Chest: "40.25", Waist: "34.25", "Sleeve Length": "24.75" },
  },
  {
    id: "SET-C1042-V2",
    customerId: "C-1042",
    label: "Version 2",
    note: "Sep 14 • Alteration profile",
    values: { ...baseValues, Chest: "39.75", Waist: "33.75", "Back Length": "29.25" },
  },
  {
    id: "SET-C1116-V4",
    customerId: "C-1116",
    label: "Version 4",
    note: "Latest on file",
    values: davidValues,
    suggested: true,
  },
  {
    id: "SET-C1116-V3",
    customerId: "C-1116",
    label: "Version 3",
    note: "Rush suit baseline",
    values: { ...davidValues, Chest: "38.25", Waist: "31.75", Length: "40" },
  },
];
