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
import type { Appointment, OpenOrder, Screen, WorkflowMode } from "../types";
import { SectionHeader, SelectionChip } from "../components/ui/primitives";
import { useToast } from "../components/ui/toast";
import { ConfirmAppointmentCancelModal } from "../features/appointments/components/ConfirmAppointmentCancelModal";
import { HomeEmptyState, HomeWorkboards } from "../features/home/components/HomeScheduleBoards";
import { HomeQuickActionsDeck } from "../features/home/components/HomeQuickActionsDeck";
import { useHomeDashboard } from "../features/home/hooks/useHomeDashboard";

type HomeScreenProps = {
  appointments: Appointment[];
  openOrders: OpenOrder[];
  pickupLocations: import("../types").PickupLocation[];
  onScreenChange: (screen: Screen) => void;
  onStartWorkflow: (workflow: WorkflowMode) => void;
  onOpenAppointment: (appointment: Appointment) => void;
  onCancelAppointment: (appointmentId: string) => void;
  onCheckoutReadyPickup: (openOrderId: number) => void;
  onCompleteReadyPickup: (openOrderId: number) => void;
};

export function HomeScreen({
  appointments,
  openOrders,
  pickupLocations,
  onScreenChange,
  onStartWorkflow,
  onOpenAppointment,
  onCancelAppointment,
  onCheckoutReadyPickup,
  onCompleteReadyPickup,
}: HomeScreenProps) {
  const { showToast } = useToast();
  const [cancelingAppointment, setCancelingAppointment] = useState<Appointment | null>(null);
  const {
    activeLocations,
    setActiveLocations,
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
  } = useHomeDashboard(appointments, openOrders, pickupLocations);

  const actions = [
    {
      label: "Customers",
      subtitle: "Find people",
      icon: UserPlus,
      iconStyle: {
        borderColor: "var(--app-border-strong)",
        backgroundColor: "var(--app-surface-muted)",
        color: "var(--app-text)",
      },
      onClick: () => onScreenChange("customer"),
    },
    {
      label: "Alteration order",
      subtitle: "Start an alterations order",
      icon: Receipt,
      iconStyle: {
        borderColor: "var(--app-warn-border)",
        backgroundColor: "var(--app-warn-bg)",
        color: "var(--app-warn-text)",
      },
      onClick: () => onStartWorkflow("alteration"),
    },
    {
      label: "Custom garment",
      subtitle: "Start a custom order",
      icon: Ruler,
      iconStyle: {
        borderColor: "var(--app-info-border)",
        backgroundColor: "var(--app-info-bg)",
        color: "var(--app-info-text)",
      },
      onClick: () => onStartWorkflow("custom"),
    },
    {
      label: "Orders",
      subtitle: "See active orders",
      icon: Package,
      iconStyle: {
        borderColor: "var(--app-success-border)",
        backgroundColor: "var(--app-success-bg)",
        color: "var(--app-success-text)",
      },
      onClick: () => onScreenChange("openOrders"),
    },
  ];

  return (
    <div className="space-y-4">
      <SectionHeader icon={House} title="Home" subtitle="What needs attention today" />

      <HomeQuickActionsDeck actions={actions} />

      <div className="px-1 py-1">
        <div className="app-home-location-bar">
          <div className="shrink-0 pt-0.5">
            <div className="app-text-overline">View locations</div>
            <div className="app-text-caption mt-1">Choose which locations to show.</div>
          </div>
          <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
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
          readyPickups={readyPickups}
          singleActiveLocationLabel={singleActiveLocationLabel}
          onCreateOrder={onOpenAppointment}
          onCancelAppointment={setCancelingAppointment}
          onCheckoutPickup={onCheckoutReadyPickup}
          onCompletePickup={onCompleteReadyPickup}
        />
      ) : !hasAnyLocationSelected ? (
        <HomeEmptyState
          title="No locations selected"
          detail="Choose at least one location to bring appointments and ready pickups back into view."
          primaryAction={{ label: "Show all locations", onClick: () => setActiveLocations(pickupLocations) }}
        />
      ) : hasFilteredLaterWork ? (
        <HomeEmptyState
          title="Nothing scheduled for today or tomorrow"
          detail="Later appointments are still scheduled. Open the full calendar or active orders to work ahead."
          primaryAction={{ label: "Open appointments", onClick: () => onScreenChange("appointments") }}
          secondaryAction={{ label: "Open all active orders", onClick: () => onScreenChange("openOrders") }}
        />
      ) : (
        <HomeEmptyState
          title="Nothing needs attention right now"
          detail="New fittings and ready pickups will show up here once they need attention."
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
            showToast(`${cancelingAppointment.customer} canceled.`, {
              title: "Appointment canceled",
              tone: "warning",
            });
            setCancelingAppointment(null);
          }}
        />
      ) : null}
    </div>
  );
}
