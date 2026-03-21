import type { Appointment } from "../types";

function toDateString(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateOffset(days: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return toDateString(date);
}

export const appointments: Appointment[] = [
  {
    id: "APT-1001",
    date: getDateOffset(0),
    time: "9:30 AM",
    kind: "appointment",
    location: "Fifth Avenue",
    customerId: "C-1078",
    customer: "Maria Ellis",
    type: "Alteration fitting",
    status: "Ready to check in",
    missing: "Email missing",
    route: "alteration",
  },
  {
    id: "APT-1002",
    date: getDateOffset(0),
    time: "11:00 AM",
    kind: "appointment",
    location: "Queens",
    customerId: "C-1042",
    customer: "James Carter",
    type: "Custom suit consult",
    status: "Upcoming",
    missing: "Complete",
    route: "custom",
  },
  {
    id: "APT-1003",
    date: getDateOffset(0),
    time: "2:15 PM",
    kind: "pickup",
    location: "Long Island",
    customerId: "C-1116",
    customer: "David Nguyen",
    type: "Pickup appointment",
    pickupSummary: "Alterations: jeans, pants • Custom: shirt",
    status: "Due for pickup today",
    missing: "Phone missing",
    route: "pickup",
  },
  {
    id: "APT-1004",
    date: getDateOffset(1),
    time: "10:00 AM",
    kind: "appointment",
    location: "Fifth Avenue",
    customer: "Andrea Brooks",
    type: "First fitting",
    status: "Prep ticket",
    missing: "Measurements to review",
    route: "alteration",
  },
  {
    id: "APT-1005",
    date: getDateOffset(1),
    time: "1:30 PM",
    kind: "appointment",
    location: "Queens",
    customer: "Noah Bennett",
    type: "Custom jacket consult",
    status: "Upcoming",
    missing: "Fabric swatches",
    route: "custom",
  },
  {
    id: "APT-1006",
    date: getDateOffset(1),
    time: "4:00 PM",
    kind: "pickup",
    location: "Fifth Avenue",
    customerId: "C-1078",
    customer: "Maria Ellis",
    type: "Wedding party pickup",
    pickupSummary: "Alterations: dress, vest • Custom: jacket",
    status: "Prep for tomorrow",
    missing: "Bag and tag",
    route: "pickup",
  },
  {
    id: "APT-1007",
    date: getDateOffset(4),
    time: "12:00 PM",
    kind: "appointment",
    location: "Long Island",
    customerId: "C-1116",
    customer: "David Nguyen",
    type: "Trouser fitting",
    status: "Upcoming",
    missing: "Complete",
    route: "alteration",
  },
  {
    id: "APT-1008",
    date: getDateOffset(7),
    time: "3:30 PM",
    kind: "appointment",
    location: "Queens",
    customerId: "C-1042",
    customer: "James Carter",
    type: "Jacket fitting",
    status: "Upcoming",
    missing: "Button confirmation",
    route: "custom",
  },
  {
    id: "APT-1009",
    date: getDateOffset(10),
    time: "1:00 PM",
    kind: "pickup",
    location: "Long Island",
    customer: "Andrea Brooks",
    type: "Alteration pickup",
    pickupSummary: "Alterations: pants, shirt",
    status: "Upcoming pickup",
    missing: "Receipt match",
    route: "pickup",
  },
];
