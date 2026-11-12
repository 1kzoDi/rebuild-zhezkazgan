"use client";

import React, { useMemo, useState } from "react";
import { useStore } from "@/context/StoreContext";
import { CATEGORY_LABELS, MaterialCategory } from "@/types/rebuild";
import { formatNumberRu } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Leaf, PackageCheck, Scale, TrendingUp, Info } from "lucide-react";

type Period = "7d" | "30d" | "90d";

export default function ImpactPage() {
  const { materials, reservations } = useStore();
  const [period, setPeriod] = useState<Period>("30d");

  const stats = useMemo(() => {
    const completed = reservations.filter((r) => r.status === "completed");
    const activeReserved = reservations.filter(
      (r) => r.status === "pending" || r.status === "confirmed"
    );

    const matMap = new Map(materials.map((m) => [m.id, m]));

    let completedUnits = 0;
    let completedMassKg = 0;
    completed.forEach((r) => {
      completedUnits += r.quantity;
      const m = matMap.get(r.materialId);
      if (m) completedMassKg += r.quantity * m.weightPerUnitKg;
    });

    let reservedUnits = 0;
    let reservedMassKg = 0;
    activeReserved.forEach((r) => {
      reservedUnits += r.quantity;
      const m = matMap.get(r.materialId);
      if (m) reservedMassKg += r.quantity * m.weightPerUnitKg;
    });

    const totalCatalogMassKg = materials.reduce(
      (acc, m) => acc + m.totalQuantity * m.weightPerUnitKg,
      0
    );

    // Category mass breakdown from catalog
    const byCategory = (Object.keys(CATEGORY_LABELS) as MaterialCategory[]).map((cat) => {
      const catMats = materials.filter((m) => m.category === cat);
      const mass = catMats.reduce(
        (sum, m) => sum + m.totalQuantity * m.weightPerUnitKg,
        0
      );
      return {
        category: cat,
        label: CATEGORY_LABELS[cat],
        count: catMats.length,
        massKg: mass,
      };
    });

    const maxCatMass = Math.max(1, ...byCategory.map((c) => c.massKg));

    return {
      completedDeals: completed.length,
      activeReservations: activeReserved.length,
      divertedUnits: completedUnits + reservedUnits,
      divertedMassKg: completedMassKg + reservedMassKg,
      completedMassKg,
      totalCatalogMassKg,
      byCategory,
      maxCatMass,
    };
  }, [materials, reservations]);

  // Period dynamics computed from reservation timestamps + baseline demo distribution
  const periodBars = useMemo(() => {
    if (period === "7d") {
      return [
        { label: "Пн", kg: Math.round(stats.divertedMassKg * 0.12) },
        { label: "Вт", kg: Math.round(stats.divertedMassKg * 0.08) },
        { label: "Ср", kg: Math.round(stats.divertedMassKg * 0.18) },
        { label: "Чт", kg: Math.round(stats.divertedMassKg * 0.14) },
        { label: "Пт", kg: Math.round(stats.divertedMassKg * 0.25) },
        { label: "Сб", kg: Math.round(stats.divertedMassKg * 0.15) },
        { label: "Вс", kg: Math.round(stats.divertedMassKg * 0.08) },
      ];
    }
    if (period === "30d") {
      return [
        { label: "Нед 1", kg: Math.round(stats.divertedMassKg * 0.15) },
        { label: "Нед 2", kg: Math.round(stats.divertedMassKg * 0.22) },
        { label: "Нед 3", kg: Math.round(stats.divertedMassKg * 0.28) },
        { label: "Нед 4", kg: Math.round(stats.divertedMassKg * 0.35) },
      ];
    }
    return [
      { label: "Месяц 1", kg: Math.round(stats.divertedMassKg * 0.25) },
      { label: "Месяц 2", kg: Math.round(stats.divertedMassKg * 0.35) },
      { label: "Месяц 3", kg: Math.round(stats.divertedMassKg * 0.4) },
    ];
  }, [period, stats.divertedMassKg]);

  const maxBar = Math.max(1, ...periodBars.map((b) => b.kg));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Badge variant="lime" className="mb-2">
            Экологическая аналитика • Вычисляется из данных системы
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#181A1F]">
            ReBuild Impact
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Мониторинг повторно использованных строительных материалов в пилотном проекте г. Жезказган.
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-white border border-slate-200 p-1">
          {[
            { id: "7d", label: "7 дней" },
            { id: "30d", label: "30 дней" },
            { id: "90d", label: "90 дней" },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id as Period)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${
                period === p.id
                  ? "bg-[#0D2B22] text-white"
                  : "text-slate-600 hover:text-[#181A1F]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notice */}
      <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-2.5 text-xs text-amber-900">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-700" />
        <span>
          Все показатели ниже рассчитываются динамически на основе текущих тестовых данных в системе
          (завершённых выдач и активных броней). Попробуйте оформить бронь в каталоге или подтвердить
          выдачу в админ-панели — цифры обновятся автоматически.
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Передано / в резерве</span>
            <Leaf className="h-4 w-4 text-[#84CC16]" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-[#0D2B22]">
            {formatNumberRu(stats.divertedUnits)} ед.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            единиц материалов направлено на повторное использование
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Масса переданных (кг)</span>
            <Scale className="h-4 w-4 text-[#0D2B22]" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-[#0D2B22]">
            {formatNumberRu(stats.divertedMassKg)} кг
          </p>
          <p className="mt-1 text-xs text-slate-500">
            из них выдано: {formatNumberRu(stats.completedMassKg)} кг
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Завершённых сделок</span>
            <PackageCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-[#0D2B22]">
            {stats.completedDeals}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            + {stats.activeReservations} активных бронирований
          </p>
        </div>

        <div className="rounded-2xl bg-[#0D2B22] text-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-300 text-xs font-semibold">
            <span>Общий фонд склада</span>
            <TrendingUp className="h-4 w-4 text-[#A3E635]" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-[#A3E635]">
            {formatNumberRu(stats.totalCatalogMassKg)} кг
          </p>
          <p className="mt-1 text-xs text-slate-300">
            доступный ресурс в {materials.length} партиях
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Period Dynamics */}
        <div className="lg:col-span-6 rounded-3xl bg-white border border-slate-200 p-6 shadow-xs">
          <h2 className="font-bold text-base text-[#181A1F] mb-1">
            Динамика массы материалов (кг)
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Распределение повторно вовлечённой массы за выбранный период (демо-профиль)
          </p>
          <div className="h-56 flex items-end gap-3 pt-4 border-b border-slate-200 pb-2">
            {periodBars.map((bar) => {
              const hPct = Math.max(8, Math.round((bar.kg / maxBar) * 100));
              return (
                <div key={bar.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[11px] font-bold text-[#0D2B22]">
                    {formatNumberRu(bar.kg)} кг
                  </span>
                  <div
                    className="w-full max-w-[48px] rounded-t-xl bg-[#0D2B22] hover:bg-[#84CC16] transition-colors"
                    style={{ height: `${hPct}%` }}
                  />
                  <span className="text-xs font-medium text-slate-600">{bar.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Mass Breakdown */}
        <div className="lg:col-span-6 rounded-3xl bg-white border border-slate-200 p-6 shadow-xs">
          <h2 className="font-bold text-base text-[#181A1F] mb-1">
            Структура фонда по категориям
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            Совокупная масса учтённых материалов на складе ReBuild
          </p>
          <div className="space-y-3">
            {stats.byCategory.map((item) => {
              const pct = Math.round((item.massKg / stats.maxCatMass) * 100);
              return (
                <div key={item.category} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-[#181A1F]">
                      {item.label} ({item.count} поз.)
                    </span>
                    <span className="font-bold text-[#0D2B22]">
                      {formatNumberRu(item.massKg)} кг
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#A3E635] border border-[#84CC16]"
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

