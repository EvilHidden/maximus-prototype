import type {
  Appointment,
  AppointmentContextFlag,
  AppointmentPrepFlag,
  AppointmentProfileFlag,
  AppointmentStatusKey,
  AppointmentTypeKey,
  ClosedOrderHistoryItem,
  Customer,
  CustomerOrder,
  MeasurementSet,
  OrderLineComponent,
  OpenOrder,
  OpenOrderOperationalStatus,
  OpenOrderPickup,
  StaffMember,
} from "../types";
import type {
  DbLocation,
  DbOrder,
  DbOrderScope,
  DbOrderScopeLine,
  DbOrderScopeLineComponent,
  PrototypeDatabase,
} from "./schema";
import { getOpenOrderPickupBalanceDueFromPayments, getRecordedPaymentSummary } from "../features/order/paymentSummary";

function findLocationName(locations: DbLocation[], locationId: string) {
  return locations.find((location) => location.id === locationId)?.name ?? "Fifth Avenue";
}

function getCustomerProfileFlags(customer?: PrototypeDatabase["customers"][number]): AppointmentProfileFlag[] {
  if (!customer) {
    return [];
  }

  const flags: AppointmentProfileFlag[] = [];
  if (!customer.phone.trim()) {
    flags.push("missing_phone");
  }
  if (!customer.email.trim()) {
    flags.push("missing_email");
  }
  if (!customer.address.trim()) {
    flags.push("missing_address");
  }
  if (!customer.marketingOptIn) {
    flags.push("needs_marketing_opt_in");
  }

  return flags;
}

function getAppointmentPrepFlags(
  customer: PrototypeDatabase["customers"][number] | undefined,
  kind: Appointment["kind"],
): AppointmentPrepFlag[] {
  if (kind !== "appointment" || !customer) {
    return [];
  }

  return customer.measurementsStatus === "on_file" ? [] : ["needs_measurements"];
}

function getAppointmentContextFlags(
  confirmationStatus: PrototypeDatabase["serviceAppointments"][number]["confirmationStatus"],
  rush: boolean,
): AppointmentContextFlag[] {
  const flags: AppointmentContextFlag[] = [];
  flags.push(confirmationStatus ?? "unconfirmed");
  if (rush) {
    flags.push("rush");
  }

  return flags;
}

function getAppointmentTypeLabel(typeKey: AppointmentTypeKey) {
  switch (typeKey) {
    case "alteration_fitting":
      return "Alteration fitting";
    case "custom_consult":
      return "Custom consult";
    case "first_fitting":
      return "First fitting";
    case "custom_fitting":
      return "Custom fitting";
    case "wedding_party_fitting":
      return "Wedding party fitting";
    case "pickup":
      return "Pickup appointment";
  }
}

function getAppointmentStatusLabel(statusKey: AppointmentStatusKey) {
  switch (statusKey) {
    case "ready_to_check_in":
      return "Ready to check in";
    case "prep_required":
      return "Prep ticket";
    case "scheduled":
      return "Upcoming";
    case "completed":
      return "Completed";
    case "canceled":
      return "Canceled";
  }
}

function getOrderLines(database: PrototypeDatabase, orderId: string) {
  const scopeIds = database.orderScopes.filter((scope) => scope.orderId === orderId).map((scope) => scope.id);
  return database.orderScopeLines.filter((line) => scopeIds.includes(line.scopeId));
}

function getScopeLines(database: PrototypeDatabase, scopeId: string) {
  return database.orderScopeLines.filter((line) => line.scopeId === scopeId);
}

function getScopeLineComponents(database: PrototypeDatabase, lineId: string) {
  return database.orderScopeLineComponents
    .filter((component) => component.lineId === lineId)
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

function getOrderTotal(database: PrototypeDatabase, orderId: string) {
  return getOrderLines(database, orderId).reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
}

function adaptStaffMember(database: PrototypeDatabase, staffMember: PrototypeDatabase["staffMembers"][number]): StaffMember {
  return {
    id: staffMember.id,
    name: staffMember.name,
    primaryLocation: findLocationName(database.locations, staffMember.primaryLocationId),
  };
}

function deriveOrderStatus(order: DbOrder, scopes: DbOrderScope[]) {
  if (order.status === "canceled") {
    return "Canceled";
  }

  if (order.status === "complete" || scopes.every((scope) => scope.phase === "picked_up")) {
    return "Picked up";
  }

  if (scopes.every((scope) => scope.phase === "ready")) {
    return "Ready for pickup";
  }

  if (scopes.some((scope) => scope.phase === "ready")) {
    return "Partially ready";
  }

  return order.operationalStatus === "accepted" ? "Accepted" : "In progress";
}

function deriveOperationalStatus(order: DbOrder, scopes: DbOrderScope[]): OpenOrderOperationalStatus {
  if (scopes.every((scope) => scope.phase === "ready")) {
    return "ready_for_pickup";
  }

  if (scopes.some((scope) => scope.phase === "ready")) {
    return "partially_ready";
  }

  return order.operationalStatus ?? "in_progress";
}

function getOrderLabel(database: PrototypeDatabase, orderId: string) {
  const lines = getOrderLines(database, orderId);
  if (!lines.length) {
    return "Order";
  }

  return lines.map((line) => line.label).join(", ");
}

function createOpenOrderLineTitle(line: DbOrderScopeLine, scope: DbOrderScope | undefined) {
  return scope?.workflow === "custom"
    ? `Custom garment - ${line.garmentLabel}`
    : `Alteration - ${line.garmentLabel}`;
}

function createOpenOrderLineSubtitle(
  line: DbOrderScopeLine,
  components: DbOrderScopeLineComponent[],
  scope: DbOrderScope | undefined,
) {
  if (scope?.workflow === "custom") {
    const primary = components
      .filter((component) => component.kind === "wearer" || component.kind === "measurement_set")
      .map((component) => component.value);
    const secondary = components
      .filter((component) => component.kind !== "wearer" && component.kind !== "measurement_set")
      .map((component) => `${component.label} ${component.value}`);

    if (secondary.length > 0) {
      return `${primary.join(" • ")}\n${secondary.join(" • ")}`.trim();
    }

    return primary.join(" • ");
  }

  return components
    .filter((component) => component.kind === "alteration_service")
    .map((component) => component.value)
    .join(", ");
}

function getOpenOrderLineItems(database: PrototypeDatabase, orderId: string): OpenOrder["lineItems"] {
  return getOrderLines(database, orderId).map((line, index) => {
    const scope = database.orderScopes.find((candidate) => candidate.id === line.scopeId);
    const components = getScopeLineComponents(database, line.id);

    return {
      id: `${orderId}-${line.id}`,
      kind: scope?.workflow ?? "alteration",
      title: `${index + 1}. ${createOpenOrderLineTitle(line, scope)}`,
      subtitle: createOpenOrderLineSubtitle(line, components, scope),
      amount: line.quantity * line.unitPrice,
      sourceLabel: line.label,
      garmentLabel: line.garmentLabel,
      wearerCustomerId: line.wearerCustomerId,
      wearerName: line.wearerName,
      linkedMeasurementSetId: line.measurementSetId,
      linkedMeasurementLabel: line.measurementSetLabel,
      measurementSnapshot: line.measurementSnapshot ? { ...line.measurementSnapshot } : null,
      components: components.map<OrderLineComponent>((component) => ({
        id: component.id,
        kind: component.kind,
        label: component.label,
        value: component.value,
        sortOrder: component.sortOrder,
      })),
    };
  });
}

function getOpenOrderPickup(
  database: PrototypeDatabase,
  order: DbOrder,
  scope: DbOrderScope,
): OpenOrderPickup {
  const pickupAppointment = database.pickupAppointments.find((appointment) => (
    appointment.orderId === order.id && (appointment.scopeId === scope.id || appointment.scopeId === null)
  ));

  const scopeLines = getScopeLines(database, scope.id);
  const promisedReadyAt = scope.promisedReadyAt ? new Date(scope.promisedReadyAt) : null;
  const pickupDate = pickupAppointment
    ? pickupAppointment.scheduledFor.slice(0, 10)
    : promisedReadyAt
      ? promisedReadyAt.toISOString().slice(0, 10)
      : "";
  const pickupTime = pickupAppointment
    ? new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(pickupAppointment.scheduledFor))
    : promisedReadyAt
      ? new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(promisedReadyAt)
      : "";
  const pickupLocation = pickupAppointment
    ? findLocationName(database.locations, pickupAppointment.locationId)
    : scope.workflow === "alteration"
      ? findLocationName(database.locations, database.customers.find((customer) => customer.id === order.payerCustomerId)?.preferredLocationId ?? "loc_fifth_avenue")
      : "";

  return {
    id: scope.id,
    scope: scope.workflow,
    label: scope.workflow === "custom" ? "Custom pickup" : "Alteration pickup",
    itemSummary: scopeLines.map((line) => line.label),
    itemCount: scopeLines.reduce((sum, line) => sum + line.quantity, 0),
    pickupDate,
    pickupTime,
    pickupLocation,
    eventType: database.customerEvents.find((event) => event.id === scope.eventId)?.type ?? "none",
    eventDate: database.customerEvents.find((event) => event.id === scope.eventId)?.eventDate ?? "",
    readyAt: scope.readyAt,
    pickedUpAt: scope.pickedUpAt,
    pickedUp: scope.phase === "picked_up",
    readyForPickup: scope.phase === "ready",
  };
}

export function adaptCustomers(database: PrototypeDatabase): Customer[] {
  return database.customers.map((customer) => ({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    address: customer.address,
    preferredLocation: findLocationName(database.locations, customer.preferredLocationId),
    lastVisit: customer.lastVisitLabel,
    measurementsStatus: customer.measurementsStatus,
    marketingOptIn: customer.marketingOptIn,
    notes: customer.notes,
    isVip: customer.isVip,
    archived: customer.status === "archived",
  }));
}

export function adaptMeasurementSets(database: PrototypeDatabase): MeasurementSet[] {
  return database.measurementSets.map((set) => ({
    id: set.id,
    customerId: set.customerId,
    label: set.label,
    takenAt: set.takenAt,
    note: set.note,
    values: set.values,
    suggested: set.suggested,
    isDraft: set.isDraft,
  }));
}

export function adaptStaffMembers(database: PrototypeDatabase): StaffMember[] {
  return database.staffMembers.map((staffMember) => adaptStaffMember(database, staffMember));
}

export function adaptCustomerOrders(database: PrototypeDatabase): Record<string, CustomerOrder[]> {
  return database.orders.reduce<Record<string, CustomerOrder[]>>((accumulator, order) => {
    if (!order.payerCustomerId) {
      return accumulator;
    }

    const lineSummary = getOrderLabel(database, order.id);
    const nextEntry: CustomerOrder = {
      id: order.displayId,
      label: lineSummary,
      createdAt: order.createdAt,
      status: deriveOrderStatus(order, database.orderScopes.filter((scope) => scope.orderId === order.id)),
      total: getOrderTotal(database, order.id),
    };

    accumulator[order.payerCustomerId] = [nextEntry, ...(accumulator[order.payerCustomerId] ?? [])];
    return accumulator;
  }, {});
}

export function adaptClosedOrderHistory(database: PrototypeDatabase): ClosedOrderHistoryItem[] {
  return database.orders
    .filter((order) => order.status === "complete" || order.status === "canceled")
    .map((order) => {
      const scopes = database.orderScopes.filter((scope) => scope.orderId === order.id);
      const lineItems = getOpenOrderLineItems(database, order.id);
      const total = getOrderTotal(database, order.id);
      const payment = getRecordedPaymentSummary({
        payments: database.payments.filter((candidate) => candidate.orderId === order.id),
        generatedAt: database.generatedAt,
        orderType: order.orderType,
        total,
      });
      const alterationScope = scopes.find((scope) => scope.workflow === "alteration");
      const staffMember = alterationScope?.assigneeStaffId
        ? database.staffMembers.find((candidate) => candidate.id === alterationScope.assigneeStaffId)
        : null;
      const completedAt = order.status === "complete"
        ? scopes
          .map((scope) => scope.pickedUpAt)
          .filter((value): value is string => Boolean(value))
          .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] ?? null
        : null;

      return {
        id: order.displayId,
        displayId: order.displayId,
        customerName: order.payerName,
        payerCustomerId: order.payerCustomerId,
        payerName: order.payerName,
        label: getOrderLabel(database, order.id),
        orderType: order.orderType,
        inHouseAssignee: staffMember ? adaptStaffMember(database, staffMember) : null,
        itemCount: lineItems.length,
        lineItems,
        itemSummary: lineItems.map((line) => line.title.replace(/^\d+\.\s*/, "")),
        pickupSchedules: scopes.map((scope) => getOpenOrderPickup(database, order, scope)),
        paymentStatus: payment.paymentStatus,
        paymentDueNow: payment.paymentDueNow,
        totalCollected: payment.totalCollected,
        collectedToday: payment.collectedToday,
        balanceDue: payment.balanceDue,
        createdAt: order.createdAt,
        completedAt,
        status: order.status === "canceled" ? "Canceled" : "Picked up",
        total: payment.total,
      };
    })
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

export function adaptAppointments(database: PrototypeDatabase): Appointment[] {
  const serviceAppointments: Appointment[] = database.serviceAppointments.map((appointment) => {
    const customer = database.customers.find((candidate) => candidate.id === appointment.customerId);
    const profileFlags = getCustomerProfileFlags(customer);

    return {
      id: appointment.id,
      scheduledFor: appointment.scheduledFor,
      kind: "appointment",
      source: appointment.source,
      location: findLocationName(database.locations, appointment.locationId),
      customerId: appointment.customerId,
      orderId: appointment.orderId,
      scopeId: appointment.scopeId,
      scopeLineId: appointment.scopeLineId,
      customer: appointment.customerName,
      durationMinutes: appointment.durationMinutes,
      typeKey: appointment.typeKey,
      type: getAppointmentTypeLabel(appointment.typeKey),
      statusKey: appointment.statusKey,
      status: getAppointmentStatusLabel(appointment.statusKey),
      prepFlags: getAppointmentPrepFlags(customer, "appointment"),
      profileFlags,
      contextFlags: getAppointmentContextFlags(appointment.confirmationStatus, appointment.rush),
      route: appointment.workflow,
    };
  });

  const pickupAppointments: Appointment[] = database.pickupAppointments.map((appointment) => {
    const order = database.orders.find((candidate) => candidate.id === appointment.orderId);
    const customerId = appointment.customerId ?? order?.payerCustomerId ?? undefined;
    const customer = database.customers.find((candidate) => candidate.id === customerId);
    const profileFlags = getCustomerProfileFlags(customer);

    return {
      id: appointment.id,
      scheduledFor: appointment.scheduledFor,
      kind: "pickup",
      source: appointment.source,
      location: findLocationName(database.locations, appointment.locationId),
      customerId,
      orderId: appointment.orderId,
      scopeId: appointment.scopeId,
      scopeLineId: appointment.scopeLineId,
      customer: order?.payerName ?? "Unknown customer",
      durationMinutes: appointment.durationMinutes,
      typeKey: appointment.typeKey,
      type: getAppointmentTypeLabel(appointment.typeKey),
      pickupSummary: appointment.summary,
      statusKey: appointment.statusKey,
      status: getAppointmentStatusLabel(appointment.statusKey),
      prepFlags: getAppointmentPrepFlags(customer, "pickup"),
      profileFlags,
      contextFlags: getAppointmentContextFlags(appointment.confirmationStatus, appointment.rush),
      route: "pickup",
    };
  });

  return [...serviceAppointments, ...pickupAppointments];
}

export function adaptOpenOrders(database: PrototypeDatabase): OpenOrder[] {
  return database.orders
    .filter((order) => order.status !== "complete" && order.status !== "canceled")
    .map((order) => {
      const scopes = database.orderScopes.filter((scope) => scope.orderId === order.id);
      const lineItems = getOpenOrderLineItems(database, order.id);
      const total = getOrderTotal(database, order.id);
      const payment = getRecordedPaymentSummary({
        payments: database.payments.filter((candidate) => candidate.orderId === order.id),
        generatedAt: database.generatedAt,
        orderType: order.orderType,
        total,
      });

      const openOrder: OpenOrder = {
        id: Number.parseInt(order.displayId.replace(/\D/g, ""), 10),
        payerCustomerId: order.payerCustomerId,
        payerName: order.payerName,
        orderType: order.orderType,
        operationalStatus: deriveOperationalStatus(order, scopes),
        holdUntilAllScopesReady: order.holdUntilAllScopesReady,
        inHouseAssignee: (() => {
          const alterationScope = scopes.find((scope) => scope.workflow === "alteration");
          if (!alterationScope?.assigneeStaffId) {
            return null;
          }

          const staffMember = database.staffMembers.find((candidate) => candidate.id === alterationScope.assigneeStaffId);
          return staffMember ? adaptStaffMember(database, staffMember) : null;
        })(),
        itemCount: lineItems.length,
        lineItems,
        itemSummary: lineItems.map((line) => line.title.replace(/^\d+\.\s*/, "")),
        pickupSchedules: scopes.map((scope) => getOpenOrderPickup(database, order, scope)),
        paymentStatus: payment.paymentStatus,
        paymentDueNow: payment.paymentDueNow,
        totalCollected: payment.totalCollected,
        collectedToday: payment.collectedToday,
        balanceDue: payment.balanceDue,
        total: payment.total,
        createdAt: order.createdAt,
      };

      return {
        ...openOrder,
        pickupBalanceDue: getOpenOrderPickupBalanceDueFromPayments({
          orderType: openOrder.orderType,
          lineItems: openOrder.lineItems,
          pickupSchedules: openOrder.pickupSchedules,
          payments: database.payments.filter((candidate) => candidate.orderId === order.id),
          total: openOrder.total,
        }),
      };
    });
}
