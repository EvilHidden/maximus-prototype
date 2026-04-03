import type { LucideIcon } from "lucide-react";
import { QuickActionTile, Surface } from "../../../components/ui/primitives";

type HomeQuickAction = {
  label: string;
  subtitle: string;
  icon: LucideIcon;
  iconStyle: {
    borderColor: string;
    backgroundColor: string;
    color: string;
  };
  onClick: () => void;
};

type HomeQuickActionsDeckProps = {
  actions: HomeQuickAction[];
};

export function HomeQuickActionsDeck({ actions }: HomeQuickActionsDeckProps) {
  return (
    <Surface tone="control" className="px-4 py-4 md:px-5">
      <div className="flex gap-2.5 overflow-x-auto pb-1 app-no-scrollbar md:grid md:grid-cols-4 md:overflow-visible md:pb-0">
        {actions.map((action) => (
          <QuickActionTile
            key={action.label}
            title={action.label}
            subtitle={action.subtitle}
            icon={action.icon}
            iconStyle={action.iconStyle}
            onClick={action.onClick}
            size="compact"
            className="min-w-[11rem] shrink-0 sm:min-w-[11.5rem] md:min-w-0"
          />
        ))}
      </div>
    </Surface>
  );
}
