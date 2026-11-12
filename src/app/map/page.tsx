"use client";

import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import {
  CATEGORY_LABELS,
  CityPoint,
  CityPointType,
  MaterialCategory,
} from "@/types/rebuild";
import { formatKzt } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Clock,
  MapPin,
  Phone,
  ShieldAlert,
  Warehouse,
} from "lucide-react";

const CityLeafletMap = dynamic(
  () => import("@/components/map/CityLeafletMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[440px] sm:h-[540px] w-full rounded-3xl bg-slate-200 animate-pulse flex items-center justify-center text-sm text-slate-600">
        Загрузка карты Жезказгана (OpenStreetMap)...
      </div>
    ),
  }
);

const TYPE_LABELS: Record<CityPointType, string> = {
  warehouse: "Склад ReBuild",
  reception: "Пункт приёма",
  pickup: "Место выдачи",
  seller: "Продавец",
};

export default function CityMapPage() {
  const { cityPoints, materials } = useStore();
  const [typeFilter, setTypeFilter] = useState<CityPointType | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<MaterialCategory | "all">("all");
  const [selectedPoint, setSelectedPoint] = useState<CityPoint>(cityPoints[0]);

  const filteredPoints = useMemo(() => {
    return cityPoints.filter((pt) => {
      if (typeFilter !== "all" && pt.type !== typeFilter) return false;
      if (
        categoryFilter !== "all" &&
        !pt.acceptedCategories.includes(categoryFilter)
      ) {
        return false;
      }
      return true;
    });
  }, [cityPoints, typeFilter, categoryFilter]);

  const pointMaterials = useMemo(() => {
    if (!selectedPoint) return [];
    if (selectedPoint.type === "warehouse") {
      return materials.slice(0, 4);
    }
    return materials
      .filter((m) => selectedPoint.acceptedCategories.includes(m.category))
      .slice(0, 3);
  }, [selectedPoint, materials]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 w-full space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <Badge variant="lime">Leaflet + OpenStreetMap</Badge>
            <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-300">
              Тестовые объекты (не действующие пункты)
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#181A1F]">
            Карта города Жезказган
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Склад ReBuild, демонстрационные пункты приёма, выдачи и локации продавцов.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setTypeFilter("all")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${
              typeFilter === "all"
                ? "bg-[#0D2B22] text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Все точки ({cityPoints.length})
          </button>
          {(Object.keys(TYPE_LABELS) as CityPointType[]).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${
                typeFilter === t
                  ? "bg-[#0D2B22] text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        <div className="ml-auto w-full sm:w-64">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as MaterialCategory | "all")}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium bg-white focus:border-[#0D2B22] focus:outline-none"
          >
            <option value="all">Все категории материалов</option>
            {(Object.keys(CATEGORY_LABELS) as MaterialCategory[]).map((k) => (
              <option key={k} value={k}>
                {CATEGORY_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Map + Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8">
          <CityLeafletMap
            points={filteredPoints}
            selectedPointId={selectedPoint?.id || null}
            onSelectPoint={(pt) => setSelectedPoint(pt)}
          />
        </div>

        <div className="lg:col-span-4 rounded-3xl bg-white border border-slate-200 shadow-xs overflow-hidden">
          {selectedPoint && (
            <>
              <div className="bg-[#0D2B22] text-white p-5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="lime">{TYPE_LABELS[selectedPoint.type]}</Badge>
                  <span className="text-[11px] text-amber-300 inline-flex items-center gap-1">
                    <ShieldAlert className="h-3.5 w-3.5" /> Тестовая точка
                  </span>
                </div>
                <h2 className="text-lg font-extrabold leading-snug">
                  {selectedPoint.name}
                </h2>
              </div>

              <div className="p-5 space-y-4">
                <p className="text-sm text-slate-600">{selectedPoint.description}</p>

                <div className="space-y-2 text-xs text-slate-700 bg-[#F7F8F7] rounded-2xl p-3.5 border border-slate-200/80">
                  <p className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-[#0D2B22] shrink-0" />
                    <span>{selectedPoint.address}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#0D2B22] shrink-0" />
                    <span>{selectedPoint.workingHours}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[#0D2B22] shrink-0" />
                    <span>{selectedPoint.phone}</span>
                  </p>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Доступные материалы по направлению
                  </h3>
                  <div className="space-y-2">
                    {pointMaterials.map((m) => (
                      <Link
                        key={m.id}
                        href={`/catalog/${m.id}`}
                        className="flex items-center justify-between rounded-xl border border-slate-200 p-2.5 hover:border-[#0D2B22] transition-colors"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-bold text-[#181A1F] truncate">
                            {m.title}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {m.availableQuantity} {m.unit}
                          </p>
                        </div>
                        <span className="text-xs font-extrabold text-[#0D2B22] shrink-0">
                          {formatKzt(m.priceKzt)}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>

                {selectedPoint.type === "warehouse" && (
                  <Link href="/warehouse" className="block">
                    <Button variant="lime" className="w-full">
                      <Warehouse className="h-4 w-4" />
                      Открыть 2D-план склада
                    </Button>
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

