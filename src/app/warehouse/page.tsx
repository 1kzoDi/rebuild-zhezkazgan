"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import {
  CATEGORY_LABELS,
  CELL_STATUS_LABELS,
  CellStatus,
  Material,
  MaterialCategory,
  WarehouseCell,
  ZoneId,
} from "@/types/rebuild";
import { formatKzt } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { BookingModal } from "@/components/catalog/BookingModal";
import {
  ArrowUpRight,
  Info,
  Layers,
  Maximize2,
  Minus,
  Plus,
  RotateCcw,
  Search,
  Warehouse,
  X,
} from "lucide-react";

const STATUS_COLORS: Record<
  CellStatus,
  { fill: string; stroke: string; text: string; dot: string }
> = {
  free: {
    fill: "#DCFCE7",
    stroke: "#16A34A",
    text: "#14532D",
    dot: "bg-emerald-500",
  },
  partial: {
    fill: "#FEF3C7",
    stroke: "#D97706",
    text: "#78350F",
    dot: "bg-amber-500",
  },
  full: {
    fill: "#FEE2E2",
    stroke: "#DC2626",
    text: "#7F1D1D",
    dot: "bg-red-500",
  },
  reserved: {
    fill: "#DBEAFE",
    stroke: "#2563EB",
    text: "#1E3A8A",
    dot: "bg-blue-500",
  },
};

// Layout coordinates for 6 zones in a 1080x640 warehouse blueprint
const ZONE_LAYOUT: Record<
  ZoneId,
  { x: number; y: number; w: number; h: number; shortLabel: string }
> = {
  A: { x: 40, y: 70, w: 310, h: 230, shortLabel: "Зона A • Кирпичи и блоки" },
  B: { x: 385, y: 70, w: 310, h: 230, shortLabel: "Зона B • Древесина" },
  C: { x: 730, y: 70, w: 310, h: 230, shortLabel: "Зона C • Плитка" },
  D: { x: 40, y: 360, w: 310, h: 230, shortLabel: "Зона D • Двери и окна" },
  E: { x: 385, y: 360, w: 310, h: 230, shortLabel: "Зона E • Металл" },
  F: { x: 730, y: 360, w: 310, h: 230, shortLabel: "Зона F • Прочие" },
};

function WarehouseContent() {
  const searchParams = useSearchParams();
  const paramCell = searchParams.get("cell");
  const paramHighlight = searchParams.get("highlight");

  const { zones, cells, materials } = useStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [zoneFilter, setZoneFilter] = useState<ZoneId | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<MaterialCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<CellStatus | "all">("all");

  const [selectedCellId, setSelectedCellId] = useState<string | null>(paramCell || "A-04");
  const [hoveredCellId, setHoveredCellId] = useState<string | null>(null);
  const [bookingTarget, setBookingTarget] = useState<Material | null>(null);

  // Pan & Zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (paramCell) {
      setSelectedCellId(paramCell);
    }
  }, [paramCell]);

  const materialById = useMemo(() => {
    const map = new Map<string, Material>();
    materials.forEach((m) => map.set(m.id, m));
    return map;
  }, [materials]);

  // Cells matching search & filters
  const { matchingCellIds, visibleCellIds } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matching = new Set<string>();
    const visible = new Set<string>();

    cells.forEach((cell) => {
      const mat = cell.materialId ? materialById.get(cell.materialId) : undefined;

      if (zoneFilter !== "all" && cell.zoneId !== zoneFilter) return;
      if (statusFilter !== "all" && cell.status !== statusFilter) return;
      if (categoryFilter !== "all" && (!mat || mat.category !== categoryFilter)) return;

      visible.add(cell.id);

      if (q) {
        const hay = `${cell.id} ${mat?.title ?? ""} ${mat?.description ?? ""}`.toLowerCase();
        if (hay.includes(q)) {
          matching.add(cell.id);
        }
      }
    });

    if (!q && paramHighlight) {
      matching.add(paramHighlight);
    }

    return { matchingCellIds: matching, visibleCellIds: visible };
  }, [cells, materialById, searchQuery, zoneFilter, statusFilter, categoryFilter, paramHighlight]);

  // Auto-select first search result when typing
  useEffect(() => {
    if (searchQuery.trim() && matchingCellIds.size > 0) {
      const first = Array.from(matchingCellIds)[0];
      setSelectedCellId(first);
    }
  }, [searchQuery, matchingCellIds]);

  const selectedCell = cells.find((c) => c.id === selectedCellId) || null;
  const selectedMaterial =
    selectedCell?.materialId ? materialById.get(selectedCell.materialId) || null : null;

  const hoveredCell = cells.find((c) => c.id === hoveredCellId) || null;
  const hoveredMaterial =
    hoveredCell?.materialId ? materialById.get(hoveredCell.materialId) || null : null;

  // Stats
  const totalCells = cells.length;
  const occupiedCount = cells.filter((c) => c.status !== "free").length;
  const reservedCount = cells.filter((c) => c.status === "reserved").length;
  const occupancyPct = Math.round((occupiedCount / Math.max(1, totalCells)) * 100);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.12 : -0.12;
    setZoom((z) => Math.min(2.2, Math.max(0.7, Number((z + delta).toFixed(2)))));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-cell-interactive]")) return;
    setIsPanning(true);
    panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - panStartRef.current.x,
      y: e.clientY - panStartRef.current.y,
    });
  };

  const handlePointerUp = () => setIsPanning(false);

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 w-full space-y-5">
      {/* Header + Demo Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <Badge variant="lime">Цифровой двойник склада 2D</Badge>
            <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-300">
              Демо-режим: виртуальный склад (тестовые данные)
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#181A1F]">
            ReBuild Warehouse — г. Жезказган
          </h1>
        </div>

        {/* Occupancy summary */}
        <div className="rounded-2xl bg-white border border-slate-200 px-5 py-3 flex items-center gap-6 shadow-xs">
          <div>
            <span className="text-xs text-slate-500 block">Заполненность склада</span>
            <span className="text-xl font-extrabold text-[#0D2B22]">{occupancyPct}%</span>
            <span className="text-xs text-slate-500 ml-1.5">
              ({occupiedCount}/{totalCells} ячеек)
            </span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <span className="text-xs text-slate-500 block">В резерве</span>
            <span className="text-xl font-extrabold text-blue-600">{reservedCount}</span>
            <span className="text-xs text-slate-500 ml-1">ячеек</span>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-5 relative">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по складу: например «Кирпич красный» или A-04..."
            className="w-full rounded-xl border border-slate-300 pl-10 pr-9 py-2.5 text-sm focus:border-[#0D2B22] focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="md:col-span-2">
          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value as ZoneId | "all")}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm bg-white focus:border-[#0D2B22] focus:outline-none"
          >
            <option value="all">Все зоны (A–F)</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                Зона {z.id}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as MaterialCategory | "all")}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm bg-white focus:border-[#0D2B22] focus:outline-none"
          >
            <option value="all">Все типы материалов</option>
            {(Object.keys(CATEGORY_LABELS) as MaterialCategory[]).map((key) => (
              <option key={key} value={key}>
                {CATEGORY_LABELS[key]}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CellStatus | "all")}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm bg-white focus:border-[#0D2B22] focus:outline-none"
          >
            <option value="all">Все статусы</option>
            {(Object.keys(CELL_STATUS_LABELS) as CellStatus[]).map((st) => (
              <option key={st} value={st}>
                {CELL_STATUS_LABELS[st]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Split: 2D Blueprint + Cell Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* 2D SVG Warehouse Map */}
        <div className="lg:col-span-8 rounded-3xl bg-[#181A1F] border border-slate-800 overflow-hidden shadow-lg relative">
          {/* Map Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-[#0D2B22] text-white border-b border-white/10">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {(Object.keys(CELL_STATUS_LABELS) as CellStatus[]).map((st) => (
                <span key={st} className="inline-flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${STATUS_COLORS[st].dot}`} />
                  <span className="text-slate-200">{CELL_STATUS_LABELS[st]}</span>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setZoom((z) => Math.max(0.7, Number((z - 0.15).toFixed(2))))}
                className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
                title="Отдалить"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-xs font-mono w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(2.2, Number((z + 0.15).toFixed(2))))}
                className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
                title="Приблизить"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={resetView}
                className="h-8 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 flex items-center gap-1 text-xs cursor-pointer"
                title="Сбросить масштаб и позицию"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Сброс</span>
              </button>
            </div>
          </div>

          {/* Interactive SVG Canvas */}
          <div
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="relative h-[460px] sm:h-[540px] w-full overflow-hidden select-none cursor-grab active:cursor-grabbing bg-[#13161B]"
          >
            {/* Hover Floating Tooltip */}
            {hoveredCell && (
              <div className="pointer-events-none absolute top-3 left-3 z-20 rounded-xl bg-[#0D2B22]/95 text-white border border-[#A3E635]/40 px-3.5 py-2.5 shadow-xl max-w-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#A3E635]">
                    {hoveredCell.id}
                  </span>
                  <span className="text-xs text-slate-300">
                    • {CELL_STATUS_LABELS[hoveredCell.status]}
                  </span>
                </div>
                <p className="text-sm font-bold mt-0.5">
                  {hoveredMaterial ? hoveredMaterial.title : "Ячейка свободна"}
                </p>
                {hoveredMaterial && (
                  <p className="text-xs text-slate-300">
                    {hoveredMaterial.availableQuantity} {hoveredMaterial.unit} •{" "}
                    {formatKzt(hoveredMaterial.priceKzt)}/{hoveredMaterial.unit}
                  </p>
                )}
              </div>
            )}

            <svg
              viewBox="0 0 1080 640"
              className="w-full h-full"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: "center center",
                transition: isPanning ? "none" : "transform 150ms ease-out",
              }}
            >
              {/* Blueprint Grid */}
              <defs>
                <pattern
                  id="warehouse-grid"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="#242933"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="1080" height="640" fill="url(#warehouse-grid)" />

              {/* Outer Warehouse Walls */}
              <rect
                x="20"
                y="20"
                width="1040"
                height="600"
                rx="16"
                fill="#181C23"
                stroke="#334155"
                strokeWidth="3"
              />

              {/* Top Reception / Loading Gate */}
              <rect
                x="410"
                y="12"
                width="260"
                height="24"
                rx="6"
                fill="#0D2B22"
                stroke="#A3E635"
                strokeWidth="1.5"
              />
              <text
                x="540"
                y="28"
                textAnchor="middle"
                fill="#A3E635"
                fontSize="11"
                fontWeight="700"
              >
                ЗОНА ПРИЁМКИ И ВЫДАЧИ (ВОРОТА №1)
              </text>

              {/* Central Forklift Aisle */}
              <rect
                x="35"
                y="314"
                width="1010"
                height="32"
                rx="6"
                fill="#222731"
                stroke="#334155"
                strokeDasharray="8 6"
              />
              <text
                x="540"
                y="334"
                textAnchor="middle"
                fill="#94A3B8"
                fontSize="11"
                fontWeight="600"
                letterSpacing="3"
              >
                ЦЕНТРАЛЬНЫЙ ПРОЕЗД ПОГРУЗЧИКА
              </text>

              {/* Zones & Cells */}
              {zones.map((zone) => {
                const layout = ZONE_LAYOUT[zone.id];
                const zoneCells = cells.filter((c) => c.zoneId === zone.id);

                return (
                  <g key={zone.id}>
                    {/* Zone Container */}
                    <rect
                      x={layout.x}
                      y={layout.y}
                      width={layout.w}
                      height={layout.h}
                      rx="12"
                      fill="#1E242D"
                      stroke="#334155"
                      strokeWidth="1.5"
                    />
                    <rect
                      x={layout.x}
                      y={layout.y}
                      width={layout.w}
                      height="32"
                      rx="12"
                      fill="#0D2B22"
                    />
                    <text
                      x={layout.x + 14}
                      y={layout.y + 20}
                      fill="#FFFFFF"
                      fontSize="12"
                      fontWeight="700"
                    >
                      {layout.shortLabel}
                    </text>

                    {/* 6 Cells inside Zone (2 rows x 3 cols) */}
                    {zoneCells.map((cell) => {
                      const cellW = 86;
                      const cellH = 78;
                      const gapX = 12;
                      const gapY = 14;
                      const cx = layout.x + 14 + (cell.col - 1) * (cellW + gapX);
                      const cy = layout.y + 46 + (cell.row - 1) * (cellH + gapY);

                      const palette = STATUS_COLORS[cell.status];
                      const mat = cell.materialId
                        ? materialById.get(cell.materialId)
                        : undefined;
                      const isSelected = selectedCellId === cell.id;
                      const isHighlighted = matchingCellIds.has(cell.id);
                      const isDimmed = !visibleCellIds.has(cell.id);

                      return (
                        <g
                          key={cell.id}
                          data-cell-interactive="true"
                          onClick={() => setSelectedCellId(cell.id)}
                          onMouseEnter={() => setHoveredCellId(cell.id)}
                          onMouseLeave={() => setHoveredCellId(null)}
                          style={{
                            cursor: "pointer",
                            opacity: isDimmed ? 0.22 : 1,
                          }}
                        >
                          {/* Highlight glow ring for search / param match */}
                          {(isHighlighted || isSelected) && (
                            <rect
                              x={cx - 4}
                              y={cy - 4}
                              width={cellW + 8}
                              height={cellH + 8}
                              rx="11"
                              fill="none"
                              stroke="#A3E635"
                              strokeWidth={isSelected ? "3.5" : "2.5"}
                              strokeDasharray={isHighlighted && !isSelected ? "5 3" : undefined}
                            />
                          )}

                          <rect
                            x={cx}
                            y={cy}
                            width={cellW}
                            height={cellH}
                            rx="8"
                            fill={palette.fill}
                            stroke={isSelected ? "#0D2B22" : palette.stroke}
                            strokeWidth={isSelected ? "2.5" : "1.5"}
                          />

                          {/* Cell ID */}
                          <text
                            x={cx + 8}
                            y={cy + 18}
                            fill={palette.text}
                            fontSize="12"
                            fontWeight="800"
                            fontFamily="monospace"
                          >
                            {cell.id}
                          </text>

                          {/* Material short title */}
                          <text
                            x={cx + 8}
                            y={cy + 36}
                            fill={palette.text}
                            fontSize="10"
                            fontWeight="600"
                          >
                            {mat
                              ? mat.title.length > 13
                                ? `${mat.title.slice(0, 12)}…`
                                : mat.title
                              : "Свободно"}
                          </text>

                          {/* Quantity */}
                          {mat && (
                            <text
                              x={cx + 8}
                              y={cy + 52}
                              fill={palette.text}
                              fontSize="10"
                              opacity="0.85"
                            >
                              {mat.availableQuantity} {mat.unit}
                            </text>
                          )}

                          {/* Price tag */}
                          {mat && (
                            <text
                              x={cx + 8}
                              y={cy + 68}
                              fill={palette.text}
                              fontSize="9.5"
                              fontWeight="700"
                            >
                              {formatKzt(mat.priceKzt)}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </svg>

            <div className="pointer-events-none absolute bottom-3 right-3 rounded-lg bg-black/60 px-2.5 py-1 text-[11px] text-slate-300 flex items-center gap-1.5">
              <Maximize2 className="h-3 w-3 text-[#A3E635]" />
              Колёсико — масштаб • Перетаскивание — обзор
            </div>
          </div>
        </div>

        {/* Right Panel: Selected Cell Inspector */}
        <div className="lg:col-span-4 rounded-3xl bg-white border border-slate-200 shadow-xs overflow-hidden">
          <div className="bg-[#0D2B22] text-white px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Warehouse className="h-5 w-5 text-[#A3E635]" />
              <div>
                <h2 className="font-bold text-base">
                  Ячейка {selectedCell?.id || "—"}
                </h2>
                <p className="text-xs text-slate-300">
                  {selectedCell
                    ? `Зона ${selectedCell.zoneId}, стеллаж ${selectedCell.rack}`
                    : "Выберите ячейку на плане"}
                </p>
              </div>
            </div>
            {selectedCell && (
              <Badge
                variant={
                  selectedCell.status === "free"
                    ? "green"
                    : selectedCell.status === "partial"
                    ? "yellow"
                    : selectedCell.status === "full"
                    ? "red"
                    : "blue"
                }
              >
                {CELL_STATUS_LABELS[selectedCell.status]}
              </Badge>
            )}
          </div>

          {selectedCell && selectedMaterial ? (
            <div className="p-5 space-y-4">
              <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                <img
                  src={
                    selectedMaterial.images[0] ||
                    `/images/categories/${selectedMaterial.category}.svg`
                  }
                  alt={selectedMaterial.title}
                  className="h-full w-full object-cover"
                />
              </div>

              <div>
                <Badge variant="lime" className="mb-1.5">
                  {CATEGORY_LABELS[selectedMaterial.category]}
                </Badge>
                <h3 className="text-lg font-extrabold text-[#181A1F]">
                  {selectedMaterial.title}
                </h3>
              </div>

              <div className="rounded-2xl bg-[#F7F8F7] border border-slate-200/80 p-3.5 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Количество:</span>
                  <span className="font-bold text-[#0D2B22]">
                    {selectedMaterial.availableQuantity} {selectedMaterial.unit}
                  </span>
                </div>
                {selectedMaterial.reservedQuantity > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">В резерве:</span>
                    <span className="font-semibold text-blue-600">
                      {selectedMaterial.reservedQuantity} {selectedMaterial.unit}
                    </span>
                  </div>
                )}
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500 shrink-0">Состояние:</span>
                  <span className="font-medium text-right">
                    {selectedMaterial.condition}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Цена:</span>
                  <span className="font-extrabold text-[#0D2B22]">
                    {formatKzt(selectedMaterial.priceKzt)}
                    {selectedMaterial.priceKzt > 0 ? `/${selectedMaterial.unit}` : ""}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Статус:</span>
                  <span className="font-semibold text-emerald-700">
                    {selectedMaterial.availableQuantity > 0 ? "Доступен" : "Зарезервирован"}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Link href={`/catalog/${selectedMaterial.id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    Подробнее
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="lime"
                  className="flex-1"
                  disabled={selectedMaterial.availableQuantity === 0}
                  onClick={() => setBookingTarget(selectedMaterial)}
                >
                  Забронировать
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center space-y-3">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Info className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-base text-[#181A1F]">
                {selectedCell
                  ? `Ячейка ${selectedCell.id} свободна`
                  : "Выберите ячейку на карте"}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {selectedCell
                  ? `Вместимость ячейки: до ${selectedCell.capacityUnits} ед. Администратор может назначить сюда новый материал в личном кабинете.`
                  : "Нажмите на любую цветную ячейку на 2D-плане, чтобы увидеть содержимое."}
              </p>
              {selectedCell && (
                <Link href="/dashboard" className="inline-block pt-1">
                  <Button variant="outline" size="sm">
                    Перейти в панель склада
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Per-Zone Statistics */}
      <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="h-5 w-5 text-[#0D2B22]" />
          <h2 className="font-bold text-base text-[#181A1F]">
            Статистика по складским зонам (демо-данные)
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {zones.map((z) => {
            const zCells = cells.filter((c) => c.zoneId === z.id);
            const zOcc = zCells.filter((c) => c.status !== "free").length;
            const pct = Math.round((zOcc / Math.max(1, zCells.length)) * 100);
            return (
              <button
                key={z.id}
                onClick={() => setZoneFilter(zoneFilter === z.id ? "all" : z.id)}
                className={`text-left rounded-2xl border p-4 transition-all cursor-pointer ${
                  zoneFilter === z.id
                    ? "border-[#0D2B22] bg-[#0D2B22]/5"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-[#181A1F]">{z.name}</span>
                  <span className="text-xs font-bold text-[#0D2B22]">{pct}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#0D2B22]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Занято {zOcc} из {zCells.length} ячеек
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <BookingModal
        material={bookingTarget}
        onClose={() => setBookingTarget(null)}
      />
    </div>
  );
}

export default function WarehousePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Загрузка 2D-карты склада...</div>}>
      <WarehouseContent />
    </Suspense>
  );
}

