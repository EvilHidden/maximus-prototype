import type { IconType } from "react-icons";
import { FaPersonDress, FaShirt, FaVest } from "react-icons/fa6";
import { GiMonclerJacket, GiTrousers } from "react-icons/gi";
import { PiPants } from "react-icons/pi";
import { MdCheckroom } from "react-icons/md";

type AlterationGarmentVisual = {
  icon: IconType;
};

const GARMENT_VISUALS: Record<string, AlterationGarmentVisual> = {
  Dress: {
    icon: FaPersonDress,
  },
  Jacket: {
    icon: GiMonclerJacket,
  },
  Jeans: {
    icon: PiPants,
  },
  Pants: {
    icon: GiTrousers,
  },
  Shirt: {
    icon: FaShirt,
  },
  Vest: {
    icon: FaVest,
  },
};

const DEFAULT_VISUAL: AlterationGarmentVisual = {
  icon: MdCheckroom,
};

export function getAlterationGarmentVisual(garment: string) {
  return GARMENT_VISUALS[garment] ?? DEFAULT_VISUAL;
}
