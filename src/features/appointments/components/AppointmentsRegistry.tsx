import { Mail, MapPin, MoreHorizontal, Phone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { EmptyState, Surface, StatusPill, cx } from "../../../components/ui/primitives";
import type { Appointment, Customer } from "../../../types";
import {
  getAppointmentConfirmationLabel,
  getAppointmentDateLabel,
  getAppointmentTimeLabel,
} from "../selectors";

export function AppointmentsRegistry({
  appointments,
  customers,
  onOpenReschedule,
  onConfirmAppointment,
  onCancelAppointment,
}: {
  appointments: Appointment[];
  customers: Customer[];
  onOpenReschedule: (appointment: Appointment) => void;
  onConfirmAppointment: (appointmentId: string) => void;
  onCancelAppointment: (appointment: Appointment) => void;
}) {
  const customerById = new Map(customers.map((customer) => [customer.id, customer]));
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!openMenuId) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenuId(null);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [openMenuId]);

  return appointments.length === 0 ? (
    <EmptyState>No appointments match this search and filter set.</EmptyState>
  ) : (
    <Surface tone="work" className="overflow-hidden">
      <div className="app-table-head grid gap-4 px-4 py-3 text-[11px] uppercase tracking-[0.12em] md:grid-cols-[152px_minmax(0,1.35fr)_116px_150px_128px_176px]">
        <div>Date and time</div>
        <div>Customer</div>
        <div>Visit</div>
        <div>Location</div>
        <div>Status</div>
        <div className="md:text-right">Actions</div>
      </div>

      {appointments.map((appointment, index) => {
        const customer = appointment.customerId ? customerById.get(appointment.customerId) : undefined;
        const confirmation = getAppointmentConfirmationLabel(appointment);
        const isWarn = confirmation === "Unconfirmed";
        const isActive = appointment.statusKey !== "completed" && appointment.statusKey !== "canceled";
        const showConfirm = confirmation === "Unconfirmed" && isActive;
        const showCancel = confirmation === "Confirmed" && isActive;
        const showMenu = isActive;
        const isMenuOpen = openMenuId === appointment.id;

        return (
          <div
            key={appointment.id}
            className={cx(
              "app-table-row grid gap-4 px-4 py-3.5 md:grid-cols-[152px_minmax(0,1.35fr)_116px_150px_128px_176px] md:items-center",
              index > 0 && "border-t border-[var(--app-border)]/35",
            )}
          >
            <div>
              <div className="app-text-body font-medium">{getAppointmentDateLabel(appointment)}</div>
              <div className="app-text-caption mt-1">{getAppointmentTimeLabel(appointment)}</div>
            </div>

            <div className="min-w-0">
              <div className="app-text-strong">{appointment.customer}</div>
              <div className="mt-1 space-y-1">
                {customer?.phone ? (
                  <div className="app-text-caption flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-[var(--app-text-soft)]" />
                    <span className="truncate">{customer.phone}</span>
                  </div>
                ) : null}
                {customer?.email ? (
                  <div className="app-text-caption flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-[var(--app-text-soft)]" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex items-center">
              <StatusPill
                tone={appointment.kind === "pickup" ? "dark" : "default"}
                className={
                  appointment.kind === "pickup"
                    ? "border-[color:rgb(191_219_254_/_0.2)] bg-[color:rgb(191_219_254_/_0.1)] text-[color:rgb(219_234_254)]"
                    : "border-[color:rgb(148_163_184_/_0.26)] bg-[color:rgb(148_163_184_/_0.08)] text-[color:rgb(226_232_240)]"
                }
              >
                {appointment.kind === "pickup" ? "Pickup" : "Appointment"}
              </StatusPill>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-[var(--app-text-soft)]" />
              <span className="app-text-body">{appointment.location}</span>
            </div>

            <div className="flex items-center">
              <StatusPill
                tone={confirmation === "Completed" ? "success" : confirmation === "Canceled" ? "danger" : "default"}
                className={
                  confirmation === "Unconfirmed"
                    ? "border-[color:rgb(245_158_11_/_0.28)] bg-[color:rgb(245_158_11_/_0.1)] text-[color:rgb(253_230_138)]"
                    : confirmation === "Confirmed"
                      ? "border-[color:rgb(52_211_153_/_0.22)] bg-[color:rgb(52_211_153_/_0.08)] text-[color:rgb(209_250_229)]"
                      : undefined
                }
              >
                {confirmation}
              </StatusPill>
            </div>

            <div className="relative flex items-center justify-end" ref={isMenuOpen ? menuRef : undefined}>
              {showMenu ? (
                <>
                  <button
                    type="button"
                    aria-label="Open appointment actions"
                    aria-expanded={isMenuOpen}
                    onClick={() => setOpenMenuId((current) => (current === appointment.id ? null : appointment.id))}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--app-radius-sm)] border border-[var(--app-border)]/60 bg-[var(--app-surface-muted)]/22 text-[var(--app-text-soft)] transition hover:border-[var(--app-border-strong)] hover:text-[var(--app-text)]"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  {isMenuOpen ? (
                    <div className="absolute right-0 top-[calc(100%+0.4rem)] z-20 min-w-[180px] rounded-[var(--app-radius-md)] border border-[var(--app-border)]/80 bg-[var(--app-surface-elevated)] p-1.5 shadow-lg">
                      <button
                        type="button"
                        className="flex w-full items-center rounded-[var(--app-radius-sm)] px-3 py-2 text-left text-sm text-[var(--app-text)] transition hover:bg-[var(--app-surface-muted)]/65"
                        onClick={() => {
                          setOpenMenuId(null);
                          onOpenReschedule(appointment);
                        }}
                      >
                        Edit
                      </button>
                      {showConfirm ? (
                        <button
                          type="button"
                          className="flex w-full items-center rounded-[var(--app-radius-sm)] px-3 py-2 text-left text-sm text-[var(--app-text)] transition hover:bg-[var(--app-surface-muted)]/65"
                          onClick={() => {
                            setOpenMenuId(null);
                            onConfirmAppointment(appointment.id);
                          }}
                        >
                          Confirm
                        </button>
                      ) : null}
                      {showCancel ? (
                        <button
                          type="button"
                          className="flex w-full items-center rounded-[var(--app-radius-sm)] px-3 py-2 text-left text-sm text-[var(--app-danger-text)] transition hover:bg-[var(--app-danger-bg)]/35"
                          onClick={() => {
                            setOpenMenuId(null);
                            onCancelAppointment(appointment);
                          }}
                        >
                          Cancel {appointment.kind === "pickup" ? "pickup" : "appointment"}
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="app-text-caption">{confirmation}</div>
              )}
            </div>
          </div>
        );
      })}
    </Surface>
  );
}
