import { MapPin } from "lucide-react";
import type { KeyboardEvent } from "react";
import type { OpenOrder } from "../../../../types";
import { ActionButton, RowChevronAffordance, cx } from "../../../../components/ui/primitives";
import {
  getOpenOrderOperationalPhase,
  getOpenOrderLocationSummary,
  getOpenOrderPickupGroups,
  getOpenOrderReadinessDetails,
  getOpenOrderReadinessBreakdown,
} from "../../selectors";
import { getPhaseTone, getWorklistPhaseLabel } from "./meta";
import { getCompactPickupScheduleSummary, getOrderTimelineSummary, getOrdersStatusTextClassName, getPickupLocationSummary, getWorkflowSummaryLabel } from "./openOrdersFormatting";
import { OPEN_ORDER_ROW_GRID_CLASS, READY_ORDER_ROW_GRID_CLASS } from "./openOrdersLayout";
import {
  OpenOrdersIdentitySection,
  OpenOrdersMobileReadyStatusLayout,
  OpenOrdersReadyBySection,
  OpenOrdersStatusSection,
  OpenOrdersTotalSection,
  type OpenOrdersActionRow,
  type OpenOrdersReadyByGroup,
  type OpenOrdersStatusRow,
} from "./OpenOrdersRowSections";

function getReadyPickupSummary(openOrder: OpenOrder) {
  const readyPickups = openOrder.pickupSchedules.filter((pickup) => pickup.readyForPickup && !pickup.pickedUp);
  const readyAndPickedUpPickups = openOrder.pickupSchedules.filter((pickup) => pickup.readyForPickup || pickup.pickedUp);
  const displayPickups = readyPickups.length
    ? openOrder.orderType === "mixed" && readyAndPickedUpPickups.length > readyPickups.length
      ? readyAndPickedUpPickups
      : readyPickups
    : openOrder.pickupSchedules;
  const locations = [...new Set(displayPickups.map((pickup) => pickup.pickupLocation).filter(Boolean))].join(" • ");
  const scheduleSummary = getCompactPickupScheduleSummary(displayPickups);

  return {
    locations: locations || getOpenOrderLocationSummary(openOrder) || "Pending",
    scheduleSummary,
  };
}

function getReadyMixedStatusSummary(openOrder: OpenOrder) {
  if (openOrder.orderType !== "mixed") {
    return null;
  }

  const breakdown = getOpenOrderReadinessBreakdown(openOrder);
  const primary = breakdown.alterationReady
    ? { label: "Alteration ready", tone: "success" as const }
    : breakdown.customReady
      ? { label: "Custom Garment ready", tone: "success" as const }
      : null;

  if (!primary) {
    return null;
  }

  const secondary = breakdown.alterationReady
    ? breakdown.customPickedUp
      ? "Custom Garment: Picked up"
      : breakdown.customReady
        ? "Custom Garment: Ready"
        : "Custom Garment: In progress"
    : breakdown.alterationPickedUp
      ? "Alteration: Picked up"
      : breakdown.alterationReady
        ? "Alteration: Ready"
        : "Alteration: In progress";

  return { primary, secondary };
}

function getReadyStatusSummary(openOrder: OpenOrder) {
  const mixedStatusSummary = getReadyMixedStatusSummary(openOrder);
  if (mixedStatusSummary) {
    return mixedStatusSummary;
  }

  return {
    primary: { label: "Ready", tone: "success" as const },
    secondary: null,
  };
}

function getAggregateActiveStatus(openOrder: OpenOrder) {
  const phase = getOpenOrderOperationalPhase(openOrder);
  const readinessDetails = getOpenOrderReadinessDetails(openOrder);

  return {
    label: getWorklistPhaseLabel(phase),
    tone: getPhaseTone(phase),
    secondary: openOrder.orderType === "mixed" ? readinessDetails.join(" • ") || null : null,
  };
}

export function AllOrdersRow({
  openOrder,
  onRequestMarkOpenOrderPickupReady,
  onOpenOrderDetails,
  variant = "default",
}: {
  openOrder: OpenOrder;
  onRequestMarkOpenOrderPickupReady: (openOrder: OpenOrder, pickupIds: string[]) => void;
  onOpenOrderDetails: (openOrderId: number) => void;
  variant?: "default" | "ready" | "factory";
}) {
  const timeline = getOrderTimelineSummary(openOrder);
  const isFactoryVariant = variant === "factory";
  const isReadyVariant = variant === "ready";
  const pickupGroups = getOpenOrderPickupGroups(openOrder, {
    includePickedUp: openOrder.orderType === "mixed",
    scopes: isFactoryVariant ? ["custom"] : undefined,
  });
  const readyPickupSummary = getReadyPickupSummary(openOrder);
  const readyStatusSummary = getReadyStatusSummary(openOrder);
  const activeStatusSummary = getAggregateActiveStatus(openOrder);
  const rowGridClassName = isReadyVariant ? READY_ORDER_ROW_GRID_CLASS : OPEN_ORDER_ROW_GRID_CLASS;
  const workflowLabel = getWorkflowSummaryLabel(openOrder.orderType);
  const summaryPickups = openOrder.pickupSchedules.filter((pickup) => !pickup.pickedUp && (!isFactoryVariant || pickup.scope === "custom"));
  const actionPickupIds = pickupGroups.flatMap((group) => group.actionPickupIds);
  const readyByGroups: OpenOrdersReadyByGroup[] = isReadyVariant
    ? [{
        key: `ready-${openOrder.id}`,
        dateLabel: readyPickupSummary.scheduleSummary || "Pickup pending",
        location: readyPickupSummary.locations,
      }]
    : [{
        key: `summary-${openOrder.id}`,
        dateLabel: getCompactPickupScheduleSummary(summaryPickups) || timeline.schedule,
        location: getPickupLocationSummary(summaryPickups) || getOpenOrderLocationSummary(openOrder) || "Pending",
      }];
  const statusRows: OpenOrdersStatusRow[] = isReadyVariant
    ? [{
        key: `ready-status-${openOrder.id}`,
        label: readyStatusSummary.primary.label,
        tone: readyStatusSummary.primary.tone,
        secondary: readyStatusSummary.secondary,
      }]
    : [{
        key: `status-${openOrder.id}`,
        label: activeStatusSummary.label,
        tone: activeStatusSummary.tone,
      }];
  const actionRows: OpenOrdersActionRow[] = isReadyVariant
    ? [{ key: `ready-action-${openOrder.id}` }]
    : [{
        key: `action-${openOrder.id}`,
        label: actionPickupIds.length ? "Ready" : undefined,
        onClick: actionPickupIds.length ? () => onRequestMarkOpenOrderPickupReady(openOrder, actionPickupIds) : undefined,
      }];
  const handleOpen = () => onOpenOrderDetails(openOrder.id);
  const handleRowKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOpen();
    }
  };

  return (
    <div
      className={cx("group relative cursor-pointer pr-12 min-[1000px]:pr-14", rowGridClassName)}
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
              workflowLabel={workflowLabel}
              compactDesktop
            />
          </div>
          <OpenOrdersTotalSection total={openOrder.total} balanceDue={openOrder.balanceDue} amountClassName="text-[1.125rem]" />
        </div>

        {isReadyVariant ? (
          <OpenOrdersMobileReadyStatusLayout
            left={(
              <div className="min-w-0">
                <div className="app-text-body font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[var(--app-text-soft)]" />
                    <span>{readyPickupSummary.locations}</span>
                  </span>
                </div>
                {readyPickupSummary.scheduleSummary ? (
                  <div className="app-text-caption mt-1.5">{readyPickupSummary.scheduleSummary}</div>
                ) : null}
              </div>
            )}
            right={(
              <div className="min-w-[5.25rem] text-right">
                <div className="text-[0.8rem] font-semibold leading-tight text-[var(--app-success-text)]">
                  {readyStatusSummary.primary.label}
                </div>
                {readyStatusSummary.secondary ? (
                  <div className="app-text-caption mt-1">{readyStatusSummary.secondary}</div>
                ) : null}
              </div>
            )}
          />
        ) : null}
      </div>

      <div className="hidden min-[1000px]:contents">
        <OpenOrdersIdentitySection
          payerName={openOrder.payerName}
          orderId={openOrder.id}
          createdAt={openOrder.createdAt}
          workflowLabel={workflowLabel}
        />
        {isReadyVariant ? null : (
          <>
            <div className="min-w-0">
              <div className="app-text-body font-medium">{readyByGroups[0]?.dateLabel}</div>
              {readyByGroups[0]?.location ? (
                <div className="app-text-caption mt-1 inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[var(--app-text-soft)]" />
                  <span>{readyByGroups[0].location}</span>
                </div>
              ) : null}
            </div>
            <div className="min-w-0 pt-0.5">
              {statusRows[0]?.label ? <div className={getOrdersStatusTextClassName(statusRows[0].tone)}>{statusRows[0].label}</div> : null}
            </div>
            <div className="min-w-0 pt-0.5">
              {actionRows[0]?.label && actionRows[0].onClick ? (
                <ActionButton
                  tone="primary"
                  className="min-w-[4.75rem] justify-center whitespace-nowrap px-3 py-1.5 text-[0.68rem]"
                  disabled={actionRows[0].disabled}
                  onClick={(event) => {
                    event.stopPropagation();
                    actionRows[0].onClick?.();
                  }}
                >
                  {actionRows[0].label}
                </ActionButton>
              ) : null}
            </div>
          </>
        )}
        {isReadyVariant ? (
          <>
            <OpenOrdersReadyBySection groups={readyByGroups} />
            <OpenOrdersStatusSection rows={statusRows} />
          <div className="min-w-0" />
            <OpenOrdersTotalSection
              total={openOrder.total}
              balanceDue={openOrder.balanceDue}
              className="pt-1 min-[1000px]:pt-0 min-[1000px]:text-right"
            />
          </>
        ) : (
          <OpenOrdersTotalSection total={openOrder.total} balanceDue={openOrder.balanceDue} />
        )}
      </div>
      <RowChevronAffordance />
    </div>
  );
}
