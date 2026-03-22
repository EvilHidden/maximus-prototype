import { Scissors, Shirt } from "lucide-react";
import type { WorkflowMode } from "../../../types";
import { EmptyState, Surface, WorkflowToggle } from "../../../components/ui/primitives";

type WorkflowSelectorProps = {
  activeWorkflow: WorkflowMode | null;
  hasAlterationContent: boolean;
  hasCustomContent: boolean;
  onActivate: (workflow: WorkflowMode) => void;
};

export function WorkflowSelector({
  activeWorkflow,
  hasAlterationContent,
  hasCustomContent,
  onActivate,
}: WorkflowSelectorProps) {
  return (
    <Surface tone="control" className="p-3.5">
      <div className="app-text-overline mb-3">Service type</div>

      <div className="grid grid-cols-2 gap-2.5">
        <WorkflowToggle
          icon={Scissors}
          title="Alterations"
          subtitle="Intake and services"
          isActive={activeWorkflow === "alteration"}
          isEnabled={hasAlterationContent}
          onClick={() => onActivate("alteration")}
        />
        <WorkflowToggle
          icon={Shirt}
          title="Custom garment"
          subtitle="Measurements and build"
          isActive={activeWorkflow === "custom"}
          isEnabled={hasCustomContent}
          onClick={() => onActivate("custom")}
        />
      </div>

      {activeWorkflow === null ? <EmptyState className="mt-3">Select a service type to begin.</EmptyState> : null}
    </Surface>
  );
}
