"use client";

import { useEffect, useMemo, useState } from "react";
import { categories, cities, defaultPrices, seedRecords } from "../lib/seed-data";
import type { CategoryId, CityId, MonthKey, MonthRecord } from "../lib/types";

type View = "dashboard" | "settings";
type PriceMap = Record<CategoryId, number>;
type CountMap = Record<CategoryId, number>;

const STORAGE_KEY = "cakelovely-dashboard-v6";
const now = new Date();
const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}` as MonthKey;
const monthNames = ["янв.", "февр.", "марта", "апр.", "мая", "июня", "июля", "авг.", "сент.", "окт.", "нояб.", "дек."];
const cakeImage = "/cakelovely-cake.svg";

const priceGroups: { title: string; ids: CategoryId[] }[] = [
  { title: "Бенто", ids: ["bento_standard", "bento_xl"] },
  { title: "Набор", ids: ["set_standard", "set_mini", "set_maxi", "cupcakes"] },
  { title: "Набор с трайфлами", ids: ["set_truffles_standard", "set_truffles_mini", "set_truffles_maxi", "truffles"] },
  { title: "Дополнительно", ids: ["build_yourself", "mousse_cake"] }
];

function emptyCounts(): CountMap {
  return Object.fromEntries(categories.map((category) => [category.id, 0])) as CountMap;
}

function normalizePrices(prices?: Partial<PriceMap>): PriceMap {
  return Object.fromEntries(categories.map((category) => [category.id, Number(prices?.[category.id] ?? defaultPrices[category.id] ?? 0)])) as PriceMap;
}

function normalizeCounts(counts?: Partial<CountMap>): CountMap {
  return Object.fromEntries(categories.map((category) => [category.id, Number(counts?.[category.id] ?? 0)])) as CountMap;
}

function monthLabel(month: MonthKey) {
  const [year, rawMonth] = month.split("-").map(Number);
  return `${monthNames[rawMonth - 1] || rawMonth} ${year}`;
}

function monthRange(year: number) {
  return monthNames.map((_, index) => `${year}-${String(index + 1).padStart(2, "0")}` as MonthKey);
}

function previousMonth(month: MonthKey) {
  const [year, rawMonth] = month.split("-").map(Number);
  const date = new Date(year, rawMonth - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}` as MonthKey;
}

function getGreeting() {
  let hour = now.getHours();
  try {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Kyiv", hour: "2-digit", hour12: false }).formatToParts(new Date());
    hour = Number(parts.find((part) => part.type === "hour")?.value || hour);
  } catch {}
  if (hour >= 5 && hour < 12) return "Доброе утро, Дарья";
  if (hour >= 12 && hour < 17) return "Добрый день, Дарья";
  if (hour >= 17 && hour < 23) return "Добрый вечер, Дарья";
  return "Доброй ночи, Дарья";
}

function categoryName(categoryId: CategoryId) {
  return categories.find((category) => category.id === categoryId)?.name || categoryId;
}

function coefficient(record: MonthRecord, categoryId: CategoryId) {
  const base = Number(record.prices.bento_standard || 0);
  const price = Number(record.prices[categoryId] || 0);
  if (categoryId === "bento_standard") return 1;
  return base > 0 && price > 0 ? price / base : 0;
}

function recordTotals(record: MonthRecord) {
  return categories.reduce(
    (total, category) => {
      const count = Number(record.counts[category.id] || 0);
      const price = Number(record.prices[category.id] || 0);
      total.sold += count * coefficient(record, category.id);
      total.revenue += count * price;
      return total;
    },
    { sold: 0, revenue: 0 }
  );
}

function latestPrices(records: MonthRecord[], cityId: CityId, beforeMonth?: MonthKey) {
  const cityRecords = records
    .filter((record) => record.cityId === cityId && (!beforeMonth || record.month < beforeMonth))
    .sort((a, b) => b.month.localeCompare(a.month));
  return normalizePrices(cityRecords[0]?.prices);
}

function makeRecord(records: MonthRecord[], cityId: CityId, month: MonthKey): MonthRecord {
  return {
    cityId,
    month,
    prices: latestPrices(records, cityId, month),
    counts: emptyCounts()
  };
}

export default function Page() {
  const [view, setView] = useState<View>("dashboard");
  const [activeCity, setActiveCity] = useState<CityId>("cityA");
  const [month, setMonth] = useState<MonthKey>(defaultMonth);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(now.getFullYear());
  const [records, setRecords] = useState<MonthRecord[]>(seedRecords);
  const [savedNotice, setSavedNotice] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as { activeCity?: CityId; month?: MonthKey; records?: MonthRecord[] };
      if (parsed.activeCity) setActiveCity(parsed.activeCity);
      if (parsed.month) setMonth(parsed.month);
      if (parsed.records) {
        setRecords(parsed.records.map((record) => ({ ...record, prices: normalizePrices(record.prices), counts: normalizeCounts(record.counts) })));
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ activeCity, month, records }));
  }, [activeCity, month, records]);

  useEffect(() => {
    setPickerYear(Number(month.slice(0, 4)) || now.getFullYear());
  }, [month]);

  const activeRecord = useMemo(() => {
    return records.find((record) => record.cityId === activeCity && record.month === month) || makeRecord(records, activeCity, month);
  }, [records, activeCity, month]);

  const cityRecords = useMemo(() => records.filter((record) => record.cityId === activeCity).sort((a, b) => a.month.localeCompare(b.month)), [records, activeCity]);
  const latestRecord = cityRecords[cityRecords.length - 1] || activeRecord;
  const previousRecord = records.find((record) => record.cityId === activeCity && record.month === previousMonth(latestRecord.month));
  const totals = useMemo(() => recordTotals(activeRecord), [activeRecord]);
  const cityLabel = cities.find((city) => city.id === activeCity)?.label || "";
  const monthlyRows = cityRecords.length ? cityRecords.map((record) => ({ record, ...recordTotals(record) })) : [{ record: activeRecord, ...totals }];
  const maxMonthlySold = Math.max(1, ...monthlyRows.map((row) => row.sold));
  const maxCategoryCount = Math.max(
    1,
    ...categories.flatMap((category) => [
      Number(latestRecord.counts[category.id] || 0),
      Number(previousRecord?.counts[category.id] || 0)
    ])
  );

  function ensureRecord() {
    const index = records.findIndex((record) => record.cityId === activeCity && record.month === month);
    if (index >= 0) return { index, record: records[index] };
    return { index: -1, record: makeRecord(records, activeCity, month) };
  }

  function updateRecord(categoryId: CategoryId, field: "price" | "count", value: string) {
    const numericValue = Number(value || 0);
    const { index, record } = ensureRecord();
    const updated: MonthRecord = {
      ...record,
      prices: normalizePrices(record.prices),
      counts: normalizeCounts(record.counts)
    };
    if (field === "price") updated.prices[categoryId] = numericValue;
    if (field === "count") updated.counts[categoryId] = numericValue;

    setRecords((current) => (index >= 0 ? current.map((item, itemIndex) => (itemIndex === index ? updated : item)) : [...current, updated]));
    setSavedNotice("");
  }

  function saveMonth() {
    const { index, record } = ensureRecord();
    setRecords((current) => (index >= 0 ? current.map((item, itemIndex) => (itemIndex === index ? record : item)) : [...current, record]));
    setSavedNotice("Данные сохранены.");
  }

  function selectMonth(value: MonthKey) {
    setMonth(value);
    setPickerOpen(false);
  }

  return (
    <main className="page">
      <section className="dashboard" aria-label="CakeLovely dashboard">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark">🎂</div>
            <div>
              <h1>CakeLovely</h1>
              <p>sales dashboard</p>
            </div>
          </div>

          <nav className="nav" aria-label="Разделы">
            <button className={view === "dashboard" ? "active" : ""} type="button" onClick={() => setView("dashboard")}>
              <span>⌂</span>Главная
            </button>
            <button className={view === "settings" ? "active" : ""} type="button" onClick={() => setView("settings")}>
              <span>⚙</span>Настройки
            </button>
          </nav>
        </aside>

        <section className="main">
          <header className="topbar">
            <div className="headline">
              <p className="eyebrow">Добро пожаловать</p>
              <h2>{view === "dashboard" ? getGreeting() : "История продаж"}</h2>
              <p>Выбери город, месяц и внеси продажи по категориям. Дашборд считает количество и выручку отдельно для каждой вкладки.</p>
            </div>

            <div className="toolbar" id="monthPicker">
              <span className="label">Месяц отчета</span>
              <button className="month-trigger" type="button" onClick={() => setPickerOpen((value) => !value)} aria-expanded={pickerOpen}>
                <span>{monthLabel(month)}</span>
                <span className="month-icon">▾</span>
              </button>
              <div className="month-popover" hidden={!pickerOpen}>
                <div className="month-popover-header">
                  <button className="month-nav" type="button" onClick={() => setPickerYear((year) => year - 1)}>‹</button>
                  <strong>{pickerYear}</strong>
                  <button className="month-nav" type="button" onClick={() => setPickerYear((year) => year + 1)}>›</button>
                </div>
                <div className="month-grid">
                  {monthRange(pickerYear).map((item) => (
                    <button key={item} className={`month-option${item === month ? " active" : ""}`} type="button" onClick={() => selectMonth(item)}>
                      {monthNames[Number(item.slice(5, 7)) - 1]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </header>

          <div className="city-tabs" aria-label="Города">
            {cities.map((city) => (
              <button key={city.id} className={`city-tab${city.id === activeCity ? " active" : ""}`} type="button" onClick={() => setActiveCity(city.id)}>
                {city.label}
              </button>
            ))}
          </div>

          {view === "dashboard" ? (
            <section className="view active">
              <section className="priority-metrics" aria-label="Главные показатели">
                <article className="priority-card sold">
                  <div className="priority-copy">
                    <small>Продано за месяц</small>
                    <strong>{totals.sold.toFixed(1)}</strong>
                    <p>в эквиваленте Бенто Standart</p>
                  </div>
                  <div className="cake-frame" aria-hidden="true">
                    <img src={cakeImage} alt="" />
                  </div>
                </article>

                <article className="priority-card revenue">
                  <small>Заработано за месяц</small>
                  <strong>{Math.round(totals.revenue).toLocaleString("ru-RU")} ₴</strong>
                  <p>{cityLabel} · {monthLabel(month)}</p>
                </article>
              </section>

              <section className="stats-grid">
                <article className="panel chart-panel">
                  <div className="panel-title">
                    <h3>Продажи по месяцам</h3>
                    <span className="label">{cityLabel}</span>
                  </div>
                  <div className="chart month-chart" aria-label="График продаж по месяцам">
                    {monthlyRows.map((row, index) => (
                      <div className="bar-wrap" key={row.record.month}>
                        <div className="bar" style={{ height: `${Math.max(24, (row.sold / maxMonthlySold) * 250)}px`, animationDelay: `${index * 40}ms` }} />
                        <div className="bar-label">{monthLabel(row.record.month)}</div>
                        <div className="bar-stats">
                          <strong>{row.sold.toFixed(1)}</strong>
                          <span>{Math.round(row.revenue).toLocaleString("ru-RU")} ₴</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="panel chart-panel">
                  <div className="panel-title">
                    <h3>Товары по категориям</h3>
                    <span className="label">{monthLabel(latestRecord.month)} / {monthLabel(previousMonth(latestRecord.month))}</span>
                  </div>
                  <div className="category-chart" aria-label="Сравнение категорий">
                    {priceGroups.map((group) => (
                      <section className="category-chart-group" key={group.title} aria-label={group.title}>
                        <h4>{group.title}</h4>
                        <div className="category-chart-items">
                          {group.ids.map((categoryId) => {
                            const current = Number(latestRecord.counts[categoryId] || 0);
                            const previous = Number(previousRecord?.counts[categoryId] || 0);
                            return (
                              <div className="category-bar-row" key={categoryId}>
                                <div className="category-chart-label">{categoryName(categoryId)}</div>
                                <div className="paired-bars">
                                  <span className="category-bar current" style={{ height: `${Math.max(8, (current / maxCategoryCount) * 150)}px` }} />
                                  <span className="category-bar previous" style={{ height: `${Math.max(8, (previous / maxCategoryCount) * 150)}px` }} />
                                </div>
                                <div className="category-values">{current} / {previous}</div>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    ))}
                  </div>
                </article>
              </section>
            </section>
          ) : (
            <section className="view active settings-stack">
              <section className="settings-card">
                <div className="panel-title">
                  <h3>История продаж</h3>
                  <span className="label">{cityLabel} · {monthLabel(month)}</span>
                </div>
                <p>Для каждого месяца вручную укажи цену и количество. Новые месяцы предзаполняются последними введенными ценами, но прошлые месяцы не меняются.</p>

                <div className="settings-group-list">
                  {priceGroups.map((group) => (
                    <div className="settings-group" key={group.title}>
                      <h4>{group.title}</h4>
                      <div className={`settings-group-grid settings-group-grid-${Math.min(group.ids.length, 4)}`}>
                        {group.ids.map((categoryId) => (
                          <label key={categoryId} className="category-price-item">
                            <span className="category-name">{categoryName(categoryId)}</span>
                            <span className="category-ratio">Коэф. {coefficient(activeRecord, categoryId).toFixed(2)}</span>
                            <input
                              type="number"
                              min="0"
                              step="10"
                              inputMode="numeric"
                              aria-label={`${categoryName(categoryId)} цена`}
                              value={activeRecord.prices[categoryId] || ""}
                              placeholder="Цена"
                              onChange={(event) => updateRecord(categoryId, "price", event.target.value)}
                            />
                            <input
                              type="number"
                              min="0"
                              step="1"
                              inputMode="numeric"
                              aria-label={`${categoryName(categoryId)} количество`}
                              value={activeRecord.counts[categoryId] || ""}
                              placeholder="Количество"
                              onChange={(event) => updateRecord(categoryId, "count", event.target.value)}
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="save-row">
                  <button className="save-button" type="button" onClick={saveMonth}>Сохранить данные</button>
                  <span>{savedNotice}</span>
                </div>
              </section>
            </section>
          )}
        </section>
      </section>
    </main>
  );
}
