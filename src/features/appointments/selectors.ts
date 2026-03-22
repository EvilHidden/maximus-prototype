import type {
  Appointment,
  AppointmentContextFlag,
  AppointmentPrepStatus,
  AppointmentProfileFlag,
} from "../../types";

function parseScheduledFor(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getAppointmentDateKey(appointment: Appointment) {
  const parsed = parseScheduledFor(appointment.scheduledFor);
  if (!parsed) {
    return appointment.scheduledFor.slice(0, 10);
  }

  const year = parsed.getFullYear();
  const month = `${parsed.getMonth() + 1}`.padStart(2, "0");
  const day = `${parsed.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getAppointmentTimeLabel(appointment: Appointment) {
  const parsed = parseScheduledFor(appointment.scheduledFor);
  if (!parsed) {
    return appointment.scheduledFor;
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

export function getAppointmentDateLabel(appointment: Appointment) {
  const parsed = parseScheduledFor(appointment.scheduledFor);
  if (!parsed) {
    return appointment.scheduledFor;
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(parsed);
}

export function getRelativeAppointmentDayLabel(appointment: Appointment, now = new Date()) {
  const parsed = parseScheduledFor(appointment.scheduledFor);
  if (!parsed) {
    return appointment.scheduledFor;
  }

  const target = new Date(parsed);
  target.setHours(12, 0, 0, 0);
  const today = new Date(now);
  today.setHours(12, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (target.toDateString() === today.toDateString()) {
    return "Today";
  }

  if (target.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  }

  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(target);
}

export function compareAppointments(left: Appointment, right: Appointment) {
  return left.scheduledFor.localeCompare(right.scheduledFor);
}

export function getAppointmentPrepStatusLabel(status: AppointmentPrepStatus) {
  switch (status) {
    case "ready":
      return "Ready";
    case "needs_profile":
      return "Needs profile";
    case "needs_measurements":
      return "Needs measurements";
    case "needs_materials":
      return "Needs materials";
    case "needs_review":
      return "Needs review";
  }
}

export function getAppointmentProfileFlagLabel(flag: AppointmentProfileFlag) {
  switch (flag) {
    case "missing_phone":
      return "Missing phone";
    case "missing_email":
      return "Missing email";
  }
}

export function getAppointmentContextFlagLabel(flag: AppointmentContextFlag) {
  switch (flag) {
    case "confirmed":
      return "Confirmed";
    case "unconfirmed":
      return "Unconfirmed";
    case "wedding":
      return "Wedding";
    case "prom":
      return "Prom";
    case "rush":
      return "Rush";
  }
}
