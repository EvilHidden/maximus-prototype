import { PackageSearch } from "lucide-react";
import type { KeyboardEvent } from "react";
import type { OpenOrder } from "../../../../types";
import { EmptyState, RowChevronAffordance } from "../../../../components/ui/primitives";
import {
  getNeedsAttentionPickupGroups,
  getNeedsAttentionGroupState,
  getOperationalPickupDateLabel,
  getOperationalPickupTimeLabel,
  type OrdersQueueKey,
} from "../../selectors";
import { formatWorklistTotal, getWorklistPaymentLabel, getWorklistPaymentTextClassName, queueMeta, queueOverviewMeta } from "./meta";
import { getWorkflowSummaryLabel, summarizeGroupedOrderItems } from "./openOrdersFormatting";
import {
  NEEDS_ATTENTION_ROW_GRID_CLASS,
  NeedsAttentionColumnHeader,
  OpenOrdersPanelHeader,
  openOrdersSectionClassName,
} from "./openOrdersLayout";
import {
  OpenOrdersActionSection,
  OpenOrdersIdentitySection,
  OpenOrdersReadyBySection,
  OpenOrdersStatusSection,
  OpenOrdersTotalSection,
  type OpenOrdersActionRow,
  type OpenOrdersReadyByGroup,
  type OpenOrdersStatusRow,
} from "./OpenOrdersRowSections";

function WorkQueueOrderRow({
  openOrder,
  onStartOpenOrderWork,
  onRequestMarkOpenOrderPickupReady,
  onOpenOrderDetails,
}: {
  openOrder: OpenOrder;
  onStartOpenOrderWork: (openOrderId: number) => void;
  onRequestMarkOpenOrderPickupReady: (openOrder: OpenOrder, pickupIds: string[]) => void;
  onOpenOrderDetails: (openOrderId: number) => void;
}) {
  const pickupGroups = getNeedsAttentionPickupGroups(openOrder);
  const primaryAttentionGroup = pickupGroups.find((group) => group.actionPickupIds.length > 0) ?? pickupGroups[0];
  const primaryAttentionState = primaryAttentionGroup
    ? getNeedsAttentionGroupState(openOrder, primaryAttentionGroup)
    : null;
  const handleOpen = () => onOpenOrderDetails(openOrder.id);
  const handleRowKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOpen();
    }
  };

  const readyByGroups: OpenOrdersReadyByGroup[] = pickupGroups.map((group) => {
    const uniqueItems = [...new Set(group.itemSummary)];
    const representativePickup = openOrder.pickupSchedules.find((pickup) => pickup.id === group.pickupIds[0]);

    return {
      key: group.key,
      dateLabel: representativePickup
        ? getOperationalPickupDateLabel(representativePickup.pickupDate, representativePickup.pickupTime) ?? "Date pending"
        : "Date pending",
      timeLabel: representativePickup
        ? getOperationalPickupTimeLabel(representativePickup.pickupDate, representativePickup.pickupTime)
        : null,
      location: representativePickup?.pickupLocation ?? null,
      summary: summarizeGroupedOrderItems(uniqueItems),
    };
  });
  const statusRows: OpenOrdersStatusRow[] = primaryAttentionState
    ? [{ key: `status-${openOrder.id}`, label: primaryAttentionState.label, tone: primaryAttentionState.tone }]
    : [];
  const actionRows: OpenOrdersActionRow[] = primaryAttentionState?.actionKind === "start_work"
    ? [{
        key: `action-${openOrder.id}`,
        label: "Start work",
        disabled: primaryAttentionState.actionDisabled,
        onClick: () => onStartOpenOrderWork(openOrder.id),
      }]
    : primaryAttentionState?.actionKind === "mark_ready" && primaryAttentionGroup?.actionPickupIds.length
      ? [{
          key: `action-${openOrder.id}`,
          label: "Ready",
          onClick: () => onRequestMarkOpenOrderPickupReady(openOrder, primaryAttentionGroup.actionPickupIds),
        }]
      : [{ key: `action-${openOrder.id}` }];

  return (
    <div
      className="group relative cursor-pointer px-4 py-3.5 pr-12 min-[1000px]:px-3.5 min-[1000px]:py-3 min-[1000px]:pr-14"
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={handleRowKeyDown}
    >
      <div className="space-y-3 min-[1000px]:hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <OpenOrdersIdentitySection
              payerName={openOrder.payerName}
              orderId={openOrder.id}
              createdAt={openOrder.createdAt}
              workflowLabel={getWorkflowSummaryLabel(openOrder.orderType)}
              compactDesktop
            />
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[1.125rem] font-semibold leading-none tracking-[-0.01em] [font-variant-numeric:tabular-nums] text-[var(--app-text)]">
              {formatWorklistTotal(openOrder.total)}
            </div>
            <div className="mt-1">
              <span className={getWorklistPaymentTextClassName(openOrder.balanceDue)}>{getWorklistPaymentLabel(openOrder.balanceDue)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={NEEDS_ATTENTION_ROW_GRID_CLASS}>
        <OpenOrdersIdentitySection
          payerName={openOrder.payerName}
          orderId={openOrder.id}
          createdAt={openOrder.createdAt}
          workflowLabel={getWorkflowSummaryLabel(openOrder.orderType)}
          compactDesktop
        />
        <OpenOrdersReadyBySection groups={readyByGroups} />
        <OpenOrdersStatusSection rows={statusRows} />
        <OpenOrdersActionSection
          rows={actionRows}
          buttonClassName="min-h-9 min-w-[4.5rem] justify-center whitespace-nowrap px-2.5 py-1.5 text-[0.68rem]"
        />
        <OpenOrdersTotalSection
          total={openOrder.total}
          balanceDue={openOrder.balanceDue}
          className="min-[1000px]:min-w-[7.5rem]"
          amountClassName="text-[1.25rem] min-[1000px]:text-[1.2rem]"
        />
      </div>
      <RowChevronAffordance />
    </div>
  );
}

export function QueueSection({
  activeQueue,
  openOrders,
  onStartOpenOrderWork,
  onRequestMarkOpenOrderPickupReady,
  onOpenOrderDetails,
}: {
  activeQueue: OrdersQueueKey;
  openOrders: OpenOrder[];
  onStartOpenOrderWork: (openOrderId: number) => void;
  onRequestMarkOpenOrderPickupReady: (openOrder: OpenOrder, pickupIds: string[]) => void;
  onOpenOrderDetails: (openOrderId: number) => void;
}) {
  const count = openOrders.length;

  if (!count) {
    return (
      <div className="app-work-surface app-console-board app-orders-workboard app-orders-workboard--queue">
        <div className="min-h-[4.5rem] px-4 py-4">
          <OpenOrdersPanelHeader
            icon={PackageSearch}
            title={queueMeta.find((queue) => queue.key === activeQueue)?.label ?? "Queue"}
            subtitle={
              activeQueue === "all"
                ? "Active orders that need attention."
                : queueOverviewMeta.find((queue) => queue.key === activeQueue)?.subtitle ?? "Orders in this view."
            }
          />
      </div>
      <div className="border-t border-[var(--app-border)]/45">
          <EmptyState className="rounded-none border-0 bg-transparent shadow-none">
            <div className="app-text-body">Nothing matches this queue and filter combination.</div>
          </EmptyState>
        </div>
      </div>
    );
  }

  return (
    <div className="app-work-surface app-console-board app-orders-workboard app-orders-workboard--queue">
      <div className="min-h-[4.5rem] px-4 py-4">
        <OpenOrdersPanelHeader
          icon={PackageSearch}
          title={queueMeta.find((queue) => queue.key === activeQueue)?.label ?? "Queue"}
          subtitle={
            activeQueue === "all"
              ? "Active orders that need attention."
              : queueOverviewMeta.find((queue) => queue.key === activeQueue)?.subtitle ?? "Orders in this view."
          }
        />
      </div>
      <div className="border-t border-[var(--app-border)]/45">
        <NeedsAttentionColumnHeader />
        <div>
          {openOrders.map((openOrder, index) => (
            <div
              key={openOrder.id}
              className={openOrdersSectionClassName(index > 0)}
            >
              <WorkQueueOrderRow
                openOrder={openOrder}
                onStartOpenOrderWork={onStartOpenOrderWork}
                onRequestMarkOpenOrderPickupReady={onRequestMarkOpenOrderPickupReady}
                onOpenOrderDetails={onOpenOrderDetails}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
