"use client";

import { useEffect, useMemo, useState } from "react";
import { categories, cities } from "../lib/seed-data";
import type { Category, CategoryId, CityId, MonthKey, MonthRecord } from "../lib/types";

type View = "dashboardView" | "settingsView";
type ChartMode = "days" | "months";
type Entry = {
  date: string;
  count: number;
  categoryId: CategoryId;
  price: number;
  source: string;
};
type MonthHistoryRecord = {
  prices: Record<CategoryId, number>;
  counts: Record<CategoryId, number>;
  coefficients: Record<CategoryId, number>;
};
type HistoryState = Record<CityId, Record<MonthKey, MonthHistoryRecord>>;
type CityEntries = Record<CityId, Entry[]>;

const STORAGE_KEY = "cakelovely-sync-dashboard-v3";
const now = new Date();
const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}` as MonthKey;
const monthNames = ["янв.", "февр.", "марта", "апр.", "мая", "июня", "июля", "авг.", "сент.", "окт.", "нояб.", "дек."];

const defaultCategoryPrices = Object.fromEntries(categories.map((category) => [category.id, initialPrice(category.id)])) as Record<CategoryId, number>;

const sampleEntries: CityEntries = {
  cityA: [
    { date: `${defaultMonth}-02`, count: 4, categoryId: "bento_standard", price: 200, source: "Apple Notes" },
    { date: `${defaultMonth}-04`, count: 2, categoryId: "cupcakes", price: 300, source: "Apple Notes" },
    { date: `${defaultMonth}-07`, count: 5, categoryId: "truffles", price: 250, source: "Apple Notes" },
    { date: `${defaultMonth}-11`, count: 3, categoryId: "bento_xl", price: 400, source: "Apple Notes" },
    { date: `${defaultMonth}-16`, count: 7, categoryId: "set_maxi", price: 980, source: "Apple Notes" }
  ],
  cityB: [
    { date: `${defaultMonth}-03`, count: 6, categoryId: "bento_standard", price: 220, source: "Apple Notes" },
    { date: `${defaultMonth}-05`, count: 1, categoryId: "bento_xl", price: 440, source: "Apple Notes" },
    { date: `${defaultMonth}-09`, count: 5, categoryId: "truffles", price: 250, source: "Apple Notes" },
    { date: `${defaultMonth}-12`, count: 4, categoryId: "cupcakes", price: 300, source: "Apple Notes" },
    { date: `${defaultMonth}-26`, count: 3, categoryId: "set_standard", price: 760, source: "Apple Notes" }
  ]
};

function initialPrice(categoryId: CategoryId) {
  return (
    {
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
    }[categoryId] ?? 0
  );
}

function emptyPrices() {
  return Object.fromEntries(categories.map((category) => [category.id, 0])) as Record<CategoryId, number>;
}

function emptyCounts() {
  return Object.fromEntries(categories.map((category) => [category.id, 0])) as Record<CategoryId, number>;
}

function emptyCoefficients() {
  return Object.fromEntries(categories.map((category) => [category.id, 1])) as Record<CategoryId, number>;
}

function kievTimeHour() {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Kyiv",
      hour: "2-digit",
      hour12: false
    }).formatToParts(new Date());
    return Number(parts.find((part) => part.type === "hour")?.value || now.getHours());
  } catch {
    return now.getHours();
  }
}

function greetingText() {
  const hour = kievTimeHour();
  if (hour >= 5 && hour < 12) return "Доброе утро, Дарья";
  if (hour >= 12 && hour < 17) return "Добрый день, Дарья";
  if (hour >= 17 && hour < 23) return "Добрый вечер, Дарья";
  return "Доброй ночи, Дарья";
}

function formatMonthValue(monthValue: MonthKey) {
  const [year, monthNumber] = monthValue.split("-").map(Number);
  if (!year || !monthNumber) return monthValue;
  return `${monthNames[monthNumber - 1] || monthNumber} ${year}`;
}

function formatMonthLabel(monthKey: string) {
  const [year, monthNumber] = monthKey.split("-").map(Number);
  if (!year || !monthNumber) return monthKey;
  const date = new Date(year, monthNumber - 1, 1);
  return new Intl.DateTimeFormat("ru-RU", { month: "short", year: "numeric" }).format(date).replace(".", "");
}

function monthRange(year: number) {
  return monthNames.map((_, index) => `${year}-${String(index + 1).padStart(2, "0")}` as MonthKey);
}

function categoryById(categoryId: CategoryId): Category {
  return categories.find((category) => category.id === categoryId) || categories[0];
}

function entriesForMonth(entries: Entry[], month: MonthKey) {
  return entries.filter((entry) => entry.date.startsWith(month));
}

function groupByDay(entries: Entry[]) {
  const grouped: Record<string, number> = {};
  entries.forEach((entry) => {
    const day = entry.date.slice(-2);
    grouped[day] = (grouped[day] || 0) + entry.count * coefficientForEntry(entry);
  });
  return grouped;
}

function groupByMonth(entries: Entry[]) {
  const grouped: Record<string, { sold: number; revenue: number }> = {};
  entries.forEach((entry) => {
    const month = entry.date.slice(0, 7);
    if (!grouped[month]) grouped[month] = { sold: 0, revenue: 0 };
    grouped[month].sold += entry.count * coefficientForEntry(entry);
    grouped[month].revenue += entry.count * entry.price;
  });
  return grouped;
}

function coefficientForEntry(entry: Entry) {
  const base = initialPrice("bento_standard") || 1;
  if (entry.categoryId === "bento_standard") return 1;
  return entry.price > 0 ? entry.price / base : 1;
}

function emptyHistoryRecord(): MonthHistoryRecord {
  return {
    prices: emptyPrices(),
    counts: emptyCounts(),
    coefficients: emptyCoefficients()
  };
}

function cloneHistory(history: HistoryState): HistoryState {
  return {
    cityA: { ...history.cityA },
    cityB: { ...history.cityB }
  };
}

export default function Page() {
  const [activeView, setActiveView] = useState<View>("dashboardView");
  const [activeCity, setActiveCity] = useState<CityId>("cityA");
  const [month, setMonth] = useState<MonthKey>(defaultMonth);
  const [chartMode, setChartMode] = useState<ChartMode>("days");
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [monthPickerYear, setMonthPickerYear] = useState(now.getFullYear());
  const [recordsSaved, setRecordsSaved] = useState(false);
  const [categoryPrices, setCategoryPrices] = useState<Record<CategoryId, number>>(defaultCategoryPrices);
  const [sales, setSales] = useState<CityEntries>(sampleEntries);
  const [monthHistory, setMonthHistory] = useState<HistoryState>({
    cityA: {},
    cityB: {}
  });
  const [dateInput, setDateInput] = useState(`${defaultMonth}-${String(now.getDate()).padStart(2, "0")}`);
  const [countInput, setCountInput] = useState(3);
  const [categoryInput, setCategoryInput] = useState<CategoryId>("bento_standard");
  const [sourceInput, setSourceInput] = useState("Apple Notes");
  const [noteInput, setNoteInput] = useState("05.07 бенто стандарт 4\n06.07 трайфлы 2\n07.07 набор с капкейками мини 5");
  const [historyCityInput, setHistoryCityInput] = useState<CityId>("cityA");
  const [historyMonthInput, setHistoryMonthInput] = useState<MonthKey>(defaultMonth);
  const [historyDraft, setHistoryDraft] = useState<Record<CategoryId, { price: string; count: string }>>(
    Object.fromEntries(categories.map((category) => [category.id, { price: "", count: "" }])) as Record<
      CategoryId,
      { price: string; count: string }
    >
  );
  const [toast, setToast] = useState("");
  const [historyToast, setHistoryToast] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<{
          activeCity: CityId;
          month: MonthKey;
          chartMode: ChartMode;
          categoryPrices: Record<CategoryId, number>;
          sales: CityEntries;
          monthHistory: HistoryState;
        }>;
        if (parsed.activeCity) setActiveCity(parsed.activeCity);
        if (parsed.month) setMonth(parsed.month);
        if (parsed.chartMode) setChartMode(parsed.chartMode);
        if (parsed.categoryPrices) setCategoryPrices(parsed.categoryPrices);
        if (parsed.sales) setSales(parsed.sales);
        if (parsed.monthHistory) setMonthHistory(parsed.monthHistory);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setSaved(true);
  }, []);

  useEffect(() => {
    const year = Number(month.slice(0, 4));
    if (year) setMonthPickerYear(year);
  }, [month]);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (!monthPickerOpen) return;
      const picker = document.getElementById("monthPicker");
      const target = event.target;
      if (!(target instanceof Node) || !picker || picker.contains(target)) return;
      setMonthPickerOpen(false);
    }

    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, [monthPickerOpen]);

  useEffect(() => {
    const payload = {
      activeCity,
      month,
      chartMode,
      categoryPrices,
      sales,
      monthHistory
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setRecordsSaved(true);
  }, [activeCity, month, chartMode, categoryPrices, sales, monthHistory]);

  const currentEntries = useMemo(() => entriesForMonth(sales[activeCity], month), [sales, activeCity, month]);
  const groupedDays = useMemo(() => groupByDay(currentEntries), [currentEntries]);
  const groupedMonths = useMemo(() => groupByMonth(sales[activeCity]), [sales, activeCity]);
  const sold = useMemo(
    () => currentEntries.reduce((sum, entry) => sum + entry.count * coefficientForEntry(entry), 0),
    [currentEntries]
  );
  const earned = useMemo(() => currentEntries.reduce((sum, entry) => sum + entry.count * entry.price, 0), [currentEntries]);
  const activeCityLabel = cities.find((city) => city.id === activeCity)?.label || "—";
  const currentYearMonths = monthRange(monthPickerYear);
  const monthHistoryRecord = monthHistory[historyCityInput]?.[historyMonthInput] || emptyHistoryRecord();
  const currentHistoryDraft = useMemo(() => {
    const record = monthHistory[historyCityInput]?.[historyMonthInput] || emptyHistoryRecord();
    return Object.fromEntries(
      categories.map((category) => [
        category.id,
        {
          price: record.prices[category.id] ? String(record.prices[category.id]) : "",
          count: record.counts[category.id] ? String(record.counts[category.id]) : ""
        }
      ])
    ) as Record<CategoryId, { price: string; count: string }>;
  }, [historyCityInput, historyMonthInput, monthHistory]);

  useEffect(() => {
    setHistoryDraft(currentHistoryDraft);
  }, [currentHistoryDraft]);

  const weightedCategoryTotals = useMemo(() => {
    const totals: Record<CategoryId, number> = Object.fromEntries(categories.map((category) => [category.id, 0])) as Record<CategoryId, number>;
    currentEntries.forEach((entry) => {
      totals[entry.categoryId] += entry.count * coefficientForEntry(entry);
    });
    return totals;
  }, [currentEntries]);

  const bestDay = useMemo(() => {
    const pairs = Object.entries(groupedDays).sort((a, b) => b[1] - a[1]);
    return pairs[0] ? `${pairs[0][0]} число` : "-";
  }, [groupedDays]);

  const avgMetric = useMemo(() => {
    const activeDays = Object.values(groupedDays).filter(Boolean).length;
    return activeDays ? sold / activeDays : 0;
  }, [groupedDays, sold]);

  const topCategory = useMemo(() => {
    const pairs = Object.entries(weightedCategoryTotals).sort((a, b) => b[1] - a[1]);
    return pairs[0] ? categoryById(pairs[0][0] as CategoryId).name : "-";
  }, [weightedCategoryTotals]);

  function updateEntry(cityId: CityId, updater: (list: Entry[]) => Entry[]) {
    setSales((prev) => ({ ...prev, [cityId]: updater(prev[cityId]) }));
  }

  function addSale() {
    if (!dateInput || !countInput) {
      setToast("Укажи дату и количество продаж.");
      return;
    }
    updateEntry(activeCity, (list) => [
      ...list,
      {
        date: dateInput,
        count: countInput,
        categoryId: categoryInput,
        price: categoryPrices[categoryInput] || initialPrice(categoryInput),
        source: sourceInput || "вручную"
      }
    ]);
    setMonth(dateInput.slice(0, 7) as MonthKey);
    setToast("День добавлен в статистику.");
  }

  function loadDemo() {
    updateEntry(activeCity, () => sampleEntries[activeCity].map((entry) => ({ ...entry })));
    setToast("Загружен пример города.");
  }

  function parseNote() {
    const lines = noteInput.split(/\n+/).map((line) => line.trim()).filter(Boolean);
    let added = 0;
    lines.forEach((line) => {
      const dateMatch = line.match(/(\d{4}-\d{2}-\d{2}|\d{1,2}[./]\d{1,2})/);
      const numbers = line.match(/\d+/g) || [];
      if (!dateMatch || numbers.length < 2) return;
      const date = parseNoteDate(dateMatch[1]);
      const count = Number(numbers[numbers.length - 1]);
      if (!date || !count) return;
      const categoryId = detectCategoryId(line);
      updateEntry(activeCity, (list) => [
        ...list,
        {
          date,
          count,
          categoryId,
          price: categoryPrices[categoryId] || initialPrice(categoryId),
          source: "текст заметки"
        }
      ]);
      added += 1;
    });
    setToast(added ? `Добавлено строк: ${added}` : "Не нашла дату и количество в тексте.");
  }

  function detectCategoryId(line: string) {
    const text = line.toLowerCase();
    const match = categories.find((category) => {
      const words = [category.name, category.name.toLowerCase()]
        .concat(categoryKeywords[category.id] || []);
      return words.some((word) => text.includes(word.toLowerCase()));
    });
    return match?.id || categoryInput;
  }

  function parseNoteDate(raw: string) {
    const clean = raw.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
    const short = clean.match(/^(\d{1,2})[./](\d{1,2})$/);
    if (short) {
      const day = short[1].padStart(2, "0");
      const monthValue = short[2].padStart(2, "0");
      const year = month.slice(0, 4);
      return `${year}-${monthValue}-${day}`;
    }
    return "";
  }

  const categoryKeywords: Partial<Record<CategoryId, string[]>> = {
    bento_standard: ["бенто", "standart", "standard", "бенто standart"],
    bento_xl: ["бенто xl", "бенто хл", "xl", "хл"],
    truffles: ["трайфл", "трайфлы"],
    cupcakes: ["капкейк", "капкейки"],
    set_mini: ["набор mini", "мини набор"],
    set_standard: ["набор standart", "набор standard", "набор стандарт"],
    set_maxi: ["набор maxi", "макси набор"],
    set_truffles_mini: ["набор с трайфлами mini", "мини с трайфлами"],
    set_truffles_standard: ["набор с трайфлами standart", "стандарт с трайфлами"],
    set_truffles_maxi: ["набор с трайфлами maxi", "макси с трайфлами"],
    moti: ["моти"],
    build_yourself: ["собери сам"]
  };

  function saveHistoryMonth() {
    const record: MonthHistoryRecord = {
      prices: emptyPrices(),
      counts: emptyCounts(),
      coefficients: emptyCoefficients()
    };

    categories.forEach((category) => {
      const price = Number(historyDraft[category.id]?.price || 0);
      const count = Number(historyDraft[category.id]?.count || 0);
      record.prices[category.id] = price;
      record.counts[category.id] = count;
      record.coefficients[category.id] =
        category.id === "bento_standard" ? 1 : price > 0 && record.prices.bento_standard > 0 ? price / record.prices.bento_standard : 1;
    });

    if (!record.prices.bento_standard) {
      setHistoryToast("Укажи цену Бенто Standart для этого месяца.");
      return;
    }

    setMonthHistory((prev) => ({
      ...cloneHistory(prev),
      [historyCityInput]: {
        ...prev[historyCityInput],
        [historyMonthInput]: record
      }
    }));
    setHistoryToast("Месяц сохранён.");
  }

  function clearHistoryBuffer() {
    setHistoryDraft(Object.fromEntries(categories.map((category) => [category.id, { price: "", count: "" }])) as Record<
      CategoryId,
      { price: string; count: string }
    >);
    setHistoryToast("Поля очищены.");
  }

  function updateHistoryDraft(categoryId: CategoryId, field: "price" | "count", value: string) {
    setHistoryDraft((prev) => ({
      ...prev,
      [categoryId]: { ...prev[categoryId], [field]: value }
    }));
  }

  function monthCoefficient(cityId: CityId, monthKey: MonthKey, categoryId: CategoryId) {
    const record = monthHistory[cityId]?.[monthKey];
    const base = Number(record?.prices.bento_standard || 0);
    const price = Number(record?.prices[categoryId] || 0);
    if (categoryId === "bento_standard") return 1;
    return base > 0 && price > 0 ? price / base : 1;
  }

  function renderChartBars() {
    const entries = chartMode === "days" ? groupedDays : groupedMonths;
    const keys = Object.keys(entries).sort();
    const visibleKeys = keys.length
      ? chartMode === "days"
        ? keys.slice(-14)
        : keys.slice(-8)
      : chartMode === "days"
        ? [String(now.getDate()).padStart(2, "0")]
        : [month];
    const max =
      chartMode === "days"
        ? Math.max(1, ...Object.values(entries as Record<string, number>))
        : Math.max(1, ...Object.values(entries as Record<string, { sold: number }>) .map((item) => item.sold));

    return visibleKeys.map((key, index) => {
      const value =
        chartMode === "days"
          ? Number((entries as Record<string, number>)[key] || 0)
          : Number((entries as Record<string, { sold: number; revenue: number }>)[key]?.sold || 0);
      const revenueValue =
        chartMode === "months"
          ? Number((entries as Record<string, { sold: number; revenue: number }>)[key]?.revenue || 0)
          : 0;
      return (
        <div key={key} className="bar-wrap">
          <div
            className={`bar${index % 2 ? " alt" : ""}${value ? "" : " zero"}`}
            style={{ height: `${Math.max(9, (value / max) * 250)}px`, animationDelay: `${index * 32}ms` }}
          />
          <div className="bar-label">{chartMode === "months" ? formatMonthLabel(key) : key}</div>
          {chartMode === "months" && (
            <div className="bar-stats">
              <strong>{value.toFixed(1)}</strong>
              <span>{Math.round(revenueValue).toLocaleString("ru-RU")} ₴</span>
            </div>
          )}
        </div>
      );
    });
  }

  const entriesList = currentEntries.slice().sort((a, b) => b.date.localeCompare(a.date));

  return (
    <main className="page">
      <div className="spark one">✦</div>
      <div className="spark two">✦</div>
      <div className="spark three">✦</div>

      <section className="dashboard" aria-label="Десктопный дашборд CakeLovely">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark">🎂</div>
            <div>
              <h1>CakeLovely</h1>
              <p>sales dashboard</p>
            </div>
          </div>

          <nav className="nav" aria-label="Разделы">
            <button className={activeView === "dashboardView" ? "active" : ""} type="button" onClick={() => setActiveView("dashboardView")}>
              <span>⌂</span>Главная
            </button>
            <button className={activeView === "settingsView" ? "active" : ""} type="button" onClick={() => setActiveView("settingsView")}>
              <span>⚙</span>Настройки
            </button>
          </nav>

          <div className="settings-summary">
            <div className="label">Категории</div>
            <strong>{categories.length}</strong>
            <small>Для каждой категории есть отдельная цена в настройках.</small>
            <button type="button" onClick={() => setActiveView("settingsView")}>Открыть настройки</button>
          </div>
        </aside>

        <section className="main">
          {activeView === "dashboardView" ? (
            <section className="view active" id="dashboardView">
              <header className="topbar">
                <div className="headline">
                  <h2>{greetingText()}</h2>
                  <p>Выбери город, внеси продажи по категории, а дашборд посчитает количество и выручку только для этой вкладки.</p>
                </div>

                <div className="toolbar">
                  <label>
                    <span className="label">Месяц отчета</span>
                    <div className={`month-picker${monthPickerOpen ? " open" : ""}`} id="monthPicker">
                      <button
                        className="month-trigger"
                        id="monthTrigger"
                        type="button"
                        aria-expanded={monthPickerOpen}
                        aria-controls="monthPopover"
                        onClick={() => setMonthPickerOpen((value) => !value)}
                      >
                        <span className="month-label">{formatMonthValue(month)}</span>
                        <span className="month-icon">▾</span>
                      </button>
                      <div className="month-popover" id="monthPopover" hidden={!monthPickerOpen}>
                        <div className="month-popover-header">
                          <button className="month-nav" type="button" onClick={() => setMonthPickerYear((year) => year - 1)}>‹</button>
                          <strong>{monthPickerYear}</strong>
                          <button className="month-nav" type="button" onClick={() => setMonthPickerYear((year) => year + 1)}>›</button>
                        </div>
                        <div className="month-grid" id="monthGrid">
                          {currentYearMonths.map((monthValue) => (
                            <button
                              key={monthValue}
                              className={`month-option${monthValue === month ? " active" : ""}`}
                              type="button"
                              onClick={() => {
                                setMonth(monthValue);
                                setMonthPickerYear(Number(monthValue.slice(0, 4)) || monthPickerYear);
                                setMonthPickerOpen(false);
                              }}
                            >
                              {monthNames[Number(monthValue.slice(5, 7)) - 1]}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </header>

              <div className="city-tabs" aria-label="Города">
                {cities.map((city) => (
                  <button key={city.id} className={`city-tab${city.id === activeCity ? " active" : ""}`} type="button" onClick={() => setActiveCity(city.id)}>
                    {city.label}
                  </button>
                ))}
              </div>

              <section className="priority-metrics" aria-label="Главные показатели месяца">
                <article className="priority-card sold">
                  <div>
                    <small>Продано за месяц</small>
                    <strong>{sold.toFixed(1)}</strong>
                    <p>в эквиваленте Бенто Standart</p>
                  </div>
                  <div className="cupcake-scene" aria-hidden="true">
                    <img className="cupcake-art" src="/cakelovely-cake.jpeg" alt="" />
                  </div>
                </article>
                <article className="priority-card revenue">
                  <small>Заработано за месяц</small>
                  <strong>{Math.round(earned).toLocaleString("ru-RU")} ₴</strong>
                  <p>{activeCityLabel} · {formatMonthLabel(month)}</p>
                </article>
              </section>

              <section className="metrics" aria-label="Ключевые показатели">
                <article className="metric" style={{ ["--pink" as string]: "#fff1c8" }}>
                  <div className="metric-icon">★</div>
                  <strong>{bestDay}</strong>
                  <small>Лучший день продаж</small>
                </article>
                <article className="metric" style={{ ["--pink" as string]: "#cdefff" }}>
                  <div className="metric-icon">Ø</div>
                  <strong>{avgMetric.toFixed(1)}</strong>
                  <small>Среднее в день с продажами</small>
                </article>
                <article className="metric" style={{ ["--pink" as string]: "#ccefdc" }}>
                  <div className="metric-icon">◉</div>
                  <strong>{topCategory}</strong>
                  <small>Лидер по категориям</small>
                </article>
              </section>

              <section className="workgrid">
                <div className="panel">
                  <div className="panel-title">
                    <h3>Статистика</h3>
                    <span className="label">{activeCityLabel} · {chartMode === "months" ? "по месяцам" : "по дням"}</span>
                  </div>
                  <div className="chart-tabs" aria-label="Переключение статистики">
                    <button className={`chart-tab${chartMode === "days" ? " active" : ""}`} type="button" onClick={() => setChartMode("days")}>По дням</button>
                    <button className={`chart-tab${chartMode === "months" ? " active" : ""}`} type="button" onClick={() => setChartMode("months")}>По месяцам</button>
                  </div>
                  <div className="chart" aria-label="График продаж по дням">
                    {renderChartBars()}
                  </div>
                </div>

                <div className="right-column">
                  <div className="panel">
                    <div className="panel-title">
                      <h3>Добавить запись</h3>
                    </div>
                    <div className="form-grid">
                      <label className="field">
                        <span className="label">Дата</span>
                        <input type="date" value={dateInput} onChange={(event) => setDateInput(event.target.value)} />
                      </label>
                      <label className="field">
                        <span className="label">Количество</span>
                        <input type="number" min="0" step="1" inputMode="numeric" value={countInput} onChange={(event) => setCountInput(Number(event.target.value))} />
                      </label>
                      <label className="field full">
                        <span className="label">Категория</span>
                        <select value={categoryInput} onChange={(event) => setCategoryInput(event.target.value as CategoryId)}>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                          ))}
                        </select>
                      </label>
                      <label className="field full">
                        <span className="label">Источник</span>
                        <input type="text" value={sourceInput} onChange={(event) => setSourceInput(event.target.value)} />
                      </label>
                    </div>
                    <div className="button-row">
                      <button className="btn primary" type="button" onClick={addSale}>Добавить</button>
                      <button className="btn secondary" type="button" onClick={loadDemo}>Пример</button>
                    </div>
                    <div className="toast">{toast}</div>
                  </div>

                  <div className="panel">
                    <div className="panel-title">
                      <h3>Импорт заметки</h3>
                    </div>
                    <label className="field full">
                      <span className="label">05.07 бенто стандарт 4 или 2026-07-05 трайфлы 3</span>
                      <textarea value={noteInput} onChange={(event) => setNoteInput(event.target.value)} />
                    </label>
                    <div className="button-row">
                      <button className="btn primary" type="button" onClick={parseNote}>Разобрать</button>
                      <button className="btn secondary" type="button" onClick={() => updateEntry(activeCity, () => [])}>Очистить</button>
                    </div>
                    <div className="toast">{saved ? "Сохранено" : ""}</div>
                  </div>

                  <div className="panel">
                    <div className="panel-title">
                      <h3>Записи месяца</h3>
                    </div>
                    <div className="entry-list">
                      {entriesList.length ? (
                        entriesList.map((entry, index) => {
                          const category = categoryById(entry.categoryId);
                          const total = entry.count * entry.price;
                          return (
                            <div className="entry-row-list" key={`${entry.date}-${entry.categoryId}-${index}`}>
                              <div>
                                <div className="entry-date">{entry.date}</div>
                                <div className="entry-meta">
                                  {category.name} · {entry.count} шт. · коэф. {coefficientForEntry(entry).toFixed(2)} · {Math.round(total).toLocaleString("ru-RU")} ₴ · {entry.source}
                                </div>
                              </div>
                              <button className="delete" type="button" onClick={() => updateEntry(activeCity, (list) => list.filter((item, idx) => !(item === entry && idx === index)))}>−</button>
                            </div>
                          );
                        })
                      ) : (
                        <div className="empty">В этом месяце в этом городе пока нет записей.</div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </section>
          ) : (
            <section className="view active" id="settingsView">
              <header className="topbar">
                <div className="headline">
                  <h2>Настройки<br /><span>учета</span></h2>
                  <p>Здесь задаются категории и цена для расчета выручки. Продажи в городах остаются раздельными.</p>
                </div>
              </header>

              <section className="settings-grid">
                <div className="settings-card">
                  <h3>Цены категорий</h3>
                  <p>Каждая категория имеет отдельную цену. Эти значения используются для подсчета выручки.</p>
                  <div className="category-price-grid">
                    {categories.map((category) => (
                      <label key={category.id} className="category-price-item">
                        <span className="label">{category.name}</span>
                        <input
                          type="number"
                          min="0"
                          step="10"
                          inputMode="numeric"
                          value={categoryPrices[category.id] || ""}
                          onChange={(event) => setCategoryPrices((prev) => ({ ...prev, [category.id]: Number(event.target.value || 0) }))}
                        />
                        <small className="category-ratio">База считается от Бенто Standart</small>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="settings-card">
                  <h3>История продаж</h3>
                  <p>Выбери город и месяц, затем вручную введи количество и коэффициент по каждой категории. Бенто Standart всегда считается за 1, остальные коэффициенты задаются вручную для этого месяца.</p>
                  <div className="form-grid">
                    <label className="field">
                      <span className="label">Город</span>
                      <select value={historyCityInput} onChange={(event) => setHistoryCityInput(event.target.value as CityId)}>
                        {cities.map((city) => (
                          <option key={city.id} value={city.id}>{city.label}</option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span className="label">Месяц</span>
                      <input type="month" value={historyMonthInput} onChange={(event) => setHistoryMonthInput(event.target.value as MonthKey)} />
                    </label>
                  </div>
                  <div className="history-input-grid" style={{ marginTop: 12 }}>
                    {categories.map((category) => (
                      <label key={category.id} className="history-category-item">
                        <span className="label">{category.name}</span>
                        <small className="category-ratio">Коэф. {monthCoefficient(historyCityInput, historyMonthInput, category.id).toFixed(2)}</small>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          inputMode="numeric"
                          value={historyDraft[category.id]?.price || ""}
                          placeholder={`${categoryPrices[category.id] || 0}`}
                          onChange={(event) => updateHistoryDraft(category.id, "price", event.target.value)}
                        />
                        <input
                          type="number"
                          min="0"
                          step="1"
                          inputMode="numeric"
                          value={historyDraft[category.id]?.count || ""}
                          placeholder="Количество"
                          onChange={(event) => updateHistoryDraft(category.id, "count", event.target.value)}
                        />
                      </label>
                    ))}
                  </div>
                  <div className="button-row">
                    <button className="btn primary" type="button" onClick={saveHistoryMonth}>Сохранить месяц</button>
                    <button className="btn secondary" type="button" onClick={clearHistoryBuffer}>Очистить поля</button>
                  </div>
                  <div className="toast">{historyToast}</div>
                </div>
              </section>
            </section>
          )}
        </section>
      </section>
    </main>
  );
}