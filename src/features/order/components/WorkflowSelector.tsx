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
      <SectionHeader icon={Receipt} title="Create order" subtitle="Select workflow" />

      <div className="grid grid-cols-2 gap-3">
        <WorkflowToggle
          icon={Scissors}
          title="Alterations"
          subtitle="Garments and modifiers"
          isActive={activeWorkflow === "alteration"}
          isEnabled={hasAlterationContent}
          onClick={() => onActivate("alteration")}
        />
        <WorkflowToggle
          icon={Shirt}
          title="Custom garment"
          subtitle="Measurements and pricing"
          isActive={activeWorkflow === "custom"}
          isEnabled={hasCustomContent}
          onClick={() => onActivate("custom")}
        />
      </div>

      {activeWorkflow === null ? <EmptyState className="mt-4">Select a workflow.</EmptyState> : null}
    </Card>
  );
}
