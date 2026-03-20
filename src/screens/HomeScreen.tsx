import { CalendarDays, Package, PanelLeft, Receipt, Ruler, UserPlus } from "lucide-react";
import { appointments } from "../data/fixtures";
import type { OrderType, Screen } from "../types";
import { ActionButton, Card, SectionHeader, StatusPill } from "../components/ui/primitives";

type HomeScreenProps = {
  onScreenChange: (screen: Screen) => void;
  onOrderTypeChange: (orderType: Exclude<OrderType, "mixed">) => void;
};

export function HomeScreen({ onScreenChange, onOrderTypeChange }: HomeScreenProps) {
  const todayAppointments = appointments.filter((appointment) => appointment.day === "today" && appointment.kind === "appointment");
  const tomorrowAppointments = appointments.filter((appointment) => appointment.day === "tomorrow" && appointment.kind === "appointment");
  const pickups = appointments.filter((appointment) => appointment.kind === "pickup");

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <SectionHeader icon={PanelLeft} title="Front desk" subtitle="Core actions" />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <button onClick={() => onScreenChange("customer")} className="flex min-h-[112px] flex-col rounded-2xl border border-slate-200 p-4 text-left hover:bg-slate-50">
            <UserPlus className="mb-2 h-5 w-5" />
            <div className="font-semibold">Customers</div>
          </button>
          <button onClick={() => {
            onOrderTypeChange("alteration");
            onScreenChange("order");
          }} className="flex min-h-[112px] flex-col rounded-2xl border border-slate-200 p-4 text-left hover:bg-slate-50">
            <Receipt className="mb-2 h-5 w-5" />
            <div className="font-semibold">Alteration order</div>
          </button>
          <button onClick={() => {
            onOrderTypeChange("custom");
            onScreenChange("order");
          }} className="flex min-h-[112px] flex-col rounded-2xl border border-slate-200 p-4 text-left hover:bg-slate-50">
            <Ruler className="mb-2 h-5 w-5" />
            <div className="font-semibold">Custom garment</div>
          </button>
          <button onClick={() => onScreenChange("checkout")} className="flex min-h-[112px] flex-col rounded-2xl border border-slate-200 p-4 text-left hover:bg-slate-50">
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
              <div key={`${appointment.day}-${appointment.time}-${appointment.customer}`} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                <div className="flex items-center gap-4">
                  <div className="w-20 text-sm font-medium text-slate-900">{appointment.time}</div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{appointment.customer}</div>
                    <div className="text-xs text-slate-500">{appointment.type}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {appointment.missing !== "Complete" ? <StatusPill tone="warn">{appointment.missing}</StatusPill> : null}
                  <StatusPill>{appointment.status}</StatusPill>
                  <ActionButton tone="secondary" className="px-3 py-2 text-xs" onClick={() => onScreenChange("customer")}>
                    Open
                  </ActionButton>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <SectionHeader icon={CalendarDays} title="Tomorrow" subtitle="Appointments" />
          <div className="space-y-2">
            {tomorrowAppointments.map((appointment) => (
              <div key={`${appointment.day}-${appointment.time}-${appointment.customer}`} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                <div className="flex items-center gap-4">
                  <div className="w-20 text-sm font-medium text-slate-900">{appointment.time}</div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{appointment.customer}</div>
                    <div className="text-xs text-slate-500">{appointment.type}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StatusPill tone="warn">{appointment.missing}</StatusPill>
                  <StatusPill>{appointment.status}</StatusPill>
                  <ActionButton tone="secondary" className="px-3 py-2 text-xs" onClick={() => onScreenChange("customer")}>
                    Prep
                  </ActionButton>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <SectionHeader icon={Package} title="Order pickups" subtitle="Today and tomorrow" />
        <div className="space-y-2">
          {pickups.map((appointment) => (
            <div key={`${appointment.day}-${appointment.time}-${appointment.customer}`} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
              <div className="flex items-center gap-4">
                <div className="w-20 text-sm font-medium text-slate-900">{appointment.time}</div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{appointment.customer}</div>
                  <div className="text-xs text-slate-500">{appointment.type}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <StatusPill>{appointment.day === "today" ? "Today" : "Tomorrow"}</StatusPill>
                {appointment.missing !== "Complete" ? <StatusPill tone="warn">{appointment.missing}</StatusPill> : null}
                <StatusPill>{appointment.status}</StatusPill>
                <ActionButton tone="secondary" className="px-3 py-2 text-xs" onClick={() => onScreenChange("checkout")}>
                  Open
                </ActionButton>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
