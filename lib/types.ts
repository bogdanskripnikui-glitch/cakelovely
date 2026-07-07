export type CityId = "cityA" | "cityB";

export type CategoryId =
  | "bento_standard"
  | "bento_xl"
  | "set_standard"
  | "set_mini"
  | "set_maxi"
  | "cupcakes"
  | "set_truffles_standard"
  | "set_truffles_mini"
  | "set_truffles_maxi"
  | "truffles"
  | "build_yourself"
  | "mousse_cake";

export type Category = {
  id: CategoryId;
  name: string;
};

export type MonthKey = `${number}-${string}`;

export type MonthRecord = {
  cityId: CityId;
  month: MonthKey;
  prices: Record<CategoryId, number>;
  counts: Record<CategoryId, number>;
};
