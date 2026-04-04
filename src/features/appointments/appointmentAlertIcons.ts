import { Mail, MapPin, Megaphone, Phone, Ruler, type LucideIcon } from "lucide-react";
import type { Appointment } from "../../types";
import {
  getAppointmentPrepFlagLabel,
  getAppointmentProfileFlagLabel,
} from "./selectors";

export type AppointmentAlertIconTone = "info" | "muted" | "danger";

export type AppointmentAlertIconDefinition = {
  key: string;
  label: string;
  Icon: LucideIcon;
  tone?: AppointmentAlertIconTone;
};

export function getAppointmentAlertIcons(
  appointment: Appointment,
): AppointmentAlertIconDefinition[] {
  const icons: AppointmentAlertIconDefinition[] = [];

  icons.push(
    ...appointment.prepFlags.map((flag) => ({
      key: flag,
      label: getAppointmentPrepFlagLabel(flag),
      Icon: Ruler,
      tone: "info" as const,
    })),
  );

  icons.push(
    ...appointment.profileFlags.map((flag) => {
      if (flag === "missing_email") {
        return {
          key: flag,
          label: getAppointmentProfileFlagLabel(flag),
          Icon: Mail,
          tone: "muted" as const,
        };
      }

      if (flag === "missing_phone") {
        return {
          key: flag,
          label: getAppointmentProfileFlagLabel(flag),
          Icon: Phone,
          tone: "muted" as const,
        };
      }

      if (flag === "missing_address") {
        return {
          key: flag,
          label: getAppointmentProfileFlagLabel(flag),
          Icon: MapPin,
          tone: "muted" as const,
        };
      }

      return {
        key: flag,
        label: getAppointmentProfileFlagLabel(flag),
        Icon: Megaphone,
        tone: "muted" as const,
      };
    }),
  );

  return icons;
}
