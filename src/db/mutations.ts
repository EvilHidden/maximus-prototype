import type {
  Customer,
  DraftOrderRecord,
  OpenOrderPaymentStatus,
  OrderWorkflowState,
  PickupLocation,
  ServiceAppointmentType,
} from "../types";
import { deserializeOrderWorkflowFromRecords, serializeOrderWorkflowToRecords } from "./orderWorkflowSerializer";
import type {
  DbCustomer,
  DbDraftOrder,
  DbMeasurementSet,
  DbOrder,
  DbOrderScope,
  PrototypeDatabase,
} from "./schema";
import { createMeasurementValueMap, getMeasurementFieldLabels } from "./referenceData";
import { createLocationId, toDateTimeString } from "./runtime/support";

type OrderMutationOptions = {
  now?: Date;
  idFactory?: () => number;
};

type CreateAppointmentPayload = {
  customerId: string;
  typeKey: ServiceAppointmentType;
  location: PickupLocation;
  scheduledFor: string;
};

type RescheduleAppointmentPayload = {
  appointmentId: string;
  location: PickupLocation;
  scheduledFor: string;
};

type SaveMeasurementSetPayload = {
  customerId: string;
  measurementSetId: string | null;
  measurements: Record<string, string>;
  mode: "draft" | "saved";
  title: string;
};

type DeleteMeasurementSetPayload = {
  measurementSetId: string;
  linkedMeasurementSetId: string | null;
  customerId: string | null;
  measurements: Record<string, string>;
};

function cloneDatabase(database: PrototypeDatabase): PrototypeDatabase {
  return {
    ...database,
    staffMembers: [...database.staffMembers],
    customers: [...database.customers],
    customerEvents: [...database.customerEvents],
    measurementSets: [...database.measurementSets],
    draftOrders: [...database.draftOrders],
    orders: [...database.orders],
    orderScopes: [...database.orderScopes],
    orderScopeLines: [...database.orderScopeLines],
    orderScopeLineComponents: [...database.orderScopeLineComponents],
    pickupNotifications: [...database.pickupNotifications],
    pickupAppointments: [...database.pickupAppointments],
    serviceAppointments: [...database.serviceAppointments],
    payments: [...database.payments],
    squareLinks: [...database.squareLinks],
  };
}

function getLocationId(location: string) {
  return createLocationId(location as Customer["preferredLocation"]);
}

function createCustomerRecord(customer: Customer): DbCustomer {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    address: customer.address,
    preferredLocationId: getLocationId(customer.preferredLocation),
    lastVisitLabel: customer.lastVisit,
    measurementsStatus: customer.measurementsStatus,
    marketingOptIn: customer.marketingOptIn,
    notes: customer.notes,
    isVip: customer.isVip,
    status: customer.archived ? "archived" : "active",
  };
}

function createDraftOrderRecord(
  draftOrder: DraftOrderRecord,
): DbDraftOrder {
  return {
    id: draftOrder.id,
    payerCustomerId: draftOrder.payerCustomerId,
    updatedAt: draftOrder.updatedAt,
    snapshot: draftOrder.snapshot,
  };
}

function getNextOrderSequence(database: PrototypeDatabase) {
  return database.orders.reduce((maxOrder, order) => {
    const numericId = Number.parseInt(order.displayId.replace(/\D/g, ""), 10);
    return Number.isNaN(numericId) ? maxOrder : Math.max(maxOrder, numericId);
  }, 9000) + 1;
}

function getOrderIdFromOpenOrderId(database: PrototypeDatabase, openOrderId: number) {
  return database.orders.find((order) => Number.parseInt(order.displayId.replace(/\D/g, ""), 10) === openOrderId)?.id ?? null;
}

function getScopeIdFromAppointment(database: PrototypeDatabase, appointmentId: string) {
  const pickupAppointment = database.pickupAppointments.find((appointment) => appointment.id === appointmentId);
  return pickupAppointment?.scopeId ?? null;
}

function getAppointmentWorkflow(typeKey: CreateAppointmentPayload["typeKey"]) {
  return typeKey === "alteration_fitting" ? "alteration" : "custom";
}

function createEmptyMeasurementValuesFromDatabase(database: PrototypeDatabase) {
  return createMeasurementValueMap(getMeasurementFieldLabels(database));
}

function formatMeasurementDateLabel(now: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
  }).format(now);
}

function deriveCustomerMeasurementStatus(measurementSets: DbMeasurementSet[]): DbCustomer["measurementsStatus"] {
  if (measurementSets.some((set) => !set.isDraft)) {
    return "on_file";
  }

  if (measurementSets.some((set) => set.isDraft)) {
    return "needs_update";
  }

  return "missing";
}

function syncCustomerMeasurementStatus(database: PrototypeDatabase, customerId: string): PrototypeDatabase {
  const customerMeasurementSets = database.measurementSets.filter((set) => set.customerId === customerId);
  const nextStatus = deriveCustomerMeasurementStatus(customerMeasurementSets);

  return {
    ...database,
    customers: database.customers.map((customer) => (
      customer.id === customerId
        ? { ...customer, measurementsStatus: nextStatus }
        : customer
    )),
  };
}

function getOrderTotal(database: PrototypeDatabase, orderId: string) {
  const scopeIds = database.orderScopes.filter((scope) => scope.orderId === orderId).map((scope) => scope.id);
  return database.orderScopeLines
    .filter((line) => scopeIds.includes(line.scopeId))
    .reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
}

function getTotalCollected(database: PrototypeDatabase, orderId: string) {
  return database.payments.reduce((sum, payment) => (
    payment.orderId === orderId && payment.status === "captured" ? sum + payment.amount : sum
  ), 0);
}

function deriveOrderStatus(scopes: DbOrderScope[]): DbOrder["status"] {
  if (scopes.every((scope) => scope.phase === "picked_up")) {
    return "complete";
  }

  if (scopes.some((scope) => scope.phase === "ready")) {
    return "partially_ready";
  }

  return "open";
}

export function addCustomerRecord(database: PrototypeDatabase, customer: Customer): PrototypeDatabase {
  const next = cloneDatabase(database);
  next.customers = [createCustomerRecord(customer), ...database.customers];
  return next;
}

export function updateCustomerRecord(database: PrototypeDatabase, customer: Customer): PrototypeDatabase {
  const nextCustomer = createCustomerRecord(customer);
  return {
    ...database,
    customers: database.customers.map((record) => (record.id === customer.id ? nextCustomer : record)),
  };
}

export function archiveCustomerRecord(database: PrototypeDatabase, customerId: string): PrototypeDatabase {
  return {
    ...database,
    customers: database.customers.map((customer) => (
      customer.id === customerId
        ? { ...customer, status: "archived" }
        : customer
    )),
  };
}

export function createDraftMeasurementSetRecord(
  database: PrototypeDatabase,
  customerId: string | null,
  now = new Date(),
): { database: PrototypeDatabase; linkedMeasurementSetId: string; values: Record<string, string> } {
  const values = createEmptyMeasurementValuesFromDatabase(database);

  if (!customerId) {
    return {
      database,
      linkedMeasurementSetId: "",
      values,
    };
  }

  const customer = database.customers.find((record) => record.id === customerId);
  if (!customer) {
    return {
      database,
      linkedMeasurementSetId: "",
      values,
    };
  }

  const nextMeasurementSetId = `SET-${customer.id}-DRAFT-${now.getTime()}`;
  const dateLabel = formatMeasurementDateLabel(now);
  const draftSet: DbMeasurementSet = {
    id: nextMeasurementSetId,
    customerId: customer.id,
    label: "Draft",
    takenAt: dateLabel,
    note: `${dateLabel} • ${customer.name} draft`,
    values,
    isDraft: true,
    suggested: false,
  };

  return {
    linkedMeasurementSetId: nextMeasurementSetId,
    values,
    database: syncCustomerMeasurementStatus({
      ...database,
      measurementSets: [...database.measurementSets, draftSet],
    }, customer.id),
  };
}

export function saveMeasurementSetRecord(
  database: PrototypeDatabase,
  payload: SaveMeasurementSetPayload,
  now = new Date(),
): { database: PrototypeDatabase; linkedMeasurementSetId: string } {
  const customer = database.customers.find((record) => record.id === payload.customerId);
  if (!customer) {
    return {
      database,
      linkedMeasurementSetId: payload.measurementSetId ?? "",
    };
  }

  const dateLabel = formatMeasurementDateLabel(now);
  const currentSet = database.measurementSets.find((set) => set.id === payload.measurementSetId) ?? null;
  const sameCustomerCurrentSet = currentSet?.customerId === customer.id ? currentSet : null;
  const normalizedTitle = payload.title.trim() || `${customer.name} ${payload.mode === "draft" ? "draft" : "measurements"}`;

  if (payload.mode === "draft" && sameCustomerCurrentSet?.isDraft) {
    const nextDatabase = {
      ...database,
      measurementSets: database.measurementSets.map((set) => (
        set.id === sameCustomerCurrentSet.id
          ? {
              ...set,
              takenAt: dateLabel,
              note: `${dateLabel} • ${normalizedTitle}`,
              values: { ...payload.measurements },
              isDraft: true,
              suggested: false,
            }
          : set
      )),
    };

    return {
      linkedMeasurementSetId: sameCustomerCurrentSet.id,
      database: syncCustomerMeasurementStatus(nextDatabase, customer.id),
    };
  }

  if (payload.mode === "saved" && sameCustomerCurrentSet && !sameCustomerCurrentSet.isDraft && sameCustomerCurrentSet.label.startsWith("Version ")) {
    const nextDatabase = {
      ...database,
      measurementSets: database.measurementSets.map((set) => {
        if (set.customerId !== customer.id) {
          return set;
        }

        if (set.id === sameCustomerCurrentSet.id) {
          return {
            ...set,
            takenAt: dateLabel,
            note: `${dateLabel} • ${normalizedTitle}`,
            values: { ...payload.measurements },
            isDraft: false,
            suggested: true,
          };
        }

        return {
          ...set,
          suggested: false,
        };
      }),
    };

    return {
      linkedMeasurementSetId: sameCustomerCurrentSet.id,
      database: syncCustomerMeasurementStatus(nextDatabase, customer.id),
    };
  }

  if (payload.mode === "saved") {
    const nextVersion =
      database.measurementSets
        .filter((set) => set.customerId === customer.id)
        .reduce((maxVersion, set) => {
          const match = set.label.match(/^Version (\d+)$/);
          return match ? Math.max(maxVersion, Number.parseInt(match[1], 10)) : maxVersion;
        }, 0) + 1;

    if (sameCustomerCurrentSet?.isDraft) {
      const nextDatabase = {
        ...database,
        measurementSets: database.measurementSets.map((set) => {
          if (set.customerId !== customer.id) {
            return set;
          }

          if (set.id === sameCustomerCurrentSet.id) {
            return {
              ...set,
              label: `Version ${nextVersion}`,
              takenAt: dateLabel,
              note: `${dateLabel} • ${normalizedTitle}`,
              values: { ...payload.measurements },
              isDraft: false,
              suggested: true,
            };
          }

          return {
            ...set,
            suggested: false,
          };
        }),
      };

      return {
        linkedMeasurementSetId: sameCustomerCurrentSet.id,
        database: syncCustomerMeasurementStatus(nextDatabase, customer.id),
      };
    }

    const nextMeasurementSetId = `SET-${customer.id}-V${nextVersion}-${now.getTime()}`;
    const nextSet: DbMeasurementSet = {
      id: nextMeasurementSetId,
      customerId: customer.id,
      label: `Version ${nextVersion}`,
      takenAt: dateLabel,
      note: `${dateLabel} • ${normalizedTitle}`,
      values: { ...payload.measurements },
      isDraft: false,
      suggested: true,
    };

    const nextDatabase = {
      ...database,
      measurementSets: [
        ...database.measurementSets.map((set) => (
          set.customerId === customer.id
            ? {
                ...set,
                suggested: false,
              }
            : set
        )),
        nextSet,
      ],
    };

    return {
      linkedMeasurementSetId: nextMeasurementSetId,
      database: syncCustomerMeasurementStatus(nextDatabase, customer.id),
    };
  }

  const nextMeasurementSetId = `SET-${customer.id}-DRAFT-${now.getTime()}`;
  const draftSet: DbMeasurementSet = {
    id: nextMeasurementSetId,
    customerId: customer.id,
    label: "Draft",
    takenAt: dateLabel,
    note: `${dateLabel} • ${normalizedTitle}`,
    values: { ...payload.measurements },
    isDraft: true,
    suggested: false,
  };

  return {
    linkedMeasurementSetId: nextMeasurementSetId,
    database: syncCustomerMeasurementStatus({
      ...database,
      measurementSets: [...database.measurementSets, draftSet],
    }, customer.id),
  };
}

export function deleteMeasurementSetRecord(
  database: PrototypeDatabase,
  payload: DeleteMeasurementSetPayload,
  now = new Date(),
): { database: PrototypeDatabase; linkedMeasurementSetId: string | null } {
  const remainingSets = database.measurementSets.filter((set) => set.id !== payload.measurementSetId);

  if (payload.linkedMeasurementSetId !== payload.measurementSetId) {
    const nextDatabase = {
      ...database,
      measurementSets: remainingSets,
    };

    return {
      linkedMeasurementSetId: payload.linkedMeasurementSetId,
      database: payload.customerId ? syncCustomerMeasurementStatus(nextDatabase, payload.customerId) : nextDatabase,
    };
  }

  const hasMeasurements = Object.values(payload.measurements).some((value) => value.trim().length > 0);
  const customer = payload.customerId ? database.customers.find((record) => record.id === payload.customerId) ?? null : null;
  if (!hasMeasurements || !customer) {
    const nextDatabase = {
      ...database,
      measurementSets: remainingSets,
    };

    return {
      linkedMeasurementSetId: null,
      database: payload.customerId ? syncCustomerMeasurementStatus(nextDatabase, payload.customerId) : nextDatabase,
    };
  }

  const nextMeasurementSetId = `SET-${customer.id}-DRAFT-${now.getTime()}`;
  const dateLabel = formatMeasurementDateLabel(now);
  const draftSet: DbMeasurementSet = {
    id: nextMeasurementSetId,
    customerId: customer.id,
    label: "Draft",
    takenAt: dateLabel,
    note: `${dateLabel} • ${customer.name} draft`,
    values: { ...payload.measurements },
    isDraft: true,
    suggested: false,
  };

  return {
    linkedMeasurementSetId: nextMeasurementSetId,
    database: syncCustomerMeasurementStatus({
      ...database,
      measurementSets: [...remainingSets, draftSet],
    }, customer.id),
  };
}

export function replaceDraftOrderRecords(
  database: PrototypeDatabase,
  draftOrders: DraftOrderRecord[],
): PrototypeDatabase {
  return {
    ...database,
    draftOrders: draftOrders.map(createDraftOrderRecord),
  };
}

export function loadOrderWorkflowForEdit(database: PrototypeDatabase, openOrderId: number): OrderWorkflowState | null {
  return deserializeOrderWorkflowFromRecords(database, openOrderId);
}

export function saveOrderWorkflowToDatabase(
  database: PrototypeDatabase,
  order: OrderWorkflowState,
  customers: Customer[],
  paymentStatus: OpenOrderPaymentStatus,
  options: OrderMutationOptions = {},
  editingOpenOrderId: number | null = null,
): { database: PrototypeDatabase; openOrderId: number } | null {
  const now = options.now ?? new Date();
  const existingOrder = editingOpenOrderId ? database.orders.find((candidate) => Number.parseInt(candidate.displayId.replace(/\D/g, ""), 10) === editingOpenOrderId) ?? null : null;
  const nextSequence = existingOrder
    ? Number.parseInt(existingOrder.displayId.replace(/\D/g, ""), 10)
    : options.idFactory?.() ?? getNextOrderSequence(database);
  const serialized = serializeOrderWorkflowToRecords({
    order,
    customers,
    locations: database.locations,
    paymentStatus,
    orderSequence: nextSequence,
    now,
    existingOrder,
    existingScopes: existingOrder ? database.orderScopes.filter((scope) => scope.orderId === existingOrder.id) : [],
    staffMembers: database.staffMembers,
  });
  if (!serialized) {
    return null;
  }

  if (!existingOrder) {
    return {
      openOrderId: serialized.openOrderId,
      database: {
        ...database,
        customerEvents: [...database.customerEvents, ...serialized.customerEvents],
        orders: [serialized.orderRecord, ...database.orders],
        orderScopes: [...database.orderScopes, ...serialized.scopes],
        orderScopeLines: [...database.orderScopeLines, ...serialized.scopeLines],
        orderScopeLineComponents: [...database.orderScopeLineComponents, ...serialized.lineComponents],
        pickupAppointments: [...database.pickupAppointments, ...serialized.pickupAppointments],
        payments: [...database.payments, ...serialized.paymentRecords],
        generatedAt: toDateTimeString(now),
      },
    };
  }

  const existingScopeIds = database.orderScopes.filter((scope) => scope.orderId === existingOrder.id).map((scope) => scope.id);
  const existingLineIds = database.orderScopeLines.filter((line) => existingScopeIds.includes(line.scopeId)).map((line) => line.id);
  const existingEventIds = database.orderScopes
    .filter((scope) => scope.orderId === existingOrder.id)
    .map((scope) => scope.eventId)
    .filter((eventId): eventId is string => Boolean(eventId));

  return {
    openOrderId: serialized.openOrderId,
    database: {
      ...database,
      customerEvents: [
        ...database.customerEvents.filter((event) => !existingEventIds.includes(event.id)),
        ...serialized.customerEvents,
      ],
      orders: database.orders.map((record) => (
        record.id === existingOrder.id ? serialized.orderRecord : record
      )),
      orderScopes: [
        ...database.orderScopes.filter((scope) => scope.orderId !== existingOrder.id),
        ...serialized.scopes,
      ],
      orderScopeLines: [
        ...database.orderScopeLines.filter((line) => !existingScopeIds.includes(line.scopeId)),
        ...serialized.scopeLines,
      ],
      orderScopeLineComponents: [
        ...database.orderScopeLineComponents.filter((component) => !existingLineIds.includes(component.lineId)),
        ...serialized.lineComponents,
      ],
      pickupAppointments: [
        ...database.pickupAppointments.filter((appointment) => appointment.orderId !== existingOrder.id),
        ...serialized.pickupAppointments,
      ],
      payments: [
        ...database.payments.filter((payment) => payment.orderId !== existingOrder.id || payment.status === "captured"),
        ...serialized.paymentRecords,
      ],
      generatedAt: toDateTimeString(now),
    },
  };
}

export function startOrderPaymentCollection(
  database: PrototypeDatabase,
  openOrderId: number,
): PrototypeDatabase {
  const orderId = getOrderIdFromOpenOrderId(database, openOrderId);
  if (!orderId) {
    return database;
  }

  const amount = Math.max(getOrderTotal(database, orderId) - getTotalCollected(database, orderId), 0);
  if (amount <= 0) {
    return database;
  }

  const paymentIndex = database.payments.filter((payment) => payment.orderId === orderId).length + 1;
  return {
    ...database,
    payments: [
      ...database.payments,
      {
        id: `pay-${orderId}-${paymentIndex}`,
        orderId,
        source: "prototype",
        status: "pending",
        amount,
        collectedAt: null,
        squarePaymentId: null,
      },
    ],
  };
}

export function assignOpenOrderTailor(
  database: PrototypeDatabase,
  openOrderId: number,
  staffId: string | null,
  now = new Date(),
): PrototypeDatabase {
  const orderId = getOrderIdFromOpenOrderId(database, openOrderId);
  if (!orderId) {
    return database;
  }

  return {
    ...database,
    orderScopes: database.orderScopes.map((scope) => (
      scope.orderId === orderId && scope.workflow === "alteration"
        ? {
            ...scope,
            assigneeStaffId: staffId,
          }
        : scope
    )),
    generatedAt: toDateTimeString(now),
  };
}

export function startOpenOrderWork(
  database: PrototypeDatabase,
  openOrderId: number,
  now = new Date(),
): PrototypeDatabase {
  const orderId = getOrderIdFromOpenOrderId(database, openOrderId);
  if (!orderId) {
    return database;
  }

  return {
    ...database,
    orders: database.orders.map((order) => (
      order.id === orderId
        ? {
            ...order,
            operationalStatus: "in_progress",
          }
        : order
    )),
    generatedAt: toDateTimeString(now),
  };
}

export function captureOrderPayment(
  database: PrototypeDatabase,
  openOrderId: number,
  now = new Date(),
): PrototypeDatabase {
  const orderId = getOrderIdFromOpenOrderId(database, openOrderId);
  if (!orderId) {
    return database;
  }

  const amount = Math.max(getOrderTotal(database, orderId) - getTotalCollected(database, orderId), 0);
  if (amount <= 0) {
    return database;
  }

  const paymentIndex = database.payments.filter((payment) => payment.orderId === orderId).length + 1;
  return {
    ...database,
    payments: [
      ...database.payments,
      {
        id: `pay-${orderId}-${paymentIndex}`,
        orderId,
        source: "prototype",
        status: "captured",
        amount,
        collectedAt: toDateTimeString(now),
        squarePaymentId: null,
      },
    ],
    generatedAt: toDateTimeString(now),
  };
}

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
        locationId: createLocationId(payload.location),
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
              locationId: createLocationId(payload.location),
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
            locationId: createLocationId(payload.location),
            scheduledFor: payload.scheduledFor,
            statusKey: "scheduled",
          }
        : appointment
    )),
    generatedAt: toDateTimeString(now),
  };
}

export function markOrderScopePickupReady(
  database: PrototypeDatabase,
  scopeId: string,
  now = new Date(),
): PrototypeDatabase {
  const nextScopes: DbOrderScope[] = database.orderScopes.map((scope) => (
    scope.id === scopeId
      ? {
          ...scope,
          phase: "ready",
          promisedReadyAt: scope.promisedReadyAt ?? toDateTimeString(now),
          readyAt: scope.readyAt ?? toDateTimeString(now),
        }
      : scope
  ));
  const orderId = nextScopes.find((scope) => scope.id === scopeId)?.orderId;
  if (!orderId) {
    return database;
  }

  return {
    ...database,
    orderScopes: nextScopes,
    orders: database.orders.map((order) => (
      order.id === orderId
        ? {
            ...order,
            status: deriveOrderStatus(nextScopes.filter((scope) => scope.orderId === orderId)),
          }
        : order
    )),
    generatedAt: toDateTimeString(now),
  };
}

export function completeOpenOrderPickup(
  database: PrototypeDatabase,
  openOrderId: number,
  now = new Date(),
): PrototypeDatabase {
  const orderId = getOrderIdFromOpenOrderId(database, openOrderId);
  if (!orderId) {
    return database;
  }

  const nextScopes = database.orderScopes.map((scope) => (
    scope.orderId === orderId
      ? {
          ...scope,
          phase: "picked_up" as const,
          readyAt: scope.readyAt ?? toDateTimeString(now),
        }
      : scope
  ));

  return {
    ...database,
    orderScopes: nextScopes,
    orders: database.orders.map((order) => (
      order.id === orderId
        ? {
            ...order,
            status: deriveOrderStatus(nextScopes.filter((scope) => scope.orderId === orderId)),
          }
        : order
    )),
    pickupAppointments: database.pickupAppointments.map((appointment) => (
      appointment.orderId === orderId
        ? {
            ...appointment,
            statusKey: "completed",
          }
        : appointment
    )),
    generatedAt: toDateTimeString(now),
  };
}

export function cancelOpenOrder(
  database: PrototypeDatabase,
  openOrderId: number,
  now = new Date(),
): PrototypeDatabase {
  const orderId = getOrderIdFromOpenOrderId(database, openOrderId);
  if (!orderId) {
    return database;
  }

  return {
    ...database,
    orders: database.orders.map((order) => (
      order.id === orderId
        ? {
            ...order,
            status: "canceled",
          }
        : order
    )),
    pickupAppointments: database.pickupAppointments.map((appointment) => (
      appointment.orderId === orderId
        ? {
            ...appointment,
            statusKey: "canceled",
          }
        : appointment
    )),
    serviceAppointments: database.serviceAppointments.map((appointment) => (
      appointment.orderId === orderId
        ? {
            ...appointment,
            statusKey: "canceled",
          }
        : appointment
    )),
    payments: database.payments.filter((payment) => payment.orderId !== orderId || payment.status === "captured"),
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
