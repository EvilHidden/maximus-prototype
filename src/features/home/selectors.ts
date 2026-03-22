import type { Appointment } from "../../types";
import { getAppointmentDateKey } from "../appointments/selectors";

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTodayAppointments(appointments: Appointment[], now = new Date()) {
  const today = toDateKey(now);
  return appointments.filter((appointment) => getAppointmentDateKey(appointment) === today && appointment.kind === "appointment");
}

export function getTomorrowAppointments(appointments: Appointment[], now = new Date()) {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return appointments.filter((appointment) => getAppointmentDateKey(appointment) === toDateKey(tomorrow) && appointment.kind === "appointment");
}

export function getPickupAppointments(appointments: Appointment[]) {
  return appointments.filter((appointment) => appointment.kind === "pickup");
}
