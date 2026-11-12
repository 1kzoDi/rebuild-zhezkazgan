"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { CATEGORY_LABELS } from "@/types/rebuild";
import { formatKzt, formatDateRu } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { BookingModal } from "@/components/catalog/BookingModal";
import {
  ArrowLeft,
  CheckCircle2,
  Heart,
  MapPin,
  MessageSquare,
  Phone,
  Ruler,
  Scale,
  UserCheck,
  Warehouse,
  X,
} from "lucide-react";

export default function MaterialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { materials, favorites, toggleFavorite, notify } = useStore();
  const material = materials.find((m) => m.id === id);

  const [activeImg, setActiveImg] = useState(0);
  const [showBooking, setShowBooking] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [contactMsg, setContactMsg] = useState("");

  if (!material) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold">Материал не найден</h1>
        <Link href="/catalog">
          <Button variant="primary">Вернуться в каталог</Button>
        </Link>
      </div>
    );
  }

  const isFav = favorites.includes(material.id);

  const handleSendContact = (e: React.FormEvent) => {
    e.preventDefault();
    notify(
      "Сообщение отправлено продавцу (демо)",
      `${material.sellerName} получит ваш запрос по «${material.title}»`,
      "success"
    );
    setContactMsg("");
    setShowContact(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 w-full space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/catalog"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-[#0D2B22]"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад в каталог
        </Link>
        <span className="text-xs text-slate-400">
          Добавлено: {formatDateRu(material.createdAt)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Gallery */}
        <div className="lg:col-span-6 space-y-3">
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-xs">
            <img
              src={material.images[activeImg] || `/images/categories/${material.category}.svg`}
              alt={material.title}
              className="h-full w-full object-cover"
            />
            <button
              onClick={() => toggleFavorite(material.id)}
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/95 shadow-md flex items-center justify-center text-slate-700 hover:text-red-500 cursor-pointer"
              aria-label="Избранное"
            >
              <Heart className={isFav ? "h-5 w-5 fill-red-500 text-red-500" : "h-5 w-5"} />
            </button>
          </div>
          {material.images.length > 1 && (
            <div className="flex gap-2">
              {material.images.map((img, idx) => (
                <button
                  key={img + idx}
                  onClick={() => setActiveImg(idx)}
                  className={`h-16 w-20 rounded-xl overflow-hidden border-2 cursor-pointer ${
                    activeImg === idx ? "border-[#0D2B22]" : "border-slate-200"
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info & Actions */}
        <div className="lg:col-span-6 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="lime">{CATEGORY_LABELS[material.category]}</Badge>
            <Badge variant={material.availableQuantity > 0 ? "green" : "red"}>
              {material.availableQuantity > 0 ? "Доступен" : "В резерве"}
            </Badge>
            {material.isDemo && <Badge variant="outline">Тестовые данные</Badge>}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#181A1F]">
            {material.title}
          </h1>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#0D2B22]">
              {formatKzt(material.priceKzt)}
            </span>
            {material.priceKzt > 0 && (
              <span className="text-sm text-slate-500">/ {material.unit}</span>
            )}
          </div>

          <p className="text-sm text-slate-700 leading-relaxed">
            {material.description}
          </p>

          {/* Specs Box */}
          <div className="rounded-2xl bg-white border border-slate-200 p-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-slate-500 block">Доступный остаток</span>
              <span className="font-bold text-[#0D2B22]">
                {material.availableQuantity} {material.unit}
              </span>
              {material.reservedQuantity > 0 && (
                <span className="block text-xs text-blue-600">
                  В резерве: {material.reservedQuantity} {material.unit}
                </span>
              )}
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Состояние</span>
              <span className="font-semibold text-[#181A1F]">{material.condition}</span>
            </div>
            {material.dimensions && (
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4 text-slate-400" />
                <div>
                  <span className="text-xs text-slate-500 block">Размеры</span>
                  <span className="font-medium">{material.dimensions}</span>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-slate-400" />
              <div>
                <span className="text-xs text-slate-500 block">Масса 1 ед.</span>
                <span className="font-medium">{material.weightPerUnitKg} кг</span>
              </div>
            </div>
          </div>

          {/* Warehouse Location & Show on Map */}
          <div className="rounded-2xl bg-[#0D2B22]/5 border border-[#0D2B22]/15 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <MapPin className="h-5 w-5 text-[#0D2B22] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-500">Местоположение</p>
                <p className="text-sm font-bold text-[#181A1F]">{material.location}</p>
              </div>
            </div>
            {material.cellId && (
              <Link
                href={`/warehouse?cell=${material.cellId}&highlight=${material.cellId}`}
                className="shrink-0"
              >
                <Button variant="lime" size="sm">
                  <Warehouse className="h-4 w-4" />
                  Показать на складе ({material.cellId})
                </Button>
              </Link>
            )}
          </div>

          {/* Seller Info */}
          <div className="rounded-2xl bg-white border border-slate-200 p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-[#0D2B22] text-[#A3E635] flex items-center justify-center font-bold">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-[#181A1F]">{material.sellerName}</p>
                <p className="text-xs text-slate-500">
                  {material.sellerType} • {material.sellerPhone}
                </p>
              </div>
            </div>
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              disabled={material.availableQuantity === 0}
              onClick={() => setShowBooking(true)}
            >
              Забронировать
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => setShowContact(true)}
            >
              <MessageSquare className="h-4 w-4" />
              Связаться с продавцом
            </Button>
          </div>
        </div>
      </div>

      {showBooking && (
        <BookingModal material={material} onClose={() => setShowBooking(false)} />
      )}

      {/* Contact Seller Modal */}
      {showContact && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 bg-[#181A1F] text-white">
              <h3 className="font-bold text-base">Связь с продавцом</h3>
              <button
                onClick={() => setShowContact(false)}
                className="rounded-lg p-1 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSendContact} className="p-5 space-y-4">
              <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 space-y-1">
                <p className="text-sm font-bold text-[#181A1F]">{material.sellerName}</p>
                <p className="text-xs text-slate-600 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-[#0D2B22]" />
                  {material.sellerPhone} (демо-контакт)
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Ваш вопрос по материалу
                </label>
                <textarea
                  required
                  rows={3}
                  value={contactMsg}
                  onChange={(e) => setContactMsg(e.target.value)}
                  placeholder="Здравствуйте! Подскажите, можно ли осмотреть партию на складе?"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-[#0D2B22] focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowContact(false)}>
                  Закрыть
                </Button>
                <Button type="submit" variant="lime" className="flex-1">
                  Отправить запрос
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

