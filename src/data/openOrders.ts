import type { OpenOrder } from "../types";

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

function getDateTimeOffset(days: number, hours: number, minutes: number) {
  const date = new Date();
  date.setSeconds(0, 0);
  date.setHours(hours, minutes, 0, 0);
  date.setDate(date.getDate() + days);
  return `${toDateString(date)}T${`${hours}`.padStart(2, "0")}:${`${minutes}`.padStart(2, "0")}:00`;
}

export const openOrders: OpenOrder[] = [
  {
    id: 9001,
    payerCustomerId: "C-1042",
    payerName: "James Carter",
    orderType: "custom",
    itemCount: 1,
    itemSummary: ["Two-piece suit"],
    pickupSchedules: [
      {
        id: "OPEN-9001-custom",
        scope: "custom",
        label: "Custom pickup",
        itemSummary: ["Two-piece suit"],
        itemCount: 1,
        pickupDate: getDateOffset(1),
        pickupTime: "3:00 PM",
        pickupLocation: "Fifth Avenue",
        eventType: "wedding",
        eventDate: getDateOffset(18),
        readyForPickup: false,
      },
    ],
    paymentStatus: "prepaid",
    collectedToday: 747.5,
    total: 1627.22,
    createdAt: getDateTimeOffset(-2, 11, 20),
  },
  {
    id: 9002,
    payerCustomerId: "C-1078",
    payerName: "Maria Ellis",
    orderType: "alteration",
    itemCount: 2,
    itemSummary: ["Dress hem", "Vest waist suppression"],
    pickupSchedules: [
      {
        id: "OPEN-9002-alteration",
        scope: "alteration",
        label: "Alteration pickup",
        itemSummary: ["Dress hem", "Vest waist suppression"],
        itemCount: 2,
        pickupDate: getDateOffset(0),
        pickupTime: "5:30 PM",
        pickupLocation: "Queens",
        eventType: "none",
        eventDate: "",
        readyForPickup: true,
      },
    ],
    paymentStatus: "pay_later",
    collectedToday: 0,
    total: 347.8,
    createdAt: getDateTimeOffset(-1, 14, 5),
  },
  {
    id: 9003,
    payerCustomerId: "C-1116",
    payerName: "David Nguyen",
    orderType: "mixed",
    itemCount: 3,
    itemSummary: ["Trouser taper", "Dinner jacket", "Vest"],
    pickupSchedules: [
      {
        id: "OPEN-9003-alteration",
        scope: "alteration",
        label: "Alteration pickup",
        itemSummary: ["Trouser taper"],
        itemCount: 1,
        pickupDate: getDateOffset(-1),
        pickupTime: "1:00 PM",
        pickupLocation: "Long Island",
        eventType: "none",
        eventDate: "",
        readyForPickup: false,
      },
      {
        id: "OPEN-9003-custom",
        scope: "custom",
        label: "Custom pickup",
        itemSummary: ["Dinner jacket", "Vest"],
        itemCount: 2,
        pickupDate: getDateOffset(4),
        pickupTime: "12:30 PM",
        pickupLocation: "Long Island",
        eventType: "prom",
        eventDate: getDateOffset(11),
        readyForPickup: false,
      },
    ],
    paymentStatus: "prepaid",
    collectedToday: 1080,
    total: 2356.85,
    createdAt: getDateTimeOffset(-4, 9, 45),
  },
  {
    id: 9004,
    payerCustomerId: null,
    payerName: "Walk-in customer",
    orderType: "alteration",
    itemCount: 1,
    itemSummary: ["Pant hem"],
    pickupSchedules: [
      {
        id: "OPEN-9004-alteration",
        scope: "alteration",
        label: "Alteration pickup",
        itemSummary: ["Pant hem"],
        itemCount: 1,
        pickupDate: getDateOffset(2),
        pickupTime: "11:00 AM",
        pickupLocation: "Fifth Avenue",
        eventType: "none",
        eventDate: "",
        readyForPickup: false,
      },
    ],
    paymentStatus: "pay_later",
    collectedToday: 0,
    total: 54.45,
    createdAt: getDateTimeOffset(0, 16, 10),
  },
];
