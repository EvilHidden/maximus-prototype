import { useMemo, useState } from "react";
import type { Appointment, PickupLocation } from "../../../types";
import { getAppointmentDateKey } from "../../appointments/selectors";
import { getPickupAppointments, getTodayAppointments, getTomorrowAppointments } from "../selectors";

export const homeLocationOptions: PickupLocation[] = ["Fifth Avenue", "Queens", "Long Island"];

export function useHomeDashboard(appointments: Appointment[], pickupAppointments: Appointment[]) {
  const [activeLocations, setActiveLocations] = useState<PickupLocation[]>(homeLocationOptions);

  const filteredAppointments = useMemo(
    () => appointments.filter((appointment) => activeLocations.includes(appointment.location)),
    [activeLocations, appointments],
  );
  const filteredPickups = useMemo(
    () => pickupAppointments.filter((appointment) => activeLocations.includes(appointment.location)),
    [activeLocations, pickupAppointments],
  );

  const now = new Date();
  const todayAppointments = getTodayAppointments(filteredAppointments, now);
  const tomorrowAppointments = getTomorrowAppointments(filteredAppointments, now);

  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(now.getDate() + 1);
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });
  const todayLabel = dateFormatter.format(now);
  const tomorrowLabel = dateFormatter.format(tomorrowDate);
  const todayKey = now.toISOString().slice(0, 10);
  const tomorrowKey = tomorrowDate.toISOString().slice(0, 10);
  const todayPickups = filteredPickups.filter((appointment) => getAppointmentDateKey(appointment) === todayKey);
  const tomorrowPickups = filteredPickups.filter((appointment) => getAppointmentDateKey(appointment) === tomorrowKey);
  const allLocationsActive = activeLocations.length === homeLocationOptions.length;
  const visibleAppointmentCount = todayAppointments.length + tomorrowAppointments.length;
  const visiblePickupCount = todayPickups.length + tomorrowPickups.length;
  const hasVisibleHomeWork = visibleAppointmentCount > 0 || visiblePickupCount > 0;
  const hasAnyLocationSelected = activeLocations.length > 0;
  const hasFilteredLaterWork =
    filteredAppointments.length > visibleAppointmentCount || getPickupAppointments(filteredPickups).length > visiblePickupCount;
  const singleActiveLocationLabel = activeLocations.length === 1 ? activeLocations[0] : undefined;

  return {
    activeLocations,
    setActiveLocations,
    allLocationsActive,
    todayAppointments,
    tomorrowAppointments,
    todayPickups,
    tomorrowPickups,
    todayLabel,
    tomorrowLabel,
    visibleAppointmentCount,
    visiblePickupCount,
    hasVisibleHomeWork,
    hasAnyLocationSelected,
    hasFilteredLaterWork,
    singleActiveLocationLabel,
  };
}
