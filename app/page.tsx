"use client";

import { useEffect, useMemo, useState } from "react";
import { categoryCoefficient, revenue, weightedSold } from "../lib/metrics";
import { categories, cities, seedRecords } from "../lib/seed-data";
import type { CategoryId, CityId, MonthKey, MonthRecord } from "../lib/types";

const STORAGE_KEY = "cakelovely.sync.dashboard.v1";

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

export default function Page() {
  const [records, setRecords] = useState<MonthRecord[]>(seedRecords);
  const [activeCity, setActiveCity] = useState<CityId>("cityA");
  const [activeMonth, setActiveMonth] = useState<MonthKey>("2026-06");
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
      <section className="dashboard">
        <aside className="sidebar">
          <div>
            <div className="brand">
              <div className="brand-mark">🍰</div>
              <div>
                <h1>CakeLovely</h1>
                <p>Продажи и синхронизация</p>
              </div>
            </div>
          </div>

          <nav className="nav">
            {cities.map((city) => (
              <button
                key={city.id}
                type="button"
                className={city.id === activeCity ? "active" : ""}
                onClick={() => setActiveCity(city.id)}
              >
                <span>◌</span>
                {city.label}
              </button>
            ))}
          </nav>

          <div className="settings-summary">
            <div className="label">Сохранение</div>
            <strong>{syncState === "saved" ? "На устройстве" : "В работе"}</strong>
            <p className="hint" style={{ margin: 0 }}>
              Данные уже сохраняются локально и готовы к переносу в облако.
            </p>
          </div>
        </aside>

        <section className="main">
          <header className="hero">
            <div>
              <div className="label">Добро пожаловать</div>
              <h2>Добрый день, Дарья</h2>
              <p>
                Выбираем город, месяц и вручную вносим цены и количество. Коэффициент считается относительно
                Бенто Standart и влияет только на отображаемое количество.
              </p>
            </div>

            <div className="hero-meta">
              <div className="meta-card">
                <span className="label">Продано за месяц</span>
                <strong>{sold.toFixed(1)}</strong>
              </div>
              <div className="meta-card">
                <span className="label">Заработано</span>
                <strong>{earned.toLocaleString("ru-RU")} ₴</strong>
              </div>
              <div className="meta-card">
                <span className="label">Коэф. XL</span>
                <strong>{categoryCoefficient(currentRecord, "bento_xl").toFixed(1)}</strong>
              </div>
            </div>
          </header>

          <section className="panel form-grid">
            <label className="field">
              <span className="label">Город</span>
              <select value={activeCity} onChange={(event) => setActiveCity(event.target.value as CityId)}>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="label">Месяц</span>
              <input
                type="month"
                value={activeMonth}
                onChange={(event) => setActiveMonth(event.target.value as MonthKey)}
              />
            </label>
          </section>

          <section className="panel">
            <div className="section-head">
              <div>
                <div className="label">История продаж</div>
                <h3>Цены и количество по категориям</h3>
              </div>
              <div className="hint">Бенто Standart считается как 1. Остальное пересчитывается автоматически.</div>
            </div>

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
          </section>

          <section className="panel">
            <div className="section-head">
              <div>
                <div className="label">Сводка</div>
                <h3>Что покажем на главном экране</h3>
              </div>
              <div className="hint">
                {activeCity === "cityA" ? "Харьков" : "Луцк"} · {activeMonth}
              </div>
            </div>

            <div className="stats">
              <article className="stat">
                <small>Продано</small>
                <strong>{sold.toFixed(1)}</strong>
              </article>
              <article className="stat">
                <small>Выручка</small>
                <strong>{earned.toLocaleString("ru-RU")} ₴</strong>
              </article>
              <article className="stat">
                <small>Записей месяцев</small>
                <strong>{monthOptions.length}</strong>
              </article>
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}
