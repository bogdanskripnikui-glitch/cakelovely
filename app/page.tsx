"use client";

import { useEffect, useMemo, useState } from "react";
import { categoryCoefficient, revenue, weightedSold } from "../lib/metrics";
import { categories, cities, seedRecords } from "../lib/seed-data";
import type { CategoryId, CityId, MonthKey, MonthRecord } from "../lib/types";

const STORAGE_KEY = "cakelovely.sync.dashboard.v1";
const monthLabel = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" });

type View = "dashboard" | "settings";

function emptyRecord(cityId: CityId, month: MonthKey): MonthRecord {
  return {
    cityId,
    month,
    prices: Object.fromEntries(categories.map((category) => [category.id, 0])) as MonthRecord["prices"],
    counts: Object.fromEntries(categories.map((category) => [category.id, 0])) as MonthRecord["counts"]
  };
}

function parseValue(value: string) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0;
}

function upsertRecord(records: MonthRecord[], nextRecord: MonthRecord) {
  const index = records.findIndex(
    (record) => record.cityId === nextRecord.cityId && record.month === nextRecord.month
  );

  if (index === -1) {
    return [...records, nextRecord];
  }

  const cloned = records.slice();
  cloned[index] = nextRecord;
  return cloned;
}

function formatMonthLabel(month: MonthKey) {
  const [year, monthNumber] = month.split("-").map(Number);
  if (!year || !monthNumber) return month;
  return monthLabel.format(new Date(year, monthNumber - 1, 1));
}

function greetingTitle() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Доброе утро, Дарья";
  if (hour >= 12 && hour < 17) return "Добрый день, Дарья";
  if (hour >= 17 && hour < 23) return "Добрый вечер, Дарья";
  return "Доброй ночи, Дарья";
}

export default function Page() {
  const [records, setRecords] = useState<MonthRecord[]>(seedRecords);
  const [activeCity, setActiveCity] = useState<CityId>("cityA");
  const [activeMonth, setActiveMonth] = useState<MonthKey>("2026-06");
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [hydrated, setHydrated] = useState(false);
  const [syncState, setSyncState] = useState<"local" | "saved">("local");

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as MonthRecord[];
        if (Array.isArray(parsed)) {
          setRecords(parsed);
          const first = parsed[0];
          if (first) {
            setActiveCity(first.cityId);
            setActiveMonth(first.month);
          }
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    setSyncState("saved");
  }, [records, hydrated]);

  const currentRecord = useMemo(() => {
    return (
      records.find((record) => record.cityId === activeCity && record.month === activeMonth) ??
      emptyRecord(activeCity, activeMonth)
    );
  }, [records, activeCity, activeMonth]);

  const monthOptions = useMemo(() => {
    return Array.from(new Set(records.map((record) => record.month))).sort().reverse();
  }, [records]);

  const sold = weightedSold(currentRecord);
  const earned = revenue(currentRecord);
  const currentCityLabel = cities.find((city) => city.id === activeCity)?.label ?? "-";
  const topCategory = useMemo(() => {
    let winner = categories[0];
    let winnerScore = -1;

    for (const category of categories) {
      const score = (currentRecord.counts[category.id] || 0) * categoryCoefficient(currentRecord, category.id);
      if (score > winnerScore) {
        winnerScore = score;
        winner = category;
      }
    }

    return winnerScore > 0 ? winner.name : "-";
  }, [currentRecord]);

  function updateCategory(categoryId: CategoryId, field: "price" | "count", value: string) {
    const nextValue = parseValue(value);
    setRecords((prev) => {
      const base =
        prev.find((record) => record.cityId === activeCity && record.month === activeMonth) ??
        emptyRecord(activeCity, activeMonth);
      const nextRecord: MonthRecord = {
        ...base,
        prices: { ...base.prices },
        counts: { ...base.counts }
      };

      if (field === "price") {
        nextRecord.prices[categoryId] = nextValue;
      } else {
        nextRecord.counts[categoryId] = nextValue;
      }

      return upsertRecord(prev, nextRecord);
    });
    setSyncState("local");
  }

  return (
    <main className="page">
      <div className="spark one">✦</div>
      <div className="spark two">✦</div>
      <div className="spark three">✦</div>

      <section className="dashboard">
        <aside className="sidebar">
          <div>
            <div className="brand">
              <div className="brand-mark">🍰</div>
              <div>
                <h1>CakeLovely</h1>
                <p>sales dashboard</p>
              </div>
            </div>
          </div>

          <nav className="nav" aria-label="Разделы">
            <button
              className={activeView === "dashboard" ? "active" : ""}
              type="button"
              onClick={() => setActiveView("dashboard")}
            >
              <span>⌂</span>Главная
            </button>
            <button
              className={activeView === "settings" ? "active" : ""}
              type="button"
              onClick={() => setActiveView("settings")}
            >
              <span>⚙</span>Настройки
            </button>
          </nav>

          <div className="settings-summary">
            <div className="label">Категории</div>
            <strong>{categories.length}</strong>
            <small>Для каждой категории есть отдельная цена и количество.</small>
            <button type="button" onClick={() => setActiveView("settings")}>Открыть настройки</button>
          </div>
        </aside>

        {activeView === "dashboard" ? (
          <section className="main">
            <header className="topbar">
              <div className="headline">
                <div className="label">Добро пожаловать</div>
                <h2>{greetingTitle()}</h2>
                <p>Выбери город, внеси продажи по категории, а дашборд посчитает количество и выручку только для этой вкладки.</p>
              </div>

              <div className="toolbar">
                <label>
                  <span className="label">Месяц отчета</span>
                  <select value={activeMonth} onChange={(event) => setActiveMonth(event.target.value as MonthKey)}>
                    {monthOptions.map((month) => (
                      <option key={month} value={month}>{formatMonthLabel(month)}</option>
                    ))}
                  </select>
                </label>
              </div>
            </header>

            <div className="city-tabs" aria-label="Города">
              {cities.map((city) => (
                <button
                  key={city.id}
                  className={city.id === activeCity ? "city-tab active" : "city-tab"}
                  type="button"
                  onClick={() => setActiveCity(city.id)}
                >
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
                <div className="cupcake-scene" aria-hidden="true">🎂</div>
              </article>

              <article className="priority-card revenue">
                <small>Заработано за месяц</small>
                <strong>{earned.toLocaleString("ru-RU")} ₴</strong>
                <p>{currentCityLabel} · {formatMonthLabel(activeMonth)}</p>
              </article>
            </section>

            <section className="metrics" aria-label="Ключевые показатели">
              <article className="metric" style={{ ["--pink" as string]: "#fff1c8" }}>
                <div className="metric-icon">★</div>
                <strong>{categories.length}</strong>
                <small>Категорий в системе</small>
              </article>
              <article className="metric" style={{ ["--pink" as string]: "#cdefff" }}>
                <div className="metric-icon">◎</div>
                <strong>{topCategory}</strong>
                <small>Лидер по месяцу</small>
              </article>
              <article className="metric" style={{ ["--pink" as string]: "#ccefdc" }}>
                <div className="metric-icon">◉</div>
                <strong>{syncState === "saved" ? "Сохранено" : "В работе"}</strong>
                <small>Статус сохранения</small>
              </article>
            </section>

            <section className="workgrid">
              <div className="panel">
                <div className="panel-title">
                  <h3>Цены и количество по категориям</h3>
                  <span className="label">{currentCityLabel} · {formatMonthLabel(activeMonth)}</span>
                </div>
                <p className="panel-note">Бенто Standart считается как 1. Остальное пересчитывается автоматически.</p>

                <div className="entry-grid">
                  {categories.map((category) => {
                    const coefficient = categoryCoefficient(currentRecord, category.id);
                    const price = currentRecord.prices[category.id];
                    const count = currentRecord.counts[category.id];

                    return (
                      <article key={category.id} className="entry">
                        <strong>{category.name}</strong>

                        <div className="entry-row">
                          <label className="field">
                            <span className="label">Цена</span>
                            <input
                              inputMode="numeric"
                              value={price || ""}
                              placeholder="0"
                              onChange={(event) => updateCategory(category.id, "price", event.target.value)}
                            />
                          </label>

                          <label className="field">
                            <span className="label">Кол-во</span>
                            <input
                              inputMode="numeric"
                              value={count || ""}
                              placeholder="0"
                              onChange={(event) => updateCategory(category.id, "count", event.target.value)}
                            />
                          </label>

                          <div className="mini-metric">
                            <span className="label">Коэф.</span>
                            <strong>{coefficient.toFixed(2)}</strong>
                          </div>

                          <div className="mini-metric">
                            <span className="label">Взвешено</span>
                            <strong>{(count * coefficient).toFixed(1)}</strong>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>

              <div className="right-column">
                <div className="panel">
                  <div className="panel-title">
                    <h3>Сводка</h3>
                  </div>
                  <div className="summary-stack">
                    <div>
                      <span className="label">Город</span>
                      <strong>{currentCityLabel}</strong>
                    </div>
                    <div>
                      <span className="label">Месяц</span>
                      <strong>{formatMonthLabel(activeMonth)}</strong>
                    </div>
                    <div>
                      <span className="label">Сохранение</span>
                      <strong>{syncState === "saved" ? "Локально сохранено" : "Есть изменения"}</strong>
                    </div>
                    <div>
                      <span className="label">Продано</span>
                      <strong>{sold.toFixed(1)}</strong>
                    </div>
                    <div>
                      <span className="label">Выручка</span>
                      <strong>{earned.toLocaleString("ru-RU")} ₴</strong>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </section>
        ) : (
          <section className="main">
            <header className="topbar">
              <div className="headline">
                <div className="label">Настройки</div>
                <h2>Учет продаж</h2>
                <p>Здесь задаются цены категорий и история продаж по месяцам. На главной они не показываются.</p>
              </div>
            </header>

            <section className="panel">
              <div className="panel-title">
                <h3>История продаж</h3>
                <span className="label">{currentCityLabel} · {formatMonthLabel(activeMonth)}</span>
              </div>

              <div className="form-grid">
                <label className="field">
                  <span className="label">Город</span>
                  <select value={activeCity} onChange={(event) => setActiveCity(event.target.value as CityId)}>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>{city.label}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span className="label">Месяц</span>
                  <select value={activeMonth} onChange={(event) => setActiveMonth(event.target.value as MonthKey)}>
                    {monthOptions.map((month) => (
                      <option key={month} value={month}>{formatMonthLabel(month)}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div style={{ marginTop: 16 }} className="entry-grid">
                {categories.map((category) => {
                  const coefficient = categoryCoefficient(currentRecord, category.id);
                  const price = currentRecord.prices[category.id];
                  const count = currentRecord.counts[category.id];

                  return (
                    <article key={category.id} className="entry">
                      <strong>{category.name}</strong>
                      <div className="entry-row">
                        <label className="field">
                          <span className="label">Цена</span>
                          <input
                            inputMode="numeric"
                            value={price || ""}
                            placeholder="0"
                            onChange={(event) => updateCategory(category.id, "price", event.target.value)}
                          />
                        </label>
                        <label className="field">
                          <span className="label">Кол-во</span>
                          <input
                            inputMode="numeric"
                            value={count || ""}
                            placeholder="0"
                            onChange={(event) => updateCategory(category.id, "count", event.target.value)}
                          />
                        </label>
                        <div className="mini-metric">
                          <span className="label">Коэф.</span>
                          <strong>{coefficient.toFixed(2)}</strong>
                        </div>
                        <div className="mini-metric">
                          <span className="label">Взвешено</span>
                          <strong>{(count * coefficient).toFixed(1)}</strong>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </section>
        )}
      </section>
    </main>
  );
}
