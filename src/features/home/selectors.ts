import type { Appointment, OpenOrder, OpenOrderPickup } from "../../types";
import { getAppointmentDateKey } from "../appointments/selectors";
import { getPickupDateTime } from "../order/orderDateUtils";

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getAppointmentSortValue(appointment: Appointment) {
  const parsed = new Date(appointment.scheduledFor);
  return Number.isNaN(parsed.getTime()) ? Number.MAX_SAFE_INTEGER : parsed.getTime();
}

function sortAppointmentsByScheduledFor(appointments: Appointment[]) {
  return [...appointments].sort((left, right) => getAppointmentSortValue(left) - getAppointmentSortValue(right));
}

export type ReadyPickupQueueItem = {
  key: string;
  openOrderId: number;
  openOrder: OpenOrder;
  payerName: string;
  orderType: OpenOrder["orderType"];
  itemSummary: OpenOrder["itemSummary"];
  pickupBalanceDue: number;
  paymentStatus: OpenOrder["paymentStatus"];
  pickupSchedule: OpenOrderPickup;
};

function getReadyPickupSortValue(pickupSchedule: OpenOrderPickup) {
  if (pickupSchedule.readyAt) {
    const readyAt = new Date(pickupSchedule.readyAt);
    if (!Number.isNaN(readyAt.getTime())) {
      return readyAt.getTime();
    }
  }

  const preferredPickupDateTime = getPickupDateTime(pickupSchedule.pickupDate, pickupSchedule.pickupTime);
  return preferredPickupDateTime ? preferredPickupDateTime.getTime() : Number.MAX_SAFE_INTEGER;
}

export function getTodayAppointments(appointments: Appointment[], now = new Date()) {
  const today = toDateKey(now);
  return sortAppointmentsByScheduledFor(
    appointments.filter((appointment) => getAppointmentDateKey(appointment) === today && appointment.kind === "appointment"),
  );
}

export function getTomorrowAppointments(appointments: Appointment[], now = new Date()) {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return sortAppointmentsByScheduledFor(
    appointments.filter((appointment) => getAppointmentDateKey(appointment) === toDateKey(tomorrow) && appointment.kind === "appointment"),
  );
}

export function getReadyPickupQueue(openOrders: OpenOrder[]) {
  return openOrders
    .flatMap<ReadyPickupQueueItem>((openOrder) => openOrder.pickupSchedules
      .filter((pickupSchedule) => pickupSchedule.readyForPickup && !pickupSchedule.pickedUp)
      .map((pickupSchedule) => ({
        key: `${openOrder.id}-${pickupSchedule.id}`,
        openOrderId: openOrder.id,
        openOrder,
        payerName: openOrder.payerName,
        orderType: openOrder.orderType,
        itemSummary: openOrder.itemSummary,
        pickupBalanceDue: openOrder.pickupBalanceDue ?? 0,
        paymentStatus: openOrder.paymentStatus,
        pickupSchedule,
      })))
    .sort((left, right) => getReadyPickupSortValue(left.pickupSchedule) - getReadyPickupSortValue(right.pickupSchedule));
}
