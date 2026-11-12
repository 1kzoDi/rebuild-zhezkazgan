"use client";

import React from "react";
import Link from "next/link";
import { Material, CATEGORY_LABELS } from "@/types/rebuild";
import { formatKzt } from "@/lib/utils";
import { useStore } from "@/context/StoreContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Heart, MapPin, Warehouse, ArrowUpRight } from "lucide-react";

interface MaterialCardProps {
  material: Material;
  onReserve?: (material: Material) => void;
}

export function MaterialCard({ material, onReserve }: MaterialCardProps) {
  const { favorites, toggleFavorite } = useStore();
  const isFav = favorites.includes(material.id);

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs hover:shadow-md hover:border-[#0D2B22]/30 transition-all duration-200">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <Link href={`/catalog/${material.id}`} className="block h-full w-full">
          <img
            src={material.images[0] || `/images/categories/${material.category}.svg`}
            alt={material.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <Badge variant="lime" className="bg-[#0D2B22]/90 text-[#A3E635] border-0 backdrop-blur-xs">
            {CATEGORY_LABELS[material.category]}
          </Badge>
          {material.cellId && (
            <Link
              href={`/warehouse?cell=${material.cellId}&highlight=${material.cellId}`}
              className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-0.5 text-xs font-bold text-[#0D2B22] shadow-xs hover:bg-[#A3E635] transition-colors"
              title="Показать ячейку на карте склада"
            >
              <Warehouse className="h-3 w-3" />
              {material.cellId}
            </Link>
          )}
        </div>

        {/* Favorite button */}
        <button
          onClick={() => toggleFavorite(material.id)}
          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-slate-600 hover:text-red-500 shadow-xs transition-colors cursor-pointer"
          aria-label="Добавить в избранное"
        >
          <Heart className={isFav ? "h-4 w-4 fill-red-500 text-red-500" : "h-4 w-4"} />
        </button>

        {/* Availability overlay */}
        {material.availableQuantity === 0 && (
          <div className="absolute inset-0 bg-slate-900/55 flex items-center justify-center">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-900">
              Весь объём в резерве
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/catalog/${material.id}`}
            className="font-bold text-[#181A1F] hover:text-[#0D2B22] line-clamp-2 leading-snug"
          >
            {material.title}
          </Link>
        </div>

        <p className="mt-1.5 text-xs text-slate-500 line-clamp-1">{material.condition}</p>

        <div className="mt-3 flex items-baseline justify-between gap-2">
          <div>
            <span className="text-xl font-extrabold text-[#0D2B22]">
              {formatKzt(material.priceKzt)}
            </span>
            {material.priceKzt > 0 && (
              <span className="text-xs text-slate-500 ml-1">/ {material.unit}</span>
            )}
          </div>
          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
            Доступно: {material.availableQuantity} {material.unit}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{material.location}</span>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            disabled={material.availableQuantity === 0}
            onClick={() => onReserve?.(material)}
          >
            Забронировать
          </Button>
          <Link
            href={`/catalog/${material.id}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-[#0D2B22] transition-colors"
            title="Подробнее"
          >
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

