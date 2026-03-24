import type {
  DbMeasurementSet,
  DbOrder,
  DbOrderScope,
  DbOrderScopeLine,
  DbOrderScopeLineComponent,
} from "../../schema";

function inferAlterationGarment(label: string) {
  const normalized = label.toLowerCase();

  if (normalized.includes("trouser") || normalized.includes("pant")) return "Trousers";
  if (normalized.includes("jacket") || normalized.includes("sleeve")) return "Jacket";
  if (normalized.includes("vest")) return "Vest";
  if (normalized.includes("dress")) return "Dress";
  if (normalized.includes("skirt")) return "Skirt";
  if (normalized.includes("blouse")) return "Blouse";
  if (normalized.includes("gown")) return "Gown";
  if (normalized.includes("sari")) return "Sari blouse";

  return "Alteration";
}

function inferAlterationServices(label: string) {
  const normalized = label.toLowerCase();

  if (normalized.includes("hem + taper")) return ["Hem", "Taper"];
  if (normalized.includes("hem")) return ["Hem"];
  if (normalized.includes("taper")) return ["Taper"];
  if (normalized.includes("suppression")) return ["Suppression"];
  if (normalized.includes("shorten")) return ["Shorten"];
  if (normalized.includes("bustle")) return ["Bustle"];
  if (normalized.includes("take-in")) return ["Take-in"];
  if (normalized.includes("adjustment")) return ["Adjustment"];
  if (normalized.includes("fitting")) return ["Fitting"];
  if (normalized.includes("lift")) return ["Lift"];

  return [label];
}

function getLatestMeasurementSet(customerId: string | null, measurementSets: DbMeasurementSet[]) {
  if (!customerId) {
    return null;
  }

  return measurementSets.find((set) => set.customerId === customerId && !set.isDraft)
    ?? measurementSets.find((set) => set.customerId === customerId)
    ?? null;
}

type SeedScopeLineInput = {
  id: string;
  scopeId: string;
  label: string;
  quantity: number;
  unitPrice: number;
};

function buildSeedOrderScopeLine(
  input: SeedScopeLineInput,
  ordersById: Map<string, DbOrder>,
  scopesById: Map<string, DbOrderScope>,
  measurementSets: DbMeasurementSet[],
): DbOrderScopeLine {
  const scope = scopesById.get(input.scopeId);
  const order = scope ? ordersById.get(scope.orderId) : null;
  const measurementSet = scope?.workflow === "custom"
    ? getLatestMeasurementSet(order?.payerCustomerId ?? null, measurementSets)
    : null;

  return {
    ...input,
    garmentLabel: scope?.workflow === "custom" ? input.label : inferAlterationGarment(input.label),
    wearerCustomerId: scope?.workflow === "custom" ? order?.payerCustomerId ?? null : null,
    wearerName: scope?.workflow === "custom" ? order?.payerName ?? null : null,
    measurementSetId: measurementSet?.id ?? null,
    measurementSetLabel: measurementSet?.label ?? null,
    measurementSnapshot: measurementSet ? { ...measurementSet.values } : null,
  };
}

export function createOrderScopeLines(
  orders: DbOrder[],
  orderScopes: DbOrderScope[],
  measurementSets: DbMeasurementSet[],
): DbOrderScopeLine[] {
  const ordersById = new Map(orders.map((order) => [order.id, order]));
  const scopesById = new Map(orderScopes.map((scope) => [scope.id, scope]));

  return [
    { id: "line-9001-1", scopeId: "scope-9001-custom", label: "Two-piece suit", quantity: 1, unitPrice: 1495 },
    { id: "line-9002-1", scopeId: "scope-9002-alteration", label: "Dress hem", quantity: 1, unitPrice: 240 },
    { id: "line-9002-2", scopeId: "scope-9002-alteration", label: "Vest waist suppression", quantity: 1, unitPrice: 107.8 },
    { id: "line-9003-1", scopeId: "scope-9003-alteration", label: "Trouser taper", quantity: 1, unitPrice: 120 },
    { id: "line-9003-2", scopeId: "scope-9003-custom", label: "Dinner jacket", quantity: 1, unitPrice: 1495 },
    { id: "line-9003-3", scopeId: "scope-9003-custom", label: "Vest", quantity: 1, unitPrice: 741.85 },
    { id: "line-9004-1", scopeId: "scope-9004-alteration", label: "Pant hem", quantity: 1, unitPrice: 54.45 },
    { id: "line-9005-1", scopeId: "scope-9005-alteration", label: "Rush sleeve adjustment", quantity: 1, unitPrice: 95 },
    { id: "line-9006-1", scopeId: "scope-9006-custom", label: "Dinner jacket", quantity: 1, unitPrice: 1495 },
    { id: "line-9007-1", scopeId: "scope-9007-alteration", label: "Skirt hem", quantity: 1, unitPrice: 65 },
    { id: "line-9008-1", scopeId: "scope-9008-custom", label: "Wedding tuxedo", quantity: 1, unitPrice: 1895 },
    { id: "line-9009-1", scopeId: "scope-9009-alteration", label: "Jacket suppression", quantity: 1, unitPrice: 85 },
    { id: "line-9009-2", scopeId: "scope-9009-alteration", label: "Sleeve shorten", quantity: 1, unitPrice: 55 },
    { id: "line-9010-1", scopeId: "scope-9010-alteration", label: "Blouse sleeve taper", quantity: 1, unitPrice: 72 },
    { id: "line-9010-2", scopeId: "scope-9010-custom", label: "Reception jacket", quantity: 1, unitPrice: 1295 },
    { id: "line-9011-1", scopeId: "scope-9011-custom", label: "Mother-of-the-bride suit", quantity: 1, unitPrice: 1595 },
    { id: "line-9012-1", scopeId: "scope-9012-alteration", label: "Stage pant hem", quantity: 1, unitPrice: 45 },
    { id: "line-9012-2", scopeId: "scope-9012-alteration", label: "Jacket sleeve shorten", quantity: 1, unitPrice: 65 },
    { id: "line-9013-1", scopeId: "scope-9013-custom", label: "Black-tie tuxedo", quantity: 1, unitPrice: 1695 },
    { id: "line-8821-1", scopeId: "scope-8821-custom", label: "Custom navy suit", quantity: 1, unitPrice: 1495 },
    { id: "line-8610-1", scopeId: "scope-8610-alteration", label: "Trouser hem + taper", quantity: 1, unitPrice: 65 },
    { id: "line-8443-1", scopeId: "scope-8443-custom", label: "Dinner jacket consult", quantity: 1, unitPrice: 0 },
    { id: "line-8904-1", scopeId: "scope-8904-alteration", label: "Wedding party alteration set", quantity: 1, unitPrice: 320 },
    { id: "line-8904-2", scopeId: "scope-8904-custom", label: "Wedding jacket", quantity: 1, unitPrice: 0 },
    { id: "line-8732-1", scopeId: "scope-8732-alteration", label: "Bridesmaid dress fitting", quantity: 1, unitPrice: 95 },
    { id: "line-8940-1", scopeId: "scope-8940-alteration", label: "Rush suit sleeve adjustment", quantity: 1, unitPrice: 80 },
    { id: "line-8528-1", scopeId: "scope-8528-alteration", label: "Pant waist suppression", quantity: 1, unitPrice: 35 },
    { id: "line-9014-1", scopeId: "scope-9014-alteration", label: "Dress bustle", quantity: 1, unitPrice: 110 },
    { id: "line-9014-2", scopeId: "scope-9014-alteration", label: "Waist take-in", quantity: 1, unitPrice: 65 },
    { id: "line-9015-1", scopeId: "scope-9015-custom", label: "Prom tuxedo", quantity: 1, unitPrice: 1595 },
    { id: "line-9016-1", scopeId: "scope-9016-alteration", label: "Bridesmaid hem", quantity: 1, unitPrice: 140 },
    { id: "line-9016-2", scopeId: "scope-9016-custom", label: "Dinner jacket", quantity: 1, unitPrice: 1325 },
    { id: "line-9017-1", scopeId: "scope-9017-alteration", label: "Suit suppression", quantity: 1, unitPrice: 95 },
    { id: "line-9017-2", scopeId: "scope-9017-alteration", label: "Trouser hem", quantity: 1, unitPrice: 55 },
    { id: "line-9018-1", scopeId: "scope-9018-custom", label: "Midnight tuxedo", quantity: 1, unitPrice: 1795 },
    { id: "line-9019-1", scopeId: "scope-9019-alteration", label: "Trouser taper", quantity: 1, unitPrice: 85 },
    { id: "line-9019-2", scopeId: "scope-9019-custom", label: "Ceremony suit", quantity: 1, unitPrice: 1695 },
    { id: "line-9020-1", scopeId: "scope-9020-alteration", label: "Gown shoulder lift", quantity: 1, unitPrice: 125 },
    { id: "line-9021-1", scopeId: "scope-9021-custom", label: "Charcoal suit", quantity: 1, unitPrice: 1495 },
    { id: "line-9022-1", scopeId: "scope-9022-alteration", label: "Sari blouse adjustment", quantity: 1, unitPrice: 90 },
    { id: "line-9023-1", scopeId: "scope-9023-custom", label: "Dinner suit", quantity: 1, unitPrice: 1545 },
  ].map((line) => buildSeedOrderScopeLine(line, ordersById, scopesById, measurementSets));
}

export function createOrderScopeLineComponents(orderScopeLines: DbOrderScopeLine[], orderScopes: DbOrderScope[]): DbOrderScopeLineComponent[] {
  const scopesById = new Map(orderScopes.map((scope) => [scope.id, scope]));

  return orderScopeLines.flatMap((line) => {
    const scope = scopesById.get(line.scopeId);
    const components: DbOrderScopeLineComponent[] = [];

    if (scope?.workflow === "alteration") {
      inferAlterationServices(line.label).forEach((service, index) => {
        components.push({
          id: `${line.id}-service-${index + 1}`,
          lineId: line.id,
          kind: "alteration_service",
          label: "Service",
          value: service,
          sortOrder: index + 1,
        });
      });
      return components;
    }

    if (line.wearerName) {
      components.push({
        id: `${line.id}-wearer`,
        lineId: line.id,
        kind: "wearer",
        label: "Wearer",
        value: line.wearerName,
        sortOrder: 1,
      });
    }

    if (line.measurementSetLabel) {
      components.push({
        id: `${line.id}-measurements`,
        lineId: line.id,
        kind: "measurement_set",
        label: "Measurements",
        value: line.measurementSetLabel,
        sortOrder: 2,
      });
    }

    return components;
  });
}
