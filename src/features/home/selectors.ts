import type { Appointment } from "../../types";

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
