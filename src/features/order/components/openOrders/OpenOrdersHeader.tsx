import { ClipboardList } from "lucide-react";
import { ActionButton, SectionHeader } from "../../../../components/ui/primitives";

export function OpenOrdersHeader({
  subtitle,
  onStartNewOrder,
}: {
  subtitle: string;
  onStartNewOrder: () => void;
}) {
  return (
    <SectionHeader
      icon={ClipboardList}
      title="Orders"
      subtitle={subtitle}
      action={
        <ActionButton tone="primary" className="px-3 py-2 text-xs" onClick={onStartNewOrder}>
          New order
        </ActionButton>
      }
    />
  );
}
