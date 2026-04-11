import { CalendarClock, MapPin } from "lucide-react";
import { ActionButton, ModalShell, cx } from "../../../components/ui/primitives";
import { ModalFooterActions, ModalMetaRow, ModalPanel, ModalSectionHeading, ModalSummaryCard } from "../../../components/ui/modalPatterns";
import type { OpenOrder } from "../../../types";
import {
  getMarkReadyActionLabel,
  getOpenOrderTypeLabel,
  getOperationalPickupDateLabel,
  getOperationalPickupTimeLabel,
} from "../selectors";

type ConfirmMarkReadyModalProps = {
  openOrder: OpenOrder;
  pickupIds: string[];
  onConfirm: () => void;
  onClose: () => void;
};

function getScopeLabel(scope: OpenOrder["pickupSchedules"][number]["scope"]) {
  return scope === "custom" ? "Custom garment" : "Alterations";
}

function getPickupHeadline(pickup: OpenOrder["pickupSchedules"][number]) {
  const summary = pickup.itemSummary.join(" · ").trim();

  if (!summary) {
    return pickup.label;
  }

  if (pickup.scope === "alteration") {
    return summary.replace(/\s+alterations?$/i, "");
  }

  return summary;
}

function getPickupTimingLabel(pickup: OpenOrder["pickupSchedules"][number]) {
  const dateLabel = getOperationalPickupDateLabel(pickup.pickupDate, pickup.pickupTime) ?? "Date pending";
  const timeLabel = getOperationalPickupTimeLabel(pickup.pickupDate, pickup.pickupTime) ?? "Time pending";

  return `${dateLabel} · ${timeLabel}`;
}

export function ConfirmMarkReadyModal({
  openOrder,
  pickupIds,
  onConfirm,
  onClose,
}: ConfirmMarkReadyModalProps) {
  const pendingPickups = openOrder.pickupSchedules.filter((pickup) => pickupIds.includes(pickup.id));
  const pendingPickupCount = pendingPickups.length;
  const confirmLabel = getMarkReadyActionLabel(openOrder, pendingPickupCount);

  return (
    <ModalShell
      title={confirmLabel}
      onClose={onClose}
      showCloseButton={false}
      widthClassName="max-w-[560px]"
      footer={
        <ModalFooterActions>
          <ActionButton tone="secondary" onClick={onClose}>
            Back
          </ActionButton>
          <ActionButton tone="primary" onClick={onConfirm}>
            {confirmLabel}
          </ActionButton>
        </ModalFooterActions>
      }
    >
      <div className="space-y-4">
        {pendingPickups.length ? (
          <div className="space-y-3">
            <ModalSummaryCard
              eyebrow="Order"
              title={openOrder.payerName}
              meta={(
                <ModalMetaRow
                  items={[
                    { content: `${getOpenOrderTypeLabel(openOrder.orderType)} • Order #${openOrder.id}` },
                    ...(pendingPickupCount > 1 ? [{ content: `${pendingPickupCount} pickups selected` }] : []),
                  ]}
                />
              )}
              aside={(
                <div className="rounded-[var(--app-radius-sm)] border border-[color-mix(in_srgb,var(--app-accent)_22%,var(--app-border))] bg-[color-mix(in_srgb,var(--app-accent)_7%,var(--app-surface))] px-3 py-2 text-right">
                  <div className="app-text-overline text-[color-mix(in_srgb,var(--app-accent)_72%,var(--app-text-soft))]">Ready now</div>
                  <div className="mt-1 app-text-value">
                    {pendingPickupCount > 1 ? `${pendingPickupCount} pickups` : getScopeLabel(pendingPickups[0].scope)}
                  </div>
                </div>
              )}
            />

            <ModalSectionHeading
              eyebrow={pendingPickupCount > 1 ? "Selected pickups" : "Selected pickup"}
              title={pendingPickupCount > 1 ? "Check the schedules you’re closing out" : "Confirm the schedule you’re closing out"}
            />

            <div className="space-y-2">
              {pendingPickups.map((pickup, index) => {
                return (
                  <ModalPanel
                    key={pickup.id}
                    tone={pendingPickupCount === 1 ? "muted" : "default"}
                    className="space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <div className="app-text-strong">{getPickupHeadline(pickup)}</div>
                        </div>
                        {pickup.label && pickup.label !== getPickupHeadline(pickup) ? (
                          <div className="app-text-body-muted">{pickup.label}</div>
                        ) : pendingPickupCount > 1 ? (
                          <div className="app-text-body-muted">{getScopeLabel(pickup.scope)} pickup</div>
                        ) : null}
                      </div>
                      {pendingPickupCount > 1 ? (
                        <div className="app-text-caption">#{index + 1}</div>
                      ) : null}
                    </div>

                    <ModalMetaRow
                      items={[
                        { icon: CalendarClock, content: getPickupTimingLabel(pickup) },
                        { icon: MapPin, content: pickup.pickupLocation || "Location pending" },
                      ]}
                    />
                  </ModalPanel>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </ModalShell>
  );
}
