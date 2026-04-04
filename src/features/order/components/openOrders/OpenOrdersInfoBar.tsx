import { OperatorQueueSummary } from "./OperatorQueuePanel";
import type { OperatorQueueStageCounts, OperatorQueueStageKey } from "../../selectors";

export function OpenOrdersInfoBar({
  stageCounts,
  onShowAlterationsView,
}: {
  stageCounts: OperatorQueueStageCounts;
  onShowAlterationsView: () => void;
}) {
  const handleStageSelect = (stageKey: OperatorQueueStageKey) => {
    onShowAlterationsView();

    window.setTimeout(() => {
      const target = document.getElementById(`operator-queue-${stageKey}`);
      if (!target) {
        return;
      }

      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  return (
    <div className="app-work-surface px-2.5 py-2.5 min-[1000px]:px-4 min-[1000px]:py-3">
      <OperatorQueueSummary stageCounts={stageCounts} onStageSelect={handleStageSelect} />
    </div>
  );
}
