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
            className="min-h-[84px] min-w-[11rem] shrink-0 px-3 py-3 sm:min-h-[88px] sm:min-w-[11.5rem] md:min-w-0 md:px-3 md:py-3 xl:min-h-[112px] xl:px-5 xl:py-4.5"
          />
        ))}
      </div>
    </Surface>
  );
}
