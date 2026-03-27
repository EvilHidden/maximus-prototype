import type { OrderWorkflowState, PricingSummary } from "../../types";
import { getCustomGarmentPrice } from "../../db/pricing";

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

export function getPricingSummary(order: OrderWorkflowState): PricingSummary {
  const alterationsSubtotal = order.alteration.items.reduce((sum, item) => sum + item.subtotal, 0);
  const customSubtotal = order.custom.items.reduce((sum, item) => sum + getCustomGarmentPrice(item.selectedGarment), 0);
  const subtotal = alterationsSubtotal + customSubtotal;
  const taxAmount = subtotal * 0.08875;
  const depositDue = customSubtotal > 0 ? Math.round(customSubtotal * 0.5 * 100) / 100 : 0;

  return {
    alterationsSubtotal,
    customSubtotal,
    taxAmount,
    depositDue,
    total: subtotal + taxAmount,
  };
}

export function formatSummaryCurrency(value: number) {
  return formatCurrency(value);
}

export { getCustomGarmentPrice };
