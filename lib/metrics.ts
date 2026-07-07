import type { CategoryId, MonthRecord } from "./types";

export function standardPrice(record: MonthRecord) {
  return record.prices.bento_standard || 0;
}

export function categoryCoefficient(record: MonthRecord, categoryId: CategoryId) {
  const base = standardPrice(record);
  const price = record.prices[categoryId] || 0;
  if (categoryId === "bento_standard") {
    return 1;
  }

  return base > 0 ? price / base : 0;
}

export function weightedSold(record: MonthRecord) {
  return Object.entries(record.counts).reduce((sum, [categoryId, count]) => {
    return sum + Number(count || 0) * categoryCoefficient(record, categoryId as CategoryId);
  }, 0);
}

export function revenue(record: MonthRecord) {
  return Object.entries(record.counts).reduce((sum, [categoryId, count]) => {
    return sum + Number(count || 0) * Number(record.prices[categoryId as CategoryId] || 0);
  }, 0);
}