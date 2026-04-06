import type { OrderWorkflowState, PricingSummary } from "../../types";
import {
  DEFAULT_CUSTOM_DEPOSIT_RATE,
  DEFAULT_TAX_RATE,
  getCustomGarmentPrice,
  type PricingComputationConfig,
} from "../../db/pricing";

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

export function getPricingSummary(order: OrderWorkflowState, config: PricingComputationConfig = {}): PricingSummary {
  const alterationsSubtotal = order.alteration.items.reduce((sum, item) => sum + item.subtotal, 0);
  const customSubtotal = order.custom.items.reduce(
    (sum, item) => sum + getCustomGarmentPrice(item, config.pricingBooks),
    0,
  );
  const subtotal = alterationsSubtotal + customSubtotal;
  const taxAmount = subtotal * (config.taxRate ?? DEFAULT_TAX_RATE);
  const depositDue = customSubtotal > 0
    ? Math.round(customSubtotal * (config.customDepositRate ?? DEFAULT_CUSTOM_DEPOSIT_RATE) * 100) / 100
    : 0;

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
