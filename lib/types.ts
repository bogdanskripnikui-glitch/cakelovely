export type CityId = "cityA" | "cityB";

export type CategoryId =
  | "bento_standard"
  | "bento_xl"
  | "truffles"
  | "cupcakes"
  | "set_mini"
  | "set_standard"
  | "set_maxi"
  | "set_truffles_mini"
  | "set_truffles_standard"
  | "set_truffles_maxi"
  | "moti"
  | "build_yourself";

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

export type DashboardState = {
  activeCity: CityId;
  month: MonthKey;
  categories: Category[];
  records: MonthRecord[];
};
