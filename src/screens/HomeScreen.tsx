import {
  CheckSquare2,
  House,
  Package,
  Receipt,
  Ruler,
  Square,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import type { Appointment, Screen, WorkflowMode } from "../types";
import { SectionHeader, SelectionChip } from "../components/ui/primitives";
import { useToast } from "../components/ui/toast";
import { ConfirmAppointmentCancelModal } from "../features/appointments/components/ConfirmAppointmentCancelModal";
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
  const [cancelingAppointment, setCancelingAppointment] = useState<Appointment | null>(null);
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
      subtitle: "Find people",
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
      subtitle: "Start an alterations order",
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
      subtitle: "Start a custom order",
      icon: Ruler,
      iconStyle: {
        borderColor: "#93c5fd",
        backgroundColor: "#eff6ff",
        color: "#1d4ed8",
      },
      onClick: () => onStartWorkflow("custom"),
    },
    {
      label: "Orders",
      subtitle: "See active orders",
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
      <SectionHeader icon={House} title="Home" subtitle="What needs attention today" />

      <HomeQuickActionsDeck actions={actions} />

      <div className="px-1 py-1">
        <div className="flex flex-wrap items-center gap-4">
          <div className="shrink-0 pt-0.5">
            <div className="app-text-overline">View locations</div>
            <div className="app-text-caption mt-1">Choose which locations to show.</div>
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
          onCancelAppointment={setCancelingAppointment}
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
          detail="Later appointments and pickups are still scheduled. Open the full calendar or active orders to work ahead."
          primaryAction={{ label: "Open appointments", onClick: () => onScreenChange("appointments") }}
          secondaryAction={{ label: "Open all active orders", onClick: () => onScreenChange("openOrders") }}
        />
      ) : (
        <HomeEmptyState
          title="Nothing needs attention right now"
          detail="New fittings, consultations, and pickups will show up here once they are scheduled."
          primaryAction={{ label: "Open customers", onClick: () => onScreenChange("customer") }}
          secondaryAction={{ label: "Start alteration order", onClick: () => onStartWorkflow("alteration") }}
        />
      )}

      {cancelingAppointment ? (
        <ConfirmAppointmentCancelModal
          appointment={cancelingAppointment}
          onClose={() => setCancelingAppointment(null)}
          onConfirm={() => {
            onCancelAppointment(cancelingAppointment.id);
            showToast(`${cancelingAppointment.customer} canceled.`);
            setCancelingAppointment(null);
          }}
        />
      ) : null}
    </div>
  );
}
