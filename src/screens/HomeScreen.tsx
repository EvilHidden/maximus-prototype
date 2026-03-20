import { CalendarDays, Package, PanelLeft, Receipt, Ruler, UserPlus } from "lucide-react";
import { appointments } from "../data";
import type { Screen, WorkflowMode } from "../types";
import { ActionButton, Card, EntityRow, SectionHeader, StatusPill } from "../components/ui/primitives";
import { getPickupAppointments, getTodayAppointments, getTomorrowAppointments } from "../features/home/selectors";

type HomeScreenProps = {
  onScreenChange: (screen: Screen) => void;
  onStartWorkflow: (workflow: WorkflowMode) => void;
};

export function HomeScreen({ onScreenChange, onStartWorkflow }: HomeScreenProps) {
  const todayAppointments = getTodayAppointments(appointments);
  const tomorrowAppointments = getTomorrowAppointments(appointments);
  const pickups = getPickupAppointments(appointments);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <SectionHeader icon={PanelLeft} title="Front desk" subtitle="Core actions" />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <button onClick={() => onScreenChange("customer")} className="app-workflow-toggle app-quick-action flex min-h-[112px] flex-col">
            <UserPlus className="mb-2 h-5 w-5" />
            <div className="font-semibold">Customers</div>
          </button>
          <button onClick={() => onStartWorkflow("alteration")} className="app-workflow-toggle app-quick-action flex min-h-[112px] flex-col">
            <Receipt className="mb-2 h-5 w-5" />
            <div className="font-semibold">Alteration order</div>
          </button>
          <button onClick={() => onStartWorkflow("custom")} className="app-workflow-toggle app-quick-action flex min-h-[112px] flex-col">
            <Ruler className="mb-2 h-5 w-5" />
            <div className="font-semibold">Custom garment</div>
          </button>
          <button onClick={() => onScreenChange("checkout")} className="app-workflow-toggle app-quick-action flex min-h-[112px] flex-col">
            <Package className="mb-2 h-5 w-5" />
            <div className="font-semibold">Order pickup</div>
          </button>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-4">
          <SectionHeader icon={CalendarDays} title="Today" subtitle="Appointments" />
          <div className="space-y-2">
            {todayAppointments.map((appointment) => (
              <EntityRow
                key={appointment.id}
                title={
                  <div className="flex items-center gap-4">
                    <div className="w-20 text-sm font-medium text-[var(--app-text)]">{appointment.time}</div>
                    <div>
                      <div className="text-sm font-semibold text-[var(--app-text)]">{appointment.customer}</div>
                      <div className="text-xs text-[var(--app-text-muted)]">{appointment.type}</div>
                    </div>
                  </div>
                }
                meta={
                  <div className="flex items-center gap-2">
                    {appointment.missing !== "Complete" ? <StatusPill tone="warn">{appointment.missing}</StatusPill> : null}
                    <StatusPill>{appointment.status}</StatusPill>
                  </div>
                }
                action={
                  <ActionButton tone="secondary" className="px-3 py-2 text-xs" onClick={() => onScreenChange("customer")}>
                    Open
                  </ActionButton>
                }
              />
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <SectionHeader icon={CalendarDays} title="Tomorrow" subtitle="Appointments" />
          <div className="space-y-2">
            {tomorrowAppointments.map((appointment) => (
              <EntityRow
                key={appointment.id}
                title={
                  <div className="flex items-center gap-4">
                    <div className="w-20 text-sm font-medium text-[var(--app-text)]">{appointment.time}</div>
                    <div>
                      <div className="text-sm font-semibold text-[var(--app-text)]">{appointment.customer}</div>
                      <div className="text-xs text-[var(--app-text-muted)]">{appointment.type}</div>
                    </div>
                  </div>
                }
                meta={
                  <div className="flex items-center gap-2">
                    <StatusPill tone="warn">{appointment.missing}</StatusPill>
                    <StatusPill>{appointment.status}</StatusPill>
                  </div>
                }
                action={
                  <ActionButton tone="secondary" className="px-3 py-2 text-xs" onClick={() => onScreenChange("customer")}>
                    Prep
                  </ActionButton>
                }
              />
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <SectionHeader icon={Package} title="Order pickups" subtitle="Today and tomorrow" />
        <div className="space-y-2">
          {pickups.map((appointment) => (
            <EntityRow
              key={appointment.id}
              title={
                <div className="flex items-center gap-4">
                  <div className="w-20 text-sm font-medium text-[var(--app-text)]">{appointment.time}</div>
                  <div>
                    <div className="text-sm font-semibold text-[var(--app-text)]">{appointment.customer}</div>
                    <div className="text-xs text-[var(--app-text-muted)]">{appointment.type}</div>
                  </div>
                </div>
              }
              meta={
                <div className="flex items-center gap-2">
                  <StatusPill>{appointment.day === "today" ? "Today" : "Tomorrow"}</StatusPill>
                  {appointment.missing !== "Complete" ? <StatusPill tone="warn">{appointment.missing}</StatusPill> : null}
                  <StatusPill>{appointment.status}</StatusPill>
                </div>
              }
              action={
                <ActionButton tone="secondary" className="px-3 py-2 text-xs" onClick={() => onScreenChange("checkout")}>
                  Open
                </ActionButton>
              }
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
