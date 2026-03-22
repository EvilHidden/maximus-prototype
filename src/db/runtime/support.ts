import type { PickupLocation } from "../../types";

export type RuntimeSeedDates = {
  baseDate: Date;
  liveReference: Date;
};

export function toDateString(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toDateTimeString(date: Date) {
  return `${toDateString(date)}T${`${date.getHours()}`.padStart(2, "0")}:${`${date.getMinutes()}`.padStart(2, "0")}:00`;
}

export function withOffset(base: Date, days: number, hours = 12, minutes = 0) {
  const next = new Date(base);
  next.setHours(hours, minutes, 0, 0);
  next.setDate(next.getDate() + days);
  return next;
}

export function withMinuteDelta(base: Date, minutes: number) {
  const next = new Date(base);
  next.setSeconds(0, 0);
  next.setMinutes(next.getMinutes() + minutes);
  return next;
}

export function createLocationId(location: PickupLocation) {
  return `loc_${location.toLowerCase().replace(/\s+/g, "_")}`;
}

export const baseValues = {
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

export const davidValues = {
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

export const andreaValues = {
  ...baseValues,
  Shoulder: "16.5",
  Chest: "36.5",
  Waist: "29.5",
  Seat: "38.25",
  "Sleeve Length": "23.75",
  Length: "40.75",
};

export const priyaValues = {
  ...baseValues,
  Shoulder: "17",
  Chest: "37.75",
  Waist: "30.25",
  Seat: "39",
  "Sleeve Length": "24",
  Length: "41",
};

export const sofiaValues = {
  ...baseValues,
  Shoulder: "16.75",
  Chest: "35.75",
  Waist: "28.75",
  Seat: "37.5",
  "Sleeve Length": "23.5",
  Length: "40.5",
};
