"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Material } from "@/types/rebuild";
import { formatKzt } from "@/lib/utils";
import { useStore } from "@/context/StoreContext";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, Warehouse, X } from "lucide-react";

interface BookingModalProps {
  material: Material | null;
  onClose: () => void;
}

export function BookingModal({ material, onClose }: BookingModalProps) {
  const { createReservation } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);

  if (!material) return null;

  const maxQty = material.availableQuantity;
  const safeQty = Math.min(Math.max(1, quantity), Math.max(1, maxQty));
  const total = material.priceKzt * safeQty;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = createReservation(material.id, safeQty, comment);
    if (!res.ok) {
      setError(res.error || "Ошибка бронирования");
      return;
    }
    setDoneId(res.reservation?.id || "OK");
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-[#0D2B22] text-white">
          <div>
            <h3 className="font-bold text-base">Бронирование материала</h3>
            <p className="text-xs text-slate-300">Без онлайн-оплаты • Самовывоз со склада</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {doneId ? (
          <div className="p-6 text-center space-y-4">
            <div className="mx-auto h-14 w-14 rounded-full bg-[#A3E635]/25 flex items-center justify-center text-[#0D2B22]">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-[#181A1F]">
                Бронь #{doneId} создана!
              </h4>
              <p className="mt-1 text-sm text-slate-600">
                Доступный остаток уменьшен, а ячейка{" "}
                <span className="font-semibold text-[#0D2B22]">
                  {material.cellId || "склада"}
                </span>{" "}
                отмечена как зарезервированная на карте.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              {material.cellId && (
                <Link
                  href={`/warehouse?cell=${material.cellId}&highlight=${material.cellId}`}
                  onClick={onClose}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#A3E635] px-4 py-2.5 text-sm font-bold text-[#0D2B22] hover:bg-[#84CC16]"
                >
                  <Warehouse className="h-4 w-4" />
                  Показать на складе
                </Link>
              )}
              <Link
                href="/dashboard"
                onClick={onClose}
                className="flex-1 inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-[#181A1F] hover:bg-slate-50"
              >
                Мои заказы
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 border border-slate-200/80">
              <img
                src={material.images[0] || `/images/categories/${material.category}.svg`}
                alt={material.title}
                className="h-14 w-14 rounded-lg object-cover bg-white border border-slate-200"
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-[#181A1F] truncate">
                  {material.title}
                </p>
                <p className="text-xs text-slate-500">
                  Доступно: {material.availableQuantity} {material.unit} •{" "}
                  {formatKzt(material.priceKzt)}/{material.unit}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Количество ({material.unit})
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={maxQty}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-semibold focus:border-[#0D2B22] focus:outline-none"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(maxQty)}
                >
                  Всё ({maxQty})
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Комментарий для кладовщика / продавца (необязательно)
              </label>
              <textarea
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Например: заберу завтра после 15:00 на грузовом авто"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-[#0D2B22] focus:outline-none"
              />
            </div>

            <div className="rounded-xl bg-[#0D2B22]/5 p-3.5 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">
                Предварительная сумма (оплата при получении):
              </span>
              <span className="text-lg font-extrabold text-[#0D2B22]">
                {formatKzt(total)}
              </span>
            </div>

            {error && (
              <p className="text-xs font-medium text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Отмена
              </Button>
              <Button type="submit" variant="lime" className="flex-1">
                Подтвердить бронь
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

