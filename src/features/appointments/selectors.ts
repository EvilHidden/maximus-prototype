import type {
  Appointment,
  AppointmentContextFlag,
  AppointmentPrepFlag,
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

export function getAppointmentVisitLabel(appointment: Appointment) {
  return appointment.type;
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

export function isActiveAppointment(appointment: Appointment) {
  return appointment.statusKey !== "canceled" && appointment.statusKey !== "completed";
}

export function filterActiveAppointments(appointments: Appointment[]) {
  return appointments.filter(isActiveAppointment);
}

export function filterServiceAppointments(appointments: Appointment[]) {
  return appointments.filter((appointment) => appointment.kind === "appointment");
}

export function getAppointmentPrepFlagLabel(flag: AppointmentPrepFlag) {
  switch (flag) {
    case "needs_measurements":
      return "Needs measurements";
  }
}

export function getAppointmentProfileFlagLabel(flag: AppointmentProfileFlag) {
  switch (flag) {
    case "missing_phone":
      return "Missing phone";
    case "missing_email":
      return "Missing email";
    case "missing_address":
      return "Missing address";
    case "needs_marketing_opt_in":
      return "Needs marketing opt-in";
  }
}

export function getAppointmentContextFlagLabel(flag: AppointmentContextFlag) {
  switch (flag) {
    case "confirmed":
      return "Confirmed";
    case "unconfirmed":
      return "Unconfirmed";
  }
}

export function getAppointmentAttentionLabel(appointment: Appointment) {
  if (appointment.statusKey === "completed") {
    return "Completed";
  }

  if (appointment.statusKey === "canceled") {
    return "Canceled";
  }

  if (appointment.contextFlags.includes("unconfirmed")) {
    return "Unconfirmed";
  }

  if (appointment.contextFlags.includes("confirmed")) {
    return "Confirmed";
  }

  return appointment.status;
}

export function getAppointmentConfirmationLabel(appointment: Appointment) {
  if (appointment.statusKey === "completed") {
    return "Completed";
  }

  if (appointment.statusKey === "canceled") {
    return "Canceled";
  }

  if (appointment.contextFlags.includes("unconfirmed")) {
    return "Unconfirmed";
  }

  return "Confirmed";
}

export function getAppointmentSearchText(appointment: Appointment) {
  return [
    appointment.customer,
    appointment.location,
    appointment.kind,
    appointment.type,
    getAppointmentVisitLabel(appointment),
    appointment.pickupSummary ?? "",
    appointment.status,
    ...appointment.prepFlags.map(getAppointmentPrepFlagLabel),
    ...appointment.profileFlags.map(getAppointmentProfileFlagLabel),
    ...appointment.contextFlags.map(getAppointmentContextFlagLabel),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
