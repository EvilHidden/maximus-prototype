import type { PrototypeDatabase } from "../schema";
import type { CreateAppointmentPayload, RescheduleAppointmentPayload, UpdateAppointmentPayload } from "./shared";
import {
  deriveOrderStatus,
  getAppointmentWorkflow,
  getLocationId,
  getScopeIdFromAppointment,
  toDateTimeString,
} from "./shared";

export function createManualAppointmentRecord(
  database: PrototypeDatabase,
  payload: CreateAppointmentPayload,
  now = new Date(),
): PrototypeDatabase {
  const customer = database.customers.find((candidate) => candidate.id === payload.customerId);
  if (!customer) {
    return database;
  }

  const appointmentCount = database.serviceAppointments.length + 1;

  return {
    ...database,
    serviceAppointments: [
      {
        id: `apt-manual-${appointmentCount}`,
        customerId: customer.id,
        orderId: null,
        scopeId: null,
        scopeLineId: null,
        customerName: customer.name,
        workflow: getAppointmentWorkflow(payload.typeKey),
        locationId: getLocationId(payload.location),
        scheduledFor: payload.scheduledFor,
        source: "manual",
        durationMinutes: 30,
        typeKey: payload.typeKey,
        statusKey: "scheduled",
        confirmationStatus: "unconfirmed",
        rush: false,
      },
      ...database.serviceAppointments,
    ],
    generatedAt: toDateTimeString(now),
  };
}

export function rescheduleAppointmentRecord(
  database: PrototypeDatabase,
  payload: RescheduleAppointmentPayload,
  now = new Date(),
): PrototypeDatabase {
  const serviceAppointment = database.serviceAppointments.find((appointment) => appointment.id === payload.appointmentId);
  if (serviceAppointment) {
    return {
      ...database,
      serviceAppointments: database.serviceAppointments.map((appointment) => (
        appointment.id === payload.appointmentId
          ? {
              ...appointment,
              locationId: getLocationId(payload.location),
              scheduledFor: payload.scheduledFor,
              statusKey: "scheduled",
            }
          : appointment
      )),
      generatedAt: toDateTimeString(now),
    };
  }

  const pickupAppointment = database.pickupAppointments.find((appointment) => appointment.id === payload.appointmentId);
  if (!pickupAppointment) {
    return database;
  }

  return {
    ...database,
    pickupAppointments: database.pickupAppointments.map((appointment) => (
      appointment.id === payload.appointmentId
        ? {
            ...appointment,
            locationId: getLocationId(payload.location),
            scheduledFor: payload.scheduledFor,
            statusKey: "scheduled",
          }
        : appointment
    )),
    generatedAt: toDateTimeString(now),
  };
}

export function updateAppointmentRecord(
  database: PrototypeDatabase,
  payload: UpdateAppointmentPayload,
  now = new Date(),
): PrototypeDatabase {
  const serviceAppointment = database.serviceAppointments.find((appointment) => appointment.id === payload.appointmentId);
  if (serviceAppointment) {
    const customer = database.customers.find((candidate) => candidate.id === payload.customerId);
    if (!customer || payload.typeKey === "pickup") {
      return database;
    }
    const serviceTypeKey = payload.typeKey;

    return {
      ...database,
      serviceAppointments: database.serviceAppointments.map((appointment) => (
        appointment.id === payload.appointmentId
          ? {
              ...appointment,
              customerId: customer.id,
              customerName: customer.name,
              workflow: getAppointmentWorkflow(serviceTypeKey),
              typeKey: serviceTypeKey,
              locationId: getLocationId(payload.location),
              scheduledFor: payload.scheduledFor,
              confirmationStatus: payload.confirmationStatus,
            }
          : appointment
      )),
      generatedAt: toDateTimeString(now),
    };
  }

  const pickupAppointment = database.pickupAppointments.find((appointment) => appointment.id === payload.appointmentId);
  if (!pickupAppointment) {
    return database;
  }

  return {
    ...database,
    pickupAppointments: database.pickupAppointments.map((appointment) => (
      appointment.id === payload.appointmentId
        ? {
            ...appointment,
            customerId: payload.customerId,
            locationId: getLocationId(payload.location),
            scheduledFor: payload.scheduledFor,
            confirmationStatus: payload.confirmationStatus,
          }
        : appointment
    )),
    generatedAt: toDateTimeString(now),
  };
}

export function confirmAppointmentRecord(
  database: PrototypeDatabase,
  appointmentId: string,
  now = new Date(),
): PrototypeDatabase {
  const serviceAppointment = database.serviceAppointments.find((appointment) => appointment.id === appointmentId);
  if (serviceAppointment) {
    return {
      ...database,
      serviceAppointments: database.serviceAppointments.map((appointment) => (
        appointment.id === appointmentId
          ? {
              ...appointment,
              confirmationStatus: "confirmed",
            }
          : appointment
      )),
      generatedAt: toDateTimeString(now),
    };
  }

  const pickupAppointment = database.pickupAppointments.find((appointment) => appointment.id === appointmentId);
  if (!pickupAppointment) {
    return database;
  }

  return {
    ...database,
    pickupAppointments: database.pickupAppointments.map((appointment) => (
      appointment.id === appointmentId
        ? {
            ...appointment,
            confirmationStatus: "confirmed",
          }
        : appointment
    )),
    generatedAt: toDateTimeString(now),
  };
}

export function completeAppointmentRecord(
  database: PrototypeDatabase,
  appointmentId: string,
  now = new Date(),
): PrototypeDatabase {
  const serviceAppointment = database.serviceAppointments.find((appointment) => appointment.id === appointmentId);
  if (serviceAppointment) {
    return {
      ...database,
      serviceAppointments: database.serviceAppointments.map((appointment) => (
        appointment.id === appointmentId
          ? {
              ...appointment,
              statusKey: "completed",
            }
          : appointment
      )),
      generatedAt: toDateTimeString(now),
    };
  }

  const pickupAppointment = database.pickupAppointments.find((appointment) => appointment.id === appointmentId);
  if (!pickupAppointment) {
    return database;
  }

  const nextDatabase = {
    ...database,
    pickupAppointments: database.pickupAppointments.map((appointment) => (
      appointment.id === appointmentId
        ? {
            ...appointment,
            statusKey: "completed" as const,
          }
        : appointment
    )),
  };

  if (!pickupAppointment.scopeId) {
    return {
      ...nextDatabase,
      generatedAt: toDateTimeString(now),
    };
  }

  const nextScopes = nextDatabase.orderScopes.map((scope) => (
    scope.id === pickupAppointment.scopeId
      ? {
          ...scope,
          phase: "picked_up" as const,
          readyAt: scope.readyAt ?? toDateTimeString(now),
          pickedUpAt: toDateTimeString(now),
        }
      : scope
  ));

  return {
    ...nextDatabase,
    orderScopes: nextScopes,
    orders: nextDatabase.orders.map((order) => (
      order.id === pickupAppointment.orderId
        ? {
            ...order,
            status: deriveOrderStatus(nextScopes.filter((scope) => scope.orderId === order.id)),
          }
        : order
    )),
    generatedAt: toDateTimeString(now),
  };
}

export function cancelAppointmentRecord(
  database: PrototypeDatabase,
  appointmentId: string,
  now = new Date(),
): PrototypeDatabase {
  const serviceAppointment = database.serviceAppointments.find((appointment) => appointment.id === appointmentId);
  if (serviceAppointment) {
    return {
      ...database,
      serviceAppointments: database.serviceAppointments.map((appointment) => (
        appointment.id === appointmentId
          ? {
              ...appointment,
              statusKey: "canceled",
            }
          : appointment
      )),
      generatedAt: toDateTimeString(now),
    };
  }

  const pickupScopeId = getScopeIdFromAppointment(database, appointmentId);
  const nextScopes = pickupScopeId
    ? database.orderScopes.map((scope) => (
        scope.id === pickupScopeId && scope.phase === "ready"
          ? {
              ...scope,
              phase: "in_progress" as const,
              pickedUpAt: null,
            }
          : scope
      ))
    : database.orderScopes;
  const pickupAppointment = database.pickupAppointments.find((appointment) => appointment.id === appointmentId);

  return {
    ...database,
    pickupAppointments: database.pickupAppointments.map((appointment) => (
      appointment.id === appointmentId
        ? {
            ...appointment,
            statusKey: "canceled" as const,
          }
        : appointment
    )),
    orderScopes: nextScopes,
    orders: pickupAppointment?.orderId
      ? database.orders.map((order) => (
          order.id === pickupAppointment.orderId
            ? {
                ...order,
                status: deriveOrderStatus(nextScopes.filter((scope) => scope.orderId === order.id)),
              }
            : order
        ))
      : database.orders,
    generatedAt: toDateTimeString(now),
  };
}
