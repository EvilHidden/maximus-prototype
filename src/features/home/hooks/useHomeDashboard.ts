import { useMemo, useState } from "react";
import type { Appointment, OpenOrder, PickupLocation } from "../../../types";
import { getReadyPickupQueue, getTodayAppointments, getTomorrowAppointments } from "../selectors";

export function useHomeDashboard(
  appointments: Appointment[],
  openOrders: OpenOrder[],
  locationOptions: PickupLocation[],
) {
  const [activeLocations, setActiveLocations] = useState<PickupLocation[]>(locationOptions);

  const filteredAppointments = useMemo(
    () => appointments.filter((appointment) => activeLocations.includes(appointment.location)),
    [activeLocations, appointments],
  );
  const readyPickups = useMemo(
    () => getReadyPickupQueue(openOrders).filter((pickup) => (
      pickup.pickupSchedule.pickupLocation !== "" && activeLocations.includes(pickup.pickupSchedule.pickupLocation)
    )),
    [activeLocations, openOrders],
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
  const allLocationsActive = activeLocations.length === locationOptions.length;
  const visibleAppointmentCount = todayAppointments.length + tomorrowAppointments.length;
  const visiblePickupCount = readyPickups.length;
  const hasVisibleHomeWork = visibleAppointmentCount > 0 || visiblePickupCount > 0;
  const hasAnyLocationSelected = activeLocations.length > 0;
  const hasFilteredLaterWork = filteredAppointments.length > visibleAppointmentCount;
  const singleActiveLocationLabel = activeLocations.length === 1 ? activeLocations[0] : undefined;

  return {
    activeLocations,
    setActiveLocations,
    locationOptions,
    allLocationsActive,
    todayAppointments,
    tomorrowAppointments,
    readyPickups,
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
