import type { Appointment, OpenOrder } from "../../types";

function formatPickupAppointmentTime(timeValue: string) {
  const [hours, minutes] = timeValue.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return timeValue;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTodayAppointments(appointments: Appointment[]) {
  const today = toDateKey(new Date());
  return appointments.filter((appointment) => appointment.date === today && appointment.kind === "appointment");
}

export function getTomorrowAppointments(appointments: Appointment[]) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return appointments.filter((appointment) => appointment.date === toDateKey(tomorrow) && appointment.kind === "appointment");
}

export function getPickupAppointments(appointments: Appointment[]) {
  return appointments.filter((appointment) => appointment.kind === "pickup");
}

export function getOpenOrderPickupAppointments(openOrders: OpenOrder[]): Appointment[] {
  return openOrders.flatMap((openOrder) =>
    openOrder.pickupSchedules
      .filter((pickup) => Boolean(pickup.pickupDate))
      .map((pickup) => ({
      id: `OPEN-${openOrder.id}-${pickup.id}`,
      date: pickup.pickupDate,
      time: formatPickupAppointmentTime(pickup.pickupTime),
      kind: "pickup" as const,
      location: pickup.pickupLocation || "Fifth Avenue",
      customerId: openOrder.payerCustomerId ?? undefined,
      customer: openOrder.payerName,
      type: pickup.label,
      pickupSummary: `${pickup.scope === "alteration" ? "Alterations" : "Custom"}: ${pickup.itemSummary.map((item) => item.replace(/^Alteration - |^Custom garment - /, "")).join(", ")}`,
      status: pickup.readyForPickup ? "Ready for pickup" : "Scheduled pickup",
      missing: "Complete",
      route: "pickup" as const,
      })),
  );
}
