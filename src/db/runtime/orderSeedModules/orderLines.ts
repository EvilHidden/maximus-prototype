import type {
  DbMeasurementSet,
  DbOrder,
  DbOrderScope,
  DbOrderScopeLine,
  DbOrderScopeLineComponent,
} from "../../schema";
import { getCustomGarmentPrice } from "../../pricing";
import { createAlterationServiceDefinitions } from "../referenceSeed";

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

type SeedCustomComponent = {
  kind: DbOrderScopeLineComponent["kind"];
  label: string;
  value: string;
};

type SeedScopeLineInput = {
  id: string;
  scopeId: string;
  label: string;
  quantity: number;
  unitPrice?: number;
  isRush?: boolean;
  garmentLabel?: string;
  alterationServices?: string[];
  wearerCustomerId?: string | null;
  wearerName?: string | null;
  measurementCustomerId?: string | null;
  measurementSetId?: string | null;
  customComponents?: SeedCustomComponent[];
};

const alterationServicePriceByKey = new Map(
  createAlterationServiceDefinitions().map((definition) => [`${definition.category}::${definition.name}`, definition.price]),
);

function getSeedAlterationServiceAmounts(input: SeedScopeLineInput) {
  const garmentLabel = input.garmentLabel ?? inferAlterationGarment(input.label);
  const services = input.alterationServices ?? inferAlterationServices(input.label);

  return services.map((service) => {
    const price = alterationServicePriceByKey.get(`${garmentLabel}::${service}`);

    if (typeof price !== "number") {
      throw new Error(`${input.id} uses unpriced alteration ${garmentLabel} / ${service}.`);
    }

    return price;
  });
}

function getSeedLineUnitPrice(input: SeedScopeLineInput, scopeWorkflow: DbOrderScope["workflow"] | undefined) {
  if (scopeWorkflow === "alteration") {
    return getSeedAlterationServiceAmounts(input).reduce((sum, amount) => sum + amount, 0);
  }

  if (scopeWorkflow === "custom" && input.customComponents?.length) {
    return getCustomGarmentPrice(input.garmentLabel ?? input.label);
  }

  return input.unitPrice ?? 0;
}

function buildCustomSeedComponents(input: {
  fabricSku: string;
  fabric?: string;
  buttonsSku: string;
  buttons?: string;
  liningSku: string;
  lining?: string;
  threadsSku: string;
  threads?: string;
  lapel?: string;
  pocketType?: string;
  canvas?: string;
  monogram?: string;
}) {
  const components: SeedCustomComponent[] = [
    { kind: "fabric_sku", label: "Fabric SKU", value: input.fabricSku },
    { kind: "buttons_sku", label: "Buttons SKU", value: input.buttonsSku },
    { kind: "lining_sku", label: "Lining SKU", value: input.liningSku },
    { kind: "threads_sku", label: "Threads SKU", value: input.threadsSku },
  ];

  if (input.fabric) {
    components.push({ kind: "fabric", label: "Fabric", value: input.fabric });
  }

  if (input.buttons) {
    components.push({ kind: "buttons", label: "Buttons", value: input.buttons });
  }

  if (input.lining) {
    components.push({ kind: "lining", label: "Lining", value: input.lining });
  }

  if (input.threads) {
    components.push({ kind: "threads", label: "Threads", value: input.threads });
  }

  if (input.lapel) {
    components.push({ kind: "lapel", label: "Lapel", value: input.lapel });
  }

  if (input.pocketType) {
    components.push({ kind: "pocket_type", label: "Pocket type", value: input.pocketType });
  }

  if (input.canvas) {
    components.push({ kind: "canvas", label: "Canvas", value: input.canvas });
  }

  if (input.monogram) {
    components.push({ kind: "monogram", label: "Monogram", value: input.monogram });
  }

  return components;
}

const classicNavySuit = buildCustomSeedComponents({
  fabricSku: "FAB-NAVY-001",
  fabric: "Navy stretch wool",
  buttonsSku: "BTN-HORN-101",
  buttons: "Dark horn",
  liningSku: "LIN-PAISLEY-201",
  lining: "Blue paisley",
  threadsSku: "THR-TONAL-301",
  threads: "Tone on tone",
  lapel: "Notch",
  pocketType: "Regular",
  canvas: "Half",
});

const blackTieTuxedo = buildCustomSeedComponents({
  fabricSku: "FAB-BLK-010",
  fabric: "Black barathea",
  buttonsSku: "BTN-SATIN-110",
  buttons: "Black satin",
  liningSku: "LIN-BURG-210",
  lining: "Burgundy paisley",
  threadsSku: "THR-TONAL-301",
  threads: "Tone on tone",
  lapel: "Peak",
  pocketType: "Regular without flap",
  canvas: "Full",
});

const midnightTuxedo = buildCustomSeedComponents({
  fabricSku: "FAB-MID-020",
  fabric: "Midnight wool mohair",
  buttonsSku: "BTN-SATIN-110",
  buttons: "Black satin",
  liningSku: "LIN-MID-220",
  lining: "Midnight jacquard",
  threadsSku: "THR-TONAL-301",
  threads: "Tone on tone",
  lapel: "Peak",
  pocketType: "Regular without flap",
  canvas: "Full",
});

const weddingJacketDetails = buildCustomSeedComponents({
  fabricSku: "FAB-IVORY-030",
  fabric: "Ivory stretch wool",
  buttonsSku: "BTN-IVORY-120",
  buttons: "Ivory horn",
  liningSku: "LIN-CHAMP-230",
  lining: "Champagne paisley",
  threadsSku: "THR-TONAL-301",
  threads: "Tone on tone",
  lapel: "Peak",
  pocketType: "Regular",
  canvas: "Half",
});

const receptionJacketDetails = buildCustomSeedComponents({
  fabricSku: "FAB-FRST-040",
  fabric: "Forest stretch wool",
  buttonsSku: "BTN-HORN-101",
  buttons: "Dark horn",
  liningSku: "LIN-COPPER-240",
  lining: "Copper paisley",
  threadsSku: "THR-TONAL-301",
  threads: "Tone on tone",
  lapel: "Notch",
  pocketType: "Slanted",
  canvas: "Half",
});

const motherBrideSuitDetails = buildCustomSeedComponents({
  fabricSku: "FAB-DOVE-050",
  fabric: "Soft dove wool",
  buttonsSku: "BTN-PEARL-130",
  buttons: "Pearl horn",
  liningSku: "LIN-SILVER-250",
  lining: "Silver paisley",
  threadsSku: "THR-TONAL-301",
  threads: "Tone on tone",
  lapel: "Notch",
  pocketType: "Regular",
  canvas: "Half",
});

const promTuxedoDetails = buildCustomSeedComponents({
  fabricSku: "FAB-BLK-011",
  fabric: "Black stretch wool",
  buttonsSku: "BTN-SATIN-110",
  buttons: "Black satin",
  liningSku: "LIN-ROYAL-260",
  lining: "Royal blue paisley",
  threadsSku: "THR-TONAL-301",
  threads: "Tone on tone",
  lapel: "Peak",
  pocketType: "Regular without flap",
  canvas: "Full",
});

const galaSuitDetails = buildCustomSeedComponents({
  fabricSku: "FAB-ONYX-060",
  fabric: "Onyx wool blend",
  buttonsSku: "BTN-HORN-101",
  buttons: "Dark horn",
  liningSku: "LIN-BLK-270",
  lining: "Black paisley",
  threadsSku: "THR-TONAL-301",
  threads: "Tone on tone",
  lapel: "Peak",
  pocketType: "Slanted",
  canvas: "Half",
});

const weddingSuitDetails = buildCustomSeedComponents({
  fabricSku: "FAB-MID-070",
  fabric: "Midnight navy wool",
  buttonsSku: "BTN-HORN-101",
  buttons: "Dark horn",
  liningSku: "LIN-SILVER-250",
  lining: "Silver paisley",
  threadsSku: "THR-TONAL-301",
  threads: "Tone on tone",
  lapel: "Peak",
  pocketType: "Regular",
  canvas: "Half",
});

const charcoalSuitDetails = buildCustomSeedComponents({
  fabricSku: "FAB-CHAR-080",
  fabric: "Charcoal stretch wool",
  buttonsSku: "BTN-HORN-101",
  buttons: "Dark horn",
  liningSku: "LIN-GRAPH-280",
  lining: "Graphite paisley",
  threadsSku: "THR-TONAL-301",
  threads: "Tone on tone",
  lapel: "Notch",
  pocketType: "Regular",
  canvas: "Half",
});

const editorialSuitDetails = buildCustomSeedComponents({
  fabricSku: "FAB-STONE-090",
  fabric: "Stone wool silk blend",
  buttonsSku: "BTN-MOP-140",
  buttons: "Mother-of-pearl",
  liningSku: "LIN-BLUSH-290",
  lining: "Soft blush paisley",
  threadsSku: "THR-TONAL-301",
  threads: "Tone on tone",
  lapel: "Shawl",
  pocketType: "Regular pockets, no flap",
  canvas: "Half",
});

const seedScopeLines: SeedScopeLineInput[] = [
  { id: "line-9001-1", scopeId: "scope-9001-custom", label: "Two-piece suit", quantity: 1, garmentLabel: "Two-piece suit", customComponents: classicNavySuit },
  { id: "line-9002-1", scopeId: "scope-9002-alteration", label: "Dress hem", quantity: 1, garmentLabel: "Dress", alterationServices: ["Hem"] },
  { id: "line-9002-2", scopeId: "scope-9002-alteration", label: "Vest waist suppression", quantity: 1, garmentLabel: "Vest", alterationServices: ["Stomach", "Seat"] },
  { id: "line-9003-1", scopeId: "scope-9003-alteration", label: "Trouser taper", quantity: 1, garmentLabel: "Pants", alterationServices: ["Thigh", "Bottom"] },
  { id: "line-9003-2", scopeId: "scope-9003-custom", label: "Dinner jacket", quantity: 1, garmentLabel: "Tuxedo jacket", customComponents: blackTieTuxedo },
  {
    id: "line-9003-3",
    scopeId: "scope-9003-custom",
    label: "Vest",
    quantity: 1,
    garmentLabel: "Vest",
    customComponents: buildCustomSeedComponents({
      fabricSku: "FAB-BLK-010",
      fabric: "Black barathea",
      buttonsSku: "BTN-SATIN-110",
      buttons: "Black satin",
      liningSku: "LIN-BURG-210",
      lining: "Burgundy paisley",
      threadsSku: "THR-TONAL-301",
      threads: "Tone on tone",
    }),
  },
  { id: "line-9004-1", scopeId: "scope-9004-alteration", label: "Pant hem", quantity: 1, garmentLabel: "Pants", alterationServices: ["Length"] },
  { id: "line-9005-1", scopeId: "scope-9005-alteration", label: "Rush sleeve adjustment", quantity: 1, isRush: true, garmentLabel: "Jacket", alterationServices: ["Sleeve length"] },
  { id: "line-9006-1", scopeId: "scope-9006-custom", label: "Dinner jacket", quantity: 1, garmentLabel: "Tuxedo jacket", customComponents: blackTieTuxedo },
  { id: "line-9007-1", scopeId: "scope-9007-alteration", label: "Skirt hem", quantity: 1, garmentLabel: "Skirt", alterationServices: ["Hem"] },
  { id: "line-9008-1", scopeId: "scope-9008-custom", label: "Wedding tuxedo", quantity: 1, garmentLabel: "Three-piece tuxedo", customComponents: blackTieTuxedo },
  { id: "line-9009-1", scopeId: "scope-9009-alteration", label: "Jacket suppression", quantity: 1, garmentLabel: "Jacket", alterationServices: ["Chest", "Stomach"] },
  { id: "line-9009-2", scopeId: "scope-9009-alteration", label: "Sleeve shorten", quantity: 1, garmentLabel: "Jacket", alterationServices: ["Sleeve length"] },
  { id: "line-9010-1", scopeId: "scope-9010-alteration", label: "Blouse sleeve taper", quantity: 1, garmentLabel: "Blouse", alterationServices: ["Bicep", "Sleeve length"] },
  { id: "line-9010-2", scopeId: "scope-9010-custom", label: "Reception jacket", quantity: 1, garmentLabel: "Jacket", customComponents: receptionJacketDetails },
  { id: "line-9011-1", scopeId: "scope-9011-custom", label: "Mother-of-the-bride suit", quantity: 1, garmentLabel: "Two-piece suit", customComponents: motherBrideSuitDetails },
  { id: "line-9012-1", scopeId: "scope-9012-alteration", label: "Stage pant hem", quantity: 1, garmentLabel: "Pants", alterationServices: ["Length"] },
  { id: "line-9012-2", scopeId: "scope-9012-alteration", label: "Jacket sleeve shorten", quantity: 1, garmentLabel: "Jacket", alterationServices: ["Sleeve length"] },
  { id: "line-9013-1", scopeId: "scope-9013-custom", label: "Black-tie tuxedo", quantity: 1, garmentLabel: "Three-piece tuxedo", customComponents: blackTieTuxedo },
  { id: "line-8821-1", scopeId: "scope-8821-custom", label: "Custom navy suit", quantity: 1, garmentLabel: "Two-piece suit", customComponents: classicNavySuit },
  { id: "line-8610-1", scopeId: "scope-8610-alteration", label: "Trouser hem + taper", quantity: 1, garmentLabel: "Pants", alterationServices: ["Hem", "Taper"] },
  { id: "line-8443-1", scopeId: "scope-8443-custom", label: "Dinner jacket consult", quantity: 1, unitPrice: 0, garmentLabel: "Tuxedo jacket" },
  { id: "line-8904-1", scopeId: "scope-8904-alteration", label: "Wedding party jacket alterations", quantity: 1, garmentLabel: "Jacket", alterationServices: ["Bicep", "Chest", "Sleeve length", "Lining replacement"] },
  { id: "line-8904-2", scopeId: "scope-8904-custom", label: "Wedding jacket", quantity: 1, garmentLabel: "Jacket", customComponents: weddingJacketDetails },
  { id: "line-8732-1", scopeId: "scope-8732-alteration", label: "Bridesmaid dress fitting", quantity: 1, garmentLabel: "Dress", alterationServices: ["Shoulder", "Waist"] },
  { id: "line-8940-1", scopeId: "scope-8940-alteration", label: "Rush suit sleeve adjustment", quantity: 1, isRush: true, garmentLabel: "Jacket", alterationServices: ["Sleeve length from shoulder"] },
  { id: "line-8528-1", scopeId: "scope-8528-alteration", label: "Pant waist suppression", quantity: 1, garmentLabel: "Pants", alterationServices: ["Waist", "Seat"] },
  { id: "line-9014-1", scopeId: "scope-9014-alteration", label: "Dress bustle", quantity: 1, garmentLabel: "Dress", alterationServices: ["Bustle"] },
  { id: "line-9014-2", scopeId: "scope-9014-alteration", label: "Waist take-in", quantity: 1, garmentLabel: "Dress", alterationServices: ["Waist"] },
  { id: "line-9015-1", scopeId: "scope-9015-custom", label: "Prom tuxedo", quantity: 1, garmentLabel: "Three-piece tuxedo", customComponents: promTuxedoDetails },
  { id: "line-9016-1", scopeId: "scope-9016-alteration", label: "Bridesmaid hem", quantity: 1, garmentLabel: "Dress", alterationServices: ["Hem"] },
  { id: "line-9016-2", scopeId: "scope-9016-custom", label: "Dinner jacket", quantity: 1, garmentLabel: "Jacket", customComponents: editorialSuitDetails },
  { id: "line-9017-1", scopeId: "scope-9017-alteration", label: "Suit suppression", quantity: 1, garmentLabel: "Jacket", alterationServices: ["Chest", "Stomach"] },
  { id: "line-9017-2", scopeId: "scope-9017-alteration", label: "Trouser hem", quantity: 1, garmentLabel: "Pants", alterationServices: ["Hem"] },
  { id: "line-9018-1", scopeId: "scope-9018-custom", label: "Midnight tuxedo", quantity: 1, garmentLabel: "Three-piece tuxedo", customComponents: midnightTuxedo },
  { id: "line-9019-1", scopeId: "scope-9019-alteration", label: "Trouser taper", quantity: 1, garmentLabel: "Pants", alterationServices: ["Taper"] },
  { id: "line-9019-2", scopeId: "scope-9019-custom", label: "Ceremony suit", quantity: 1, garmentLabel: "Two-piece suit", customComponents: weddingSuitDetails },
  { id: "line-9020-1", scopeId: "scope-9020-alteration", label: "Gown shoulder lift", quantity: 1, garmentLabel: "Gown", alterationServices: ["Shoulder"] },
  { id: "line-9021-1", scopeId: "scope-9021-custom", label: "Charcoal suit", quantity: 1, garmentLabel: "Two-piece suit", customComponents: charcoalSuitDetails },
  { id: "line-9022-1", scopeId: "scope-9022-alteration", label: "Sari blouse adjustment", quantity: 1, garmentLabel: "Sari blouse", alterationServices: ["Shoulder", "Waist"] },
  { id: "line-9023-1", scopeId: "scope-9023-custom", label: "Dinner suit", quantity: 1, garmentLabel: "Two-piece suit", customComponents: galaSuitDetails },
  { id: "line-9024-1", scopeId: "scope-9024-alteration", label: "Trouser hem", quantity: 1, garmentLabel: "Pants", alterationServices: ["Hem"] },
  { id: "line-9024-2", scopeId: "scope-9024-custom", label: "Wedding suit", quantity: 1, garmentLabel: "Two-piece suit", customComponents: weddingSuitDetails },
  { id: "line-9025-1", scopeId: "scope-9025-alteration", label: "Jacket suppression", quantity: 1, garmentLabel: "Jacket", alterationServices: ["Chest", "Stomach"] },
  { id: "line-9025-2", scopeId: "scope-9025-custom", label: "Ceremony suit", quantity: 1, garmentLabel: "Two-piece suit", customComponents: weddingSuitDetails },
];

function buildSeedOrderScopeLine(
  input: SeedScopeLineInput,
  ordersById: Map<string, DbOrder>,
  scopesById: Map<string, DbOrderScope>,
  measurementSets: DbMeasurementSet[],
): DbOrderScopeLine {
  const scope = scopesById.get(input.scopeId);
  const order = scope ? ordersById.get(scope.orderId) : null;
  const measurementSet = input.measurementSetId
    ? measurementSets.find((set) => set.id === input.measurementSetId) ?? null
    : scope?.workflow === "custom"
      ? getLatestMeasurementSet(input.measurementCustomerId ?? order?.payerCustomerId ?? null, measurementSets)
      : null;

  return {
    id: input.id,
    scopeId: input.scopeId,
    label: input.label,
    quantity: input.quantity,
    unitPrice: getSeedLineUnitPrice(input, scope?.workflow),
    isRush: input.isRush ?? false,
    garmentLabel: input.garmentLabel ?? (scope?.workflow === "custom" ? input.label : inferAlterationGarment(input.label)),
    wearerCustomerId: scope?.workflow === "custom" ? (input.wearerCustomerId ?? order?.payerCustomerId ?? null) : null,
    wearerName: scope?.workflow === "custom" ? (input.wearerName ?? order?.payerName ?? null) : null,
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

  return seedScopeLines.map((line) => buildSeedOrderScopeLine(line, ordersById, scopesById, measurementSets));
}

export function createOrderScopeLineComponents(orderScopeLines: DbOrderScopeLine[], orderScopes: DbOrderScope[]): DbOrderScopeLineComponent[] {
  const scopesById = new Map(orderScopes.map((scope) => [scope.id, scope]));
  const seedLinesById = new Map(seedScopeLines.map((line) => [line.id, line]));

  return orderScopeLines.flatMap((line) => {
    const scope = scopesById.get(line.scopeId);
    const seedLine = seedLinesById.get(line.id);
    const components: DbOrderScopeLineComponent[] = [];

    if (scope?.workflow === "alteration") {
      (seedLine?.alterationServices ?? inferAlterationServices(line.label)).forEach((service, index) => {
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

    seedLine?.customComponents?.forEach((component, index) => {
      components.push({
        id: `${line.id}-${component.kind}-${index + 1}`,
        lineId: line.id,
        kind: component.kind,
        label: component.label,
        value: component.value,
        sortOrder: index + 3,
      });
    });

    return components;
  });
}
