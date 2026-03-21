import type { IconType } from "react-icons";
import { FaPersonDress, FaShirt, FaVest } from "react-icons/fa6";
import { GiMonclerJacket, GiTrousers } from "react-icons/gi";
import { PiPants } from "react-icons/pi";
import { MdCheckroom } from "react-icons/md";

type AlterationGarmentVisual = {
  icon: IconType;
  chipClassName: string;
};

const GARMENT_VISUALS: Record<string, AlterationGarmentVisual> = {
  Dress: {
    icon: FaPersonDress,
    chipClassName: "border-rose-200 bg-rose-50 text-rose-700",
  },
  Jacket: {
    icon: GiMonclerJacket,
    chipClassName: "border-blue-200 bg-blue-50 text-blue-700",
  },
  Jeans: {
    icon: PiPants,
    chipClassName: "border-indigo-200 bg-indigo-50 text-indigo-700",
  },
  Pants: {
    icon: GiTrousers,
    chipClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  Shirt: {
    icon: FaShirt,
    chipClassName: "border-amber-200 bg-amber-50 text-amber-700",
  },
  Vest: {
    icon: FaVest,
    chipClassName: "border-violet-200 bg-violet-50 text-violet-700",
  },
};

const DEFAULT_VISUAL: AlterationGarmentVisual = {
  icon: MdCheckroom,
  chipClassName: "border-[var(--app-border)] bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]",
};

export function getAlterationGarmentVisual(garment: string) {
  return GARMENT_VISUALS[garment] ?? DEFAULT_VISUAL;
}
