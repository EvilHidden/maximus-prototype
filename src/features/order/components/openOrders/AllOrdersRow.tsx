import { MapPin } from "lucide-react";
import type { KeyboardEvent } from "react";
import type { OpenOrder } from "../../../../types";
import { RowChevronAffordance, cx } from "../../../../components/ui/primitives";
import {
  getOpenOrderLocationSummary,
  getOpenOrderOperationalLane,
  getOpenOrderPickupGroups,
  getOpenOrderReadinessBreakdown,
  getOpenOrderStatusPills,
  getOperationalPickupDateLabel,
  getOperationalPickupTimeLabel,
} from "../../selectors";
import {
  getCompactPickupScheduleSummary,
  getOrderTimelineSummary,
  getWorkflowSummaryLabel,
  summarizeGroupedOrderItems,
} from "./openOrdersFormatting";
import { OPEN_ORDER_ROW_GRID_CLASS, READY_ORDER_ROW_GRID_CLASS } from "./openOrdersLayout";
import {
  OpenOrdersActionSection,
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

function getFallbackGroupStatusLabel(openOrder: OpenOrder, index: number) {
  if (openOrder.orderType === "mixed") {
    return index === 0 ? "Alterations in progress" : "Custom in progress";
  }

  return getOpenOrderOperationalLane(openOrder);
}

function getGroupedStatusLabel(openOrder: OpenOrder, index: number, label?: string) {
  const baseLabel = label ?? getFallbackGroupStatusLabel(openOrder, index);

  if (openOrder.orderType !== "mixed") {
    return baseLabel;
  }

  const condensedLabel = baseLabel
    .replace(/^Alterations\s+/i, "")
    .replace(/^Custom\s+/i, "")
    .trim();

  return condensedLabel.charAt(0).toUpperCase() + condensedLabel.slice(1);
}

function getStatusForScope(openOrder: OpenOrder, scope: OpenOrder["pickupSchedules"][number]["scope"]) {
  if (openOrder.orderType !== "mixed") {
    const statusPill = getOpenOrderStatusPills(openOrder)[0];
    return {
      label: statusPill?.label ?? getOpenOrderOperationalLane(openOrder),
      tone: statusPill?.tone ?? "default",
    };
  }

  const breakdown = getOpenOrderReadinessBreakdown(openOrder);

  if (scope === "alteration") {
    const label = breakdown.alterationPickedUp
      ? "Picked up"
      : breakdown.alterationReady
        ? "Ready"
        : "In progress";
    const tone = breakdown.alterationPickedUp || breakdown.alterationReady ? "success" as const : "default" as const;
    return { label, tone };
  }

  const label = breakdown.customPickedUp
    ? "Picked up"
    : breakdown.customReady
      ? "Ready"
      : "In progress";
  const tone = breakdown.customPickedUp || breakdown.customReady ? "success" as const : "default" as const;
  return { label, tone };
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
  const rowGridClassName = isReadyVariant ? READY_ORDER_ROW_GRID_CLASS : OPEN_ORDER_ROW_GRID_CLASS;
  const workflowLabel = getWorkflowSummaryLabel(openOrder.orderType);
  const readyByGroups: OpenOrdersReadyByGroup[] = isReadyVariant
    ? [{
        key: `ready-${openOrder.id}`,
        dateLabel: readyPickupSummary.scheduleSummary || "Pickup pending",
        location: readyPickupSummary.locations,
      }]
    : pickupGroups.map((group, index) => {
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
          summary: summarizeGroupedOrderItems(group.itemSummary) || timeline.items,
          secondary: openOrder.inHouseAssignee && group.scope === "alteration"
            ? `Assigned to ${openOrder.inHouseAssignee.name}`
            : null,
        };
      });
  const statusRows: OpenOrdersStatusRow[] = isReadyVariant
    ? [{
        key: `ready-status-${openOrder.id}`,
        label: readyStatusSummary.primary.label,
        tone: readyStatusSummary.primary.tone,
        secondary: readyStatusSummary.secondary,
      }]
    : pickupGroups.map((group, index) => {
        const scopedStatus = getStatusForScope(openOrder, group.scope);

        return {
          key: `${group.key}-status`,
          label: getGroupedStatusLabel(openOrder, index, scopedStatus.label),
          tone: scopedStatus.tone,
        };
      });
  const actionRows: OpenOrdersActionRow[] = isReadyVariant
    ? [{ key: `ready-action-${openOrder.id}` }]
    : pickupGroups.map((group) => ({
        key: `${group.key}-action`,
        label: group.actionPickupIds.length ? "Ready" : undefined,
        onClick: group.actionPickupIds.length
          ? () => onRequestMarkOpenOrderPickupReady(openOrder, group.actionPickupIds)
          : undefined,
      }));
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
            <OpenOrdersReadyBySection groups={readyByGroups} />
            <OpenOrdersStatusSection rows={statusRows} />
            <OpenOrdersActionSection rows={actionRows} />
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
