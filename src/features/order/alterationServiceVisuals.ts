import type { IconType } from "react-icons";
import { FaRegCircleDot, FaRulerVertical, FaShirt, FaTape } from "react-icons/fa6";
import { GiArmSling, GiRolledCloth } from "react-icons/gi";
import { MdSwapHoriz, MdWidthWide } from "react-icons/md";
import { PiNeedle, PiShirtFolded } from "react-icons/pi";
import { TbArrowsHorizontal, TbCut, TbHanger2 } from "react-icons/tb";

type AlterationServiceVisual = {
  icon: IconType;
};

const VISUAL_RULES: Array<{
  matcher: RegExp;
  visual: AlterationServiceVisual;
}> = [
  {
    matcher: /button/i,
    visual: {
      icon: FaRegCircleDot,
    },
  },
  {
    matcher: /zipper/i,
    visual: {
      icon: MdSwapHoriz,
    },
  },
  {
    matcher: /collar/i,
    visual: {
      icon: TbHanger2,
    },
  },
  {
    matcher: /lining|felt/i,
    visual: {
      icon: PiShirtFolded,
    },
  },
  {
    matcher: /belt loop|strap/i,
    visual: {
      icon: GiRolledCloth,
    },
  },
  {
    matcher: /repair/i,
    visual: {
      icon: PiNeedle,
    },
  },
  {
    matcher: /add shoulder pads|lower armhole/i,
    visual: {
      icon: GiArmSling,
    },
  },
  {
    matcher: /sleeve|cuff/i,
    visual: {
      icon: FaShirt,
    },
  },
  {
    matcher: /length|hem/i,
    visual: {
      icon: FaRulerVertical,
    },
  },
  {
    matcher: /width|chest|stomach|seat|waist|bicep|thigh|knee|bottom|rise|neck/i,
    visual: {
      icon: MdWidthWide,
    },
  },
  {
    matcher: /shoulder|across the chest|half back|half seat/i,
    visual: {
      icon: TbArrowsHorizontal,
    },
  },
  {
    matcher: /change/i,
    visual: {
      icon: TbCut,
    },
  },
];

const DEFAULT_VISUAL: AlterationServiceVisual = {
  icon: FaTape,
};

export function getAlterationServiceVisual(serviceName: string): AlterationServiceVisual {
  return VISUAL_RULES.find((rule) => rule.matcher.test(serviceName))?.visual ?? DEFAULT_VISUAL;
}

export function getAlterationServiceIconClassName(serviceName: string) {
  getAlterationServiceVisual(serviceName);
  return "inline-flex h-7 w-7 items-center justify-center rounded-[var(--app-radius-sm)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]";
}

export function getAlterationServiceIcon(serviceName: string) {
  return getAlterationServiceVisual(serviceName).icon;
}
