export function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export function getCustomGarmentPrice(garment: string | null) {
  if (!garment) {
    return 0;
  }

  if (garment === "Three-piece suit" || garment === "Three-piece tuxedo") {
    return 2495;
  }

  return 1495;
}

export function getAlterationServicePrice(
  alterationServiceDefinitions: Array<{ category: string; name: string; price: number }>,
  garmentLabel: string,
  serviceName: string,
) {
  return alterationServiceDefinitions.find((service) => (
    service.category === garmentLabel && service.name === serviceName
  ))?.price ?? 0;
}
