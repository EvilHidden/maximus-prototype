import type { AlterationCategory, CustomGarmentGender } from "../types";

export const alterationCatalog: AlterationCategory[] = [
  {
    category: "Dress",
    services: [
      { name: "Strap", price: 35 },
      { name: "Waist", price: 50 },
      { name: "Hem", price: 50 },
      { name: "Shoulder", price: 100 },
      { name: "Zipper replacement", price: 60 },
    ],
  },
  {
    category: "Jacket",
    services: [
      { name: "Length", price: 80 },
      { name: "Sleeve replacement", price: 80 },
      { name: "Lining replacement", price: 150 },
      { name: "Add buttonholes", price: 75 },
      { name: "Lower armhole", price: 30 },
      { name: "Half back", price: 35 },
      { name: "Half seat", price: 40 },
      { name: "Across the chest", price: 75 },
      { name: "Sleeve length", price: 40 },
      { name: "Sleeve length from shoulder", price: 75 },
      { name: "Sleeve width", price: 30 },
      { name: "Change buttons", price: 35 },
      { name: "Chest", price: 30 },
      { name: "Stomach", price: 30 },
      { name: "Bicep", price: 30 },
      { name: "Seat", price: 30 },
      { name: "Lower collar", price: 30 },
      { name: "Restitch felt", price: 20 },
      { name: "Shoulder", price: 75 },
      { name: "Add shoulder pads", price: 35 },
    ],
  },
  {
    category: "Jeans",
    services: [
      { name: "Length", price: 30 },
      { name: "Wide leg length", price: 45 },
      { name: "Knee", price: 20 },
      { name: "Rise", price: 20 },
      { name: "Add belt loops", price: 40 },
      { name: "Repair crotch", price: 40 },
      { name: "Waist", price: 25 },
      { name: "Seat", price: 20 },
      { name: "Thigh", price: 20 },
      { name: "Bottom", price: 20 },
    ],
  },
  {
    category: "Pants",
    services: [
      { name: "Length", price: 30 },
      { name: "Knee", price: 20 },
      { name: "Rise", price: 20 },
      { name: "Add belt loops", price: 40 },
      { name: "Repair crotch", price: 40 },
      { name: "Waist", price: 25 },
      { name: "Seat", price: 20 },
      { name: "Thigh", price: 20 },
      { name: "Bottom", price: 20 },
    ],
  },
  {
    category: "Shirt",
    services: [
      { name: "Seat", price: 25 },
      { name: "Bicep", price: 20 },
      { name: "Sleeve length", price: 35 },
      { name: "Cuff", price: 20 },
      { name: "Neck", price: 10 },
      { name: "Shoulder", price: 45 },
      { name: "Chest", price: 20 },
      { name: "Stomach", price: 25 },
      { name: "Change buttons", price: 20 },
      { name: "Change collar", price: 30 },
    ],
  },
  {
    category: "Vest",
    services: [
      { name: "Chest", price: 30 },
      { name: "Stomach", price: 30 },
      { name: "Seat", price: 30 },
      { name: "Length", price: 50 },
    ],
  },
];

export const lapelOptions = ["Notch", "Peak", "Shawl"];

export const pocketTypeOptions = [
  "Regular",
  "Slanted",
  "Slanted with slanted ticket pocket",
  "Regular pockets, no flap",
  "Regular without flap",
];

export const canvasOptions = ["Half", "Full", "Fused"];

export const customGarmentOptionsByGender: Record<CustomGarmentGender, string[]> = {
  male: [
    "Two-piece suit",
    "Three-piece suit",
    "Jacket",
    "Pants",
    "Vest",
    "Shirt",
    "Overcoat",
    "Tuxedo jacket",
    "Three-piece tuxedo",
  ],
  female: [
    "Two-piece suit",
    "Three-piece suit",
    "Jacket",
    "Pants",
    "Vest",
    "Shirt",
    "Overcoat",
    "Skirt",
  ],
};

export const jacketBasedCustomGarments = new Set([
  "Two-piece suit",
  "Three-piece suit",
  "Jacket",
  "Overcoat",
  "Tuxedo jacket",
  "Three-piece tuxedo",
]);

export const measurementFields = [
  "Back Length",
  "Shoulder",
  "Neck",
  "Chest",
  "Stomach",
  "Waist",
  "Seat",
  "Bicep",
  "Sleeve Length",
  "Thigh",
  "Rise",
  "Bottom",
  "Length",
  "Shirt Cuff Left",
  "Shirt Cuff Right",
];
