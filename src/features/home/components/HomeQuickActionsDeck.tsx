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
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
        {actions.map((action) => (
          <QuickActionTile
            key={action.label}
            title={action.label}
            subtitle={action.subtitle}
            icon={action.icon}
            iconStyle={action.iconStyle}
            onClick={action.onClick}
          />
        ))}
      </div>
    </Surface>
  );
}
