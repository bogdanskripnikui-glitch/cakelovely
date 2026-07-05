import type { Category, MonthRecord } from "./types";

export const cities = [
  { id: "cityA" as const, label: "Харьков" },
  { id: "cityB" as const, label: "Луцк" }
];

export const categories: Category[] = [
  { id: "bento_standard", name: "Бенто Standart" },
  { id: "bento_xl", name: "Бенто XL" },
  { id: "truffles", name: "Трайфлы" },
  { id: "cupcakes", name: "Капкейки" },
  { id: "set_mini", name: "Набор Mini" },
  { id: "set_standard", name: "Набор Standart" },
  { id: "set_maxi", name: "Набор MAXI" },
  { id: "set_truffles_mini", name: "Набор с трайфлами MINI" },
  { id: "set_truffles_standard", name: "Набор с трайфлами Standart" },
  { id: "set_truffles_maxi", name: "Набор с трайфлами MAXI" },
  { id: "moti", name: "Моти" },
  { id: "build_yourself", name: "Собери сам" }
];

export const seedRecords: MonthRecord[] = [
  {
    cityId: "cityA",
    month: "2026-06",
    prices: {
      bento_standard: 200,
      bento_xl: 400,
      truffles: 250,
      cupcakes: 300,
      set_mini: 520,
      set_standard: 760,
      set_maxi: 980,
      set_truffles_mini: 620,
      set_truffles_standard: 820,
      set_truffles_maxi: 1020,
      moti: 220,
      build_yourself: 500
    },
    counts: {
      bento_standard: 10,
      bento_xl: 10,
      truffles: 0,
      cupcakes: 0,
      set_mini: 0,
      set_standard: 0,
      set_maxi: 0,
      set_truffles_mini: 0,
      set_truffles_standard: 0,
      set_truffles_maxi: 0,
      moti: 0,
      build_yourself: 0
    }
  },
  {
    cityId: "cityB",
    month: "2026-06",
    prices: {
      bento_standard: 220,
      bento_xl: 440,
      truffles: 250,
      cupcakes: 300,
      set_mini: 520,
      set_standard: 760,
      set_maxi: 980,
      set_truffles_mini: 620,
      set_truffles_standard: 820,
      set_truffles_maxi: 1020,
      moti: 220,
      build_yourself: 500
    },
    counts: {
      bento_standard: 6,
      bento_xl: 4,
      truffles: 5,
      cupcakes: 4,
      set_mini: 0,
      set_standard: 0,
      set_maxi: 0,
      set_truffles_mini: 0,
      set_truffles_standard: 0,
      set_truffles_maxi: 0,
      moti: 0,
      build_yourself: 0
    }
  }
];
