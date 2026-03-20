import type { Appointment } from "../../types";

export function getTodayAppointments(appointments: Appointment[]) {
  return appointments.filter((appointment) => appointment.day === "today" && appointment.kind === "appointment");
}

export function getTomorrowAppointments(appointments: Appointment[]) {
  return appointments.filter((appointment) => appointment.day === "tomorrow" && appointment.kind === "appointment");
}

export function getPickupAppointments(appointments: Appointment[]) {
  return appointments.filter((appointment) => appointment.kind === "pickup");
}
