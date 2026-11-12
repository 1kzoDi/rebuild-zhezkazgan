"use client";

import React, { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import {
  CATEGORY_LABELS,
  Material,
  MaterialCategory,
  MaterialCondition,
} from "@/types/rebuild";
import { MaterialCard } from "@/components/catalog/MaterialCard";
import { BookingModal } from "@/components/catalog/BookingModal";
import { Badge } from "@/components/ui/Badge";
import { Search, SlidersHorizontal, X } from "lucide-react";

function CatalogContent() {
  const searchParams = useSearchParams();
  const initialCategory = (searchParams.get("category") as MaterialCategory | "all") || "all";

  const { materials } = useStore();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<MaterialCategory | "all">(initialCategory);
  const [condition, setCondition] = useState<MaterialCondition | "all">("all");
  const [onlyFree, setOnlyFree] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(true);
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc" | "qty_desc">("newest");
  const [bookingTarget, setBookingTarget] = useState<Material | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return materials
      .filter((m) => {
        if (category !== "all" && m.category !== category) return false;
        if (condition !== "all" && m.condition !== condition) return false;
        if (onlyFree && m.priceKzt > 0) return false;
        if (onlyInStock && m.availableQuantity <= 0) return false;
        if (q) {
          const hay = `${m.title} ${m.description} ${m.cellId ?? ""} ${m.sellerName}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price_asc") return a.priceKzt - b.priceKzt;
        if (sortBy === "price_desc") return b.priceKzt - a.priceKzt;
        if (sortBy === "qty_desc") return b.availableQuantity - a.availableQuantity;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [materials, query, category, condition, onlyFree, onlyInStock, sortBy]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Badge variant="lime" className="mb-2">г. Жезказган • Демо-каталог</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#181A1F]">
            Каталог стройматериалов
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Остатки после ремонта и строек, синхронизированные с 2D-картой склада ReBuild.
          </p>
        </div>
        <div className="text-sm font-semibold text-slate-600">
          Найдено: <span className="text-[#0D2B22] font-extrabold">{filtered.length}</span> из{" "}
          {materials.length}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск: Кирпич красный, доска, A-04..."
              className="w-full rounded-xl border border-slate-300 pl-10 pr-9 py-2.5 text-sm focus:border-[#0D2B22] focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="md:col-span-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as MaterialCategory | "all")}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm bg-white focus:border-[#0D2B22] focus:outline-none"
            >
              <option value="all">Все категории</option>
              {(Object.keys(CATEGORY_LABELS) as MaterialCategory[]).map((key) => (
                <option key={key} value={key}>
                  {CATEGORY_LABELS[key]}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as MaterialCondition | "all")}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm bg-white focus:border-[#0D2B22] focus:outline-none"
            >
              <option value="all">Любое состояние</option>
              <option value="Новый остаток">Новый остаток</option>
              <option value="Б/у, отличное состояние">Б/у, отличное</option>
              <option value="Б/у, пригоден для повторного использования">Б/у, пригоден</option>
              <option value="Требует очистки">Требует очистки</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm bg-white focus:border-[#0D2B22] focus:outline-none"
            >
              <option value="newest">Сначала новые</option>
              <option value="price_asc">Дешевле</option>
              <option value="price_desc">Дороже</option>
              <option value="qty_desc">Больше остаток</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-700">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => setOnlyInStock(e.target.checked)}
                className="rounded border-slate-300 accent-[#0D2B22]"
              />
              Только в наличии
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyFree}
                onChange={(e) => setOnlyFree(e.target.checked)}
                className="rounded border-slate-300 accent-[#0D2B22]"
              />
              Бесплатная передача (0 ₸)
            </label>
          </div>

          {(query || category !== "all" || condition !== "all" || onlyFree) && (
            <button
              onClick={() => {
                setQuery("");
                setCategory("all");
                setCondition("all");
                setOnlyFree(false);
                setOnlyInStock(true);
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D2B22] hover:underline cursor-pointer"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Сбросить фильтры
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-2">
          <p className="text-base font-bold text-[#181A1F]">Материалы не найдены</p>
          <p className="text-sm text-slate-500">
            Попробуйте изменить поисковый запрос или сбросить фильтры.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filtered.map((mat) => (
            <MaterialCard
              key={mat.id}
              material={mat}
              onReserve={(m) => setBookingTarget(m)}
            />
          ))}
        </div>
      )}

      <BookingModal
        material={bookingTarget}
        onClose={() => setBookingTarget(null)}
      />
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Загрузка каталога...</div>}>
      <CatalogContent />
    </Suspense>
  );
}

