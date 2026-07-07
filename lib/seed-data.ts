import type { Category, MonthRecord } from "./types";

export const cities = [
  { id: "cityA" as const, label: "Харьков" },
  { id: "cityB" as const, label: "Луцк" }
];

export const categories: Category[] = [
  { id: "bento_standard", name: "Standart" },
  { id: "bento_xl", name: "XL" },
  { id: "set_standard", name: "Standart" },
  { id: "set_mini", name: "Mini" },
  { id: "set_maxi", name: "XL" },
  { id: "cupcakes", name: "Капкейк" },
  { id: "set_truffles_standard", name: "Standart" },
  { id: "set_truffles_mini", name: "Mini" },
  { id: "set_truffles_maxi", name: "XL" },
  { id: "truffles", name: "Трайфл" },
  { id: "build_yourself", name: "Собери сам" },
  { id: "mousse_cake", name: "Мусовый торт" }
];

export const defaultPrices = {
  bento_standard: 200,
  bento_xl: 400,
  set_standard: 760,
  set_mini: 520,
  set_maxi: 980,
  cupcakes: 300,
  set_truffles_standard: 820,
  set_truffles_mini: 620,
  set_truffles_maxi: 1020,
  truffles: 250,
  build_yourself: 500,
  mousse_cake: 900
};

const zeroCounts = {
  bento_standard: 0,
  bento_xl: 0,
  set_standard: 0,
  set_mini: 0,
  set_maxi: 0,
  cupcakes: 0,
  set_truffles_standard: 0,
  set_truffles_mini: 0,
  set_truffles_maxi: 0,
  truffles: 0,
  build_yourself: 0,
  mousse_cake: 0
};

export const seedRecords: MonthRecord[] = [
  {
    cityId: "cityA",
    month: "2026-06",
    prices: { ...defaultPrices },
    counts: { ...zeroCounts, bento_standard: 10, bento_xl: 10 }
  },
  {
    cityId: "cityA",
    month: "2026-07",
    prices: { ...defaultPrices },
    counts: { ...zeroCounts, bento_standard: 12, bento_xl: 6, set_maxi: 3, cupcakes: 4 }
  },
  {
    cityId: "cityB",
    month: "2026-06",
    prices: { ...defaultPrices, bento_standard: 220, bento_xl: 440 },
    counts: { ...zeroCounts, bento_standard: 6, bento_xl: 4, truffles: 5, cupcakes: 4 }
  }
];
