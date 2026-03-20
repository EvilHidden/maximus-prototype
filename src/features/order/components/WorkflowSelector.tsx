import { Receipt, Scissors, Shirt } from "lucide-react";
import type { WorkflowMode } from "../../../types";
import { Card, EmptyState, SectionHeader, WorkflowToggle } from "../../../components/ui/primitives";

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
    <Card className="p-4">
      <SectionHeader icon={Receipt} title="Start new order" subtitle="Service type" />

      <div className="grid grid-cols-2 gap-3">
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

      {activeWorkflow === null ? <EmptyState className="mt-4">Select a service type to begin.</EmptyState> : null}
    </Card>
  );
}
