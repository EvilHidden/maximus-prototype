import type { LucideIcon } from "lucide-react";
import { QuickActionTile, Surface, cx } from "../../../components/ui/primitives";

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
  className?: string;
};

export function HomeQuickActionsDeck({ actions, className = "" }: HomeQuickActionsDeckProps) {
  return (
    <Surface tone="control" className={cx("px-4 py-4 md:px-5", className)}>
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
