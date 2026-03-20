import { CreditCard } from "lucide-react";
import type { OrderType } from "../types";
import { ActionButton, Card, EntityRow, SectionHeader, StatusPill } from "../components/ui/primitives";

type CheckoutScreenProps = {
  orderType: OrderType | null;
};

export function CheckoutScreen({ orderType }: CheckoutScreenProps) {
  const hasAlterations = orderType === "alteration" || orderType === "mixed";
  const hasCustom = orderType === "custom" || orderType === "mixed";

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="p-4">
        <SectionHeader
          icon={CreditCard}
          title="Checkout"
          subtitle={
            orderType === "mixed"
              ? "Save, send, collect deposit"
              : orderType === "alteration"
                ? "Save, send, collect"
                : orderType === "custom"
                  ? "Save, send, collect deposit"
                  : "Select an order type first"
          }
        />

        <div className="space-y-3 text-sm text-slate-700">
          <div className="app-panel-section">
            <div className="mb-1 font-semibold text-slate-900">1. Save to Airtable</div>
            <div>Write customer, order, items, and linked records.</div>
          </div>
          <div className="app-panel-section">
            <div className="mb-1 font-semibold text-slate-900">2. Send to Square</div>
            <div>
              {orderType === "mixed"
                ? "Create the order so deposit and alterations can be handled together."
                : orderType === "alteration"
                  ? "Ready for terminal pickup."
                  : orderType === "custom"
                    ? "Create the order so deposit can be collected."
                : "Select an order type first."}
            </div>
          </div>
          <div className="app-panel-section">
            <div className="mb-1 font-semibold text-slate-900">3. Collect payment</div>
            <div>Staff completes payment in Square.</div>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <Card className="p-4">
          <div className="mb-3 font-semibold text-slate-900">Checks</div>
          <div className="space-y-2 text-sm text-slate-700">
            <div className="app-panel-section">Check in the appointment first.</div>
            {hasAlterations ? <div className="app-panel-section">Alterations require pickup date, time, and location.</div> : null}
            {hasCustom ? <div className="app-panel-section">Custom orders require measurements and pricing.</div> : null}
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-3 font-semibold text-slate-900">Sync status</div>
          <div className="mb-4 space-y-2 text-sm text-slate-700">
            <EntityRow title="Airtable write" meta={<StatusPill>Ready</StatusPill>} />
            <EntityRow title="Square order" meta={<StatusPill tone="warn">Pending</StatusPill>} />
            <EntityRow
              title="Payment collection"
              meta={<StatusPill>{hasCustom ? "Deposit due" : orderType === "alteration" ? "At terminal" : "Blocked"}</StatusPill>}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ActionButton tone="secondary">Save draft</ActionButton>
            <ActionButton tone="primary">Send to Square</ActionButton>
          </div>
        </Card>
      </div>
    </div>
  );
}
