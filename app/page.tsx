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
const cupcakeImage = "data:image/jpeg;base64,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";

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
                    <img className="cupcake-art" src={cupcakeImage} alt="" />
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