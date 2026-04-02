import { CalendarClock, MapPin } from "lucide-react";
import { ActionButton, ModalShell, cx } from "../../../components/ui/primitives";
import { ModalFooterActions, ModalMetaRow, ModalPanel } from "../../../components/ui/modalPatterns";
import type { OpenOrder } from "../../../types";
import {
  getMarkReadyActionLabel,
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
            {pendingPickupCount === 1 ? (
              <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="app-text-overline">{getScopeLabel(pendingPickups[0].scope)} pickup</div>
                  <div className="app-text-value">{getPickupHeadline(pendingPickups[0])}</div>
                  <div className="app-text-body">{openOrder.payerName} • Order #{openOrder.id}</div>
                </div>
                <div className="w-[190px] shrink-0 space-y-2 border-l border-[var(--app-border)]/35 pl-4">
                  <div className="app-modal-meta-item app-text-caption">
                    <CalendarClock className="h-3.5 w-3.5 shrink-0 text-[var(--app-text-soft)]" />
                    <span>
                      {getOperationalPickupDateLabel(pendingPickups[0].pickupDate, pendingPickups[0].pickupTime) ?? "Date pending"} ·{" "}
                      {getOperationalPickupTimeLabel(pendingPickups[0].pickupDate, pendingPickups[0].pickupTime) ?? "Time pending"}
                    </span>
                  </div>
                  <div className="app-modal-meta-item app-text-caption">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--app-text-soft)]" />
                    <span>{pendingPickups[0].pickupLocation || "Location pending"}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="app-text-overline">{pendingPickupCount} pickups</div>
                <div className="app-text-value">{openOrder.payerName}</div>
                <div className="app-text-body">Order #{openOrder.id}</div>
              </div>
            )}

            <div className={cx("space-y-2", pendingPickupCount === 1 && "hidden")}>
              {pendingPickups.map((pickup, index) => {
                const dateLabel = getOperationalPickupDateLabel(pickup.pickupDate, pickup.pickupTime) ?? "Date pending";
                const timeLabel = getOperationalPickupTimeLabel(pickup.pickupDate, pickup.pickupTime) ?? "Time pending";

                return (
                  <ModalPanel
                    key={pickup.id}
                    className={cx("flex items-start gap-4", index > 0 && "")}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <div className="app-text-strong">{getPickupHeadline(pickup)}</div>
                        <div className="app-text-caption">{getScopeLabel(pickup.scope)} pickup</div>
                      </div>
                      {pickup.label && pickup.label !== getPickupHeadline(pickup) ? (
                        <div className="app-text-body-muted">{pickup.label}</div>
                      ) : null}
                    </div>
                    <div className="w-[190px] shrink-0 space-y-2 border-l border-[var(--app-border)]/35 pl-4">
                      <div className="app-modal-meta-item app-text-caption">
                        <CalendarClock className="h-3.5 w-3.5 shrink-0 text-[var(--app-text-soft)]" />
                        <span>{dateLabel} · {timeLabel}</span>
                      </div>
                      <div className="app-modal-meta-item app-text-caption">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--app-text-soft)]" />
                        <span>{pickup.pickupLocation || "Location pending"}</span>
                      </div>
                    </div>
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
