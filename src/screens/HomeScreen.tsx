import {
  CheckSquare2,
  House,
  Package,
  Receipt,
  Ruler,
  Square,
  UserPlus,
} from "lucide-react";
import type { Appointment, Screen, WorkflowMode } from "../types";
import { SectionHeader, SelectionChip } from "../components/ui/primitives";
import { useToast } from "../components/ui/toast";
import { HomeEmptyState, HomeWorkboards } from "../features/home/components/HomeScheduleBoards";
import { HomeQuickActionsDeck } from "../features/home/components/HomeQuickActionsDeck";
import { useHomeDashboard } from "../features/home/hooks/useHomeDashboard";

type HomeScreenProps = {
  appointments: Appointment[];
  pickupAppointments: Appointment[];
  pickupLocations: import("../types").PickupLocation[];
  onScreenChange: (screen: Screen) => void;
  onStartWorkflow: (workflow: WorkflowMode) => void;
  onOpenAppointment: (appointment: Appointment) => void;
  onCancelAppointment: (appointmentId: string) => void;
};

export function HomeScreen({
  appointments,
  pickupAppointments,
  pickupLocations,
  onScreenChange,
  onStartWorkflow,
  onOpenAppointment,
  onCancelAppointment,
}: HomeScreenProps) {
  const { showToast } = useToast();
  const {
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
  } = useHomeDashboard(appointments, pickupAppointments, pickupLocations);

  const actions = [
    {
      label: "Customers",
      subtitle: "Search profiles and start front-desk work",
      icon: UserPlus,
      iconStyle: {
        borderColor: "#d8b4fe",
        backgroundColor: "#faf5ff",
        color: "#7e22ce",
      },
      onClick: () => onScreenChange("customer"),
    },
    {
      label: "Alteration order",
      subtitle: "Start intake and capture services",
      icon: Receipt,
      iconStyle: {
        borderColor: "#fdba74",
        backgroundColor: "#fff7ed",
        color: "#c2410c",
      },
      onClick: () => onStartWorkflow("alteration"),
    },
    {
      label: "Custom garment",
      subtitle: "Open measurements and build flow",
      icon: Ruler,
      iconStyle: {
        borderColor: "#93c5fd",
        backgroundColor: "#eff6ff",
        color: "#1d4ed8",
      },
      onClick: () => onStartWorkflow("custom"),
    },
    {
      label: "Order pickup",
      subtitle: "Prepare checkout and release orders",
      icon: Package,
      iconStyle: {
        borderColor: "#86efac",
        backgroundColor: "#f0fdf4",
        color: "#15803d",
      },
      onClick: () => onScreenChange("openOrders"),
    },
  ];

  return (
    <div className="space-y-4">
      <SectionHeader icon={House} title="Home" subtitle="Front-of-house operations" />

      <HomeQuickActionsDeck actions={actions} />

      <div className="px-1 py-1">
        <div className="flex flex-wrap items-center gap-4">
          <div className="shrink-0 pt-0.5">
            <div className="app-text-overline">View locations</div>
            <div className="app-text-caption mt-1">Filter appointments and pickups.</div>
          </div>
          <div className="flex min-w-[15rem] flex-1 flex-wrap gap-1.5">
            <SelectionChip
              selected={allLocationsActive}
              onClick={() => setActiveLocations(allLocationsActive ? [] : pickupLocations)}
              leading={allLocationsActive ? <CheckSquare2 className="h-4 w-4" /> : <Square className="h-4 w-4" />}
              size="sm"
            >
              All locations
            </SelectionChip>
            {pickupLocations.map((location) => {
              const isActive = activeLocations.includes(location);

              return (
                <SelectionChip
                  key={location}
                  selected={isActive}
                  onClick={() => {
                    setActiveLocations((current) => {
                      if (current.includes(location)) {
                        return current.filter((value) => value !== location);
                      }

                      return [...current, location];
                    });
                  }}
                  leading={isActive ? <CheckSquare2 className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                  size="sm"
                >
                  {location}
                </SelectionChip>
              );
            })}
          </div>
        </div>
      </div>

      {hasVisibleHomeWork ? (
        <HomeWorkboards
          visibleAppointmentCount={visibleAppointmentCount}
          visiblePickupCount={visiblePickupCount}
          todayLabel={todayLabel}
          tomorrowLabel={tomorrowLabel}
          todayAppointments={todayAppointments}
          tomorrowAppointments={tomorrowAppointments}
          todayPickups={todayPickups}
          tomorrowPickups={tomorrowPickups}
          singleActiveLocationLabel={singleActiveLocationLabel}
          onCreateOrder={onOpenAppointment}
          onCancelAppointment={(appointment) => {
            onCancelAppointment(appointment.id);
            showToast(`${appointment.customer} canceled.`);
          }}
          onCheckoutPickup={() => onScreenChange("openOrders")}
          onEditPickup={() => onScreenChange("openOrders")}
        />
      ) : !hasAnyLocationSelected ? (
        <HomeEmptyState
          title="No locations selected"
          detail="Choose at least one location to bring appointments and pickups back into view."
          primaryAction={{ label: "Show all locations", onClick: () => setActiveLocations(pickupLocations) }}
        />
      ) : hasFilteredLaterWork ? (
        <HomeEmptyState
          title="Nothing scheduled for today or tomorrow"
          detail="Later appointments and pickups are still in the system. Open the full schedule or order registry to work ahead."
          primaryAction={{ label: "Open appointments", onClick: () => onScreenChange("appointments") }}
          secondaryAction={{ label: "Open order registry", onClick: () => onScreenChange("openOrders") }}
        />
      ) : (
        <HomeEmptyState
          title="No front-desk work is queued"
          detail="New fittings, consults, and pickups will appear here once they are scheduled."
          primaryAction={{ label: "Open customers", onClick: () => onScreenChange("customer") }}
          secondaryAction={{ label: "Start alteration order", onClick: () => onStartWorkflow("alteration") }}
        />
      )}
    </div>
  );
}
