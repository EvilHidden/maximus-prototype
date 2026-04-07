import type { LucideIcon } from "lucide-react";
import { QuickActionTile, cx } from "../../../components/ui/primitives";

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
    <div className={cx("app-home-quick-actions px-4 py-4", className)}>
      <div className="app-home-quick-actions__header mb-3 flex items-end justify-between gap-4">
        <div>
          <div className="app-text-overline">Start work</div>
          <div className="app-text-strong mt-1">Common actions</div>
        </div>
        <div className="app-text-caption">Built for standing, moving, and checking out quickly.</div>
      </div>
      <div className="app-home-quick-actions__grid flex gap-2.5 overflow-x-auto pb-1 app-no-scrollbar md:grid md:grid-cols-4 md:overflow-visible md:pb-0">
        {actions.map((action) => (
          <QuickActionTile
            key={action.label}
            title={action.label}
            subtitle={action.subtitle}
            icon={action.icon}
            iconStyle={action.iconStyle}
            onClick={action.onClick}
            size="compact"
            className="min-w-[11rem] shrink-0 md:min-w-0"
          />
        ))}
      </div>
    </div>
  );
}
