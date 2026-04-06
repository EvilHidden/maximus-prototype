import { describe, expect, it } from "vitest";
import { adaptClosedOrderHistory, adaptOpenOrders } from "./adapters";
import { getCustomGarmentPrice } from "./pricing";
import { createPrototypeDatabase } from "./runtime";
import { getOperatorQueueStageCounts } from "../features/order/operatorQueue";

const database = createPrototypeDatabase(new Date("2026-03-22T12:00:00.000Z"));

describe("seed consistency", () => {
  it("keeps customer-linked payer names aligned with customer records", () => {
    const customersById = new Map(database.customers.map((customer) => [customer.id, customer]));

    database.orders.forEach((order) => {
      if (!order.payerCustomerId) {
        return;
      }

      const customer = customersById.get(order.payerCustomerId);
      expect(customer, `Missing payer customer for ${order.id}`).toBeTruthy();
      expect(order.payerName).toBe(customer?.name);
    });
  });

  it("keeps measurement statuses aligned with actual measurement records", () => {
    const measurementCustomerIds = new Set(database.measurementSets.map((set) => set.customerId));

    database.customers.forEach((customer) => {
      if (measurementCustomerIds.has(customer.id)) {
        expect(customer.measurementsStatus).toBe("on_file");
        return;
      }

      expect(customer.measurementsStatus).toBe("missing");
    });
  });

  it("gives each order the right scope mix for its order type", () => {
    const scopesByOrderId = new Map(
      database.orders.map((order) => [
        order.id,
        database.orderScopes.filter((scope) => scope.orderId === order.id),
      ]),
    );

    database.orders.forEach((order) => {
      const scopes = scopesByOrderId.get(order.id) ?? [];
      const workflows = scopes.map((scope) => scope.workflow).sort();

      if (order.orderType === "alteration") {
        expect(workflows).toEqual(["alteration"]);
      } else if (order.orderType === "custom") {
        expect(workflows).toEqual(["custom"]);
      } else {
        expect(workflows).toEqual(["alteration", "custom"]);
      }
    });
  });

  it("uses canonical custom garment labels that exist in reference data", () => {
    const customDefinitions = new Set(database.customGarmentDefinitions.map((definition) => definition.label));
    const customScopeIds = new Set(database.orderScopes.filter((scope) => scope.workflow === "custom").map((scope) => scope.id));

    database.orderScopeLines
      .filter((line) => customScopeIds.has(line.scopeId))
      .forEach((line) => {
        expect(
          customDefinitions.has(line.garmentLabel),
          `${line.id} uses unknown custom garment label "${line.garmentLabel}"`,
        ).toBe(true);
      });
  });

  it("uses alteration garments and services that are priced in reference data", () => {
    const alterationDefinitions = new Set(
      database.alterationServiceDefinitions.map((definition) => `${definition.category}::${definition.name}`),
    );
    const alterationScopeIds = new Set(database.orderScopes.filter((scope) => scope.workflow === "alteration").map((scope) => scope.id));

    database.orderScopeLines
      .filter((line) => alterationScopeIds.has(line.scopeId))
      .forEach((line) => {
        const components = database.orderScopeLineComponents.filter((component) => component.lineId === line.id);

        components
          .filter((component) => component.kind === "alteration_service")
          .forEach((component) => {
            expect(
              alterationDefinitions.has(`${line.garmentLabel}::${component.value}`),
              `${line.id} uses unpriced alteration "${line.garmentLabel} / ${component.value}"`,
            ).toBe(true);
          });
      });
  });

  it("keeps seeded alteration line totals aligned with their service breakdowns", () => {
    const alterationPriceByKey = new Map(
      database.alterationServiceDefinitions.map((definition) => [`${definition.category}::${definition.name}`, definition.price]),
    );
    const alterationScopeIds = new Set(database.orderScopes.filter((scope) => scope.workflow === "alteration").map((scope) => scope.id));

    database.orderScopeLines
      .filter((line) => alterationScopeIds.has(line.scopeId))
      .forEach((line) => {
        const components = database.orderScopeLineComponents.filter((component) => component.lineId === line.id);
        const serviceComponents = components.filter((component) => component.kind === "alteration_service");
        const serviceTotal = serviceComponents.reduce(
          (sum, component) => sum + (alterationPriceByKey.get(`${line.garmentLabel}::${component.value}`) ?? 0),
          0,
        );

        expect(
          serviceTotal,
          `${line.id} has ${serviceComponents.length} alteration service(s) totaling ${serviceTotal}, but the line subtotal is ${line.unitPrice * line.quantity}`,
        ).toBe(line.unitPrice * line.quantity);
      });
  });

  it("keeps seeded custom garment lines aligned with canonical garment pricing", () => {
    const customScopeIds = new Set(database.orderScopes.filter((scope) => scope.workflow === "custom").map((scope) => scope.id));

    database.orderScopeLines
      .filter((line) => customScopeIds.has(line.scopeId))
      .forEach((line) => {
        const hasBuildComponents = database.orderScopeLineComponents.some((component) => (
          component.lineId === line.id && component.kind !== "wearer" && component.kind !== "measurement_set"
        ));

        if (!hasBuildComponents) {
          return;
        }

        expect(
          line.unitPrice * line.quantity,
          `${line.id} uses ${line.garmentLabel} but subtotal ${line.unitPrice * line.quantity} does not match canonical price.`,
        ).toBe(getCustomGarmentPrice(line.garmentLabel));
      });
  });

  it("covers the key open-order queue states used in the UI", () => {
    const openOrders = adaptOpenOrders(database);
    const operationalStatuses = new Set(openOrders.map((order) => order.operationalStatus));
    const queueCounts = getOperatorQueueStageCounts(openOrders);

    expect(operationalStatuses.has("accepted")).toBe(true);
    expect(operationalStatuses.has("in_progress")).toBe(true);
    expect(operationalStatuses.has("partially_ready")).toBe(true);
    expect(operationalStatuses.has("ready_for_pickup")).toBe(true);

    expect(queueCounts.ready_to_start).toBeGreaterThan(0);
    expect(queueCounts.in_progress).toBeGreaterThan(0);
    expect(queueCounts.ready).toBeGreaterThan(0);
  });

  it("includes seeded archive and payment edge stories used in the operator flow", () => {
    const openOrders = adaptOpenOrders(database);
    const closedOrders = adaptClosedOrderHistory(database);

    expect(openOrders.some((order) => order.paymentStatus === "pending")).toBe(true);
    expect(closedOrders.some((order) => order.status === "Canceled")).toBe(true);
  });
});
