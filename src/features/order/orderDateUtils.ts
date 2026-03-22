function getCurrentCalendarDate(now = new Date()) {
  const today = new Date(now);
  today.setHours(12, 0, 0, 0);
  return today;
}

export function formatDateLabel(value: string) {
  if (!value) {
    return value;
  }

  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

export function normalizePickupTime(timeValue: string) {
  if (/^\d{2}:\d{2}$/.test(timeValue)) {
    return timeValue;
  }

  const match = timeValue.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    return null;
  }

  const [, rawHour, minute, meridiem] = match;
  let hour = Number(rawHour);
  if (Number.isNaN(hour)) {
    return null;
  }

  const isPm = meridiem.toUpperCase() === "PM";
  if (isPm && hour !== 12) {
    hour += 12;
  }

  if (!isPm && hour === 12) {
    hour = 0;
  }

  return `${String(hour).padStart(2, "0")}:${minute}`;
}

export function getPickupDateTime(dateValue: string, timeValue: string) {
  const normalizedTime = normalizePickupTime(timeValue);
  if (!dateValue || !normalizedTime) {
    return null;
  }

  const dateTime = new Date(`${dateValue}T${normalizedTime}`);
  return Number.isNaN(dateTime.getTime()) ? null : dateTime;
}

export function isToday(dateValue: string, now = new Date()) {
  const target = new Date(`${dateValue}T12:00:00`);
  const today = getCurrentCalendarDate(now);
  return target.toDateString() === today.toDateString();
}

export function isTomorrow(dateValue: string, now = new Date()) {
  const target = new Date(`${dateValue}T12:00:00`);
  const tomorrow = getCurrentCalendarDate(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return target.toDateString() === tomorrow.toDateString();
}
