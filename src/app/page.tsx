"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useStore } from "@/context/StoreContext";
import { CATEGORY_LABELS, Material, MaterialCategory } from "@/types/rebuild";
import { MaterialCard } from "@/components/catalog/MaterialCard";
import { BookingModal } from "@/components/catalog/BookingModal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatNumberRu } from "@/lib/utils";
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  Hammer,
  Layers,
  Leaf,
  MapPin,
  PackagePlus,
  Recycle,
  Search,
  ShieldCheck,
  TrendingDown,
  Truck,
  Warehouse,
} from "lucide-react";

const CATEGORIES: { id: MaterialCategory; desc: string }[] = [
  { id: "bricks", desc: "Красный, силикатный, газоблок" },
  { id: "wood", desc: "Доски, брус, OSB, поддоны" },
  { id: "tiles", desc: "Керамогранит, кафель, брусчатка" },
  { id: "doors", desc: "Окна ПВХ, межкомнатные и входные" },
  { id: "metal", desc: "Трубы, арматура, профлист" },
  { id: "plumbing", desc: "Раковины, трубы ПП, фитинги" },
  { id: "finishing", desc: "Штукатурка, ГКЛ, смеси" },
  { id: "other", desc: "Утеплитель, электрика, крепёж" },
];

export default function HomePage() {
  const { materials, cells, reservations } = useStore();
  const [bookingTarget, setBookingTarget] = useState<Material | null>(null);

  const popularMaterials = materials.slice(0, 4);
  const occupiedCells = cells.filter((c) => c.status !== "free").length;
  const totalWeightKg = materials.reduce(
    (sum, m) => sum + m.totalQuantity * m.weightPerUnitKg,
    0
  );
  const completedDeals = reservations.filter((r) => r.status === "completed").length;

  return (
    <div className="flex flex-col">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-[#0D2B22] text-white">
        {/* Subtle architectural grid background */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(to right, #A3E635 1px, transparent 1px), linear-gradient(to bottom, #A3E635 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3.5 py-1.5 text-xs font-medium text-[#A3E635]">
              <MapPin className="h-3.5 w-3.5" />
              Пилотный город: Жезказган, Казахстан • Демонстрационный MVP
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08]">
              ReBuild — стройматериалам{" "}
              <span className="text-[#A3E635]">вторую жизнь</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-200 max-w-2xl leading-relaxed">
              Покупайте дешевле. Продавайте остатки. Сокращайте отходы.
              <span className="block mt-2 text-sm sm:text-base text-slate-300">
                «То, что для одного человека отходы после ремонта, для другого — полезный ресурс».
              </span>
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/catalog">
                <Button variant="lime" size="lg">
                  <Search className="h-4 w-4" />
                  Найти материалы
                </Button>
              </Link>
              <Link href="/dashboard?tab=seller">
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-white/10 border-white/25 text-white hover:bg-white/20 hover:text-white"
                >
                  <PackagePlus className="h-4 w-4" />
                  Разместить материал
                </Button>
              </Link>
              <Link href="/warehouse">
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-transparent border-[#A3E635]/50 text-[#A3E635] hover:bg-[#A3E635]/15 hover:text-[#A3E635]"
                >
                  <Warehouse className="h-4 w-4" />
                  Посмотреть склад
                </Button>
              </Link>
            </div>

            <div className="pt-4 grid grid-cols-3 gap-4 border-t border-white/15 max-w-xl">
              <div>
                <p className="text-2xl font-extrabold text-[#A3E635]">
                  {materials.length}
                </p>
                <p className="text-xs text-slate-300">позиций в демо-каталоге</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-white">
                  {occupiedCells}/{cells.length}
                </p>
                <p className="text-xs text-slate-300">занятых ячеек склада</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-white">6 зон</p>
                <p className="text-xs text-slate-300">цифровой двойник 2D</p>
              </div>
            </div>
          </motion.div>

          {/* Visual Element */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-[#181A1F]">
              <img
                src="/images/hero-warehouse.jpg"
                alt="Склад строительных материалов ReBuild"
                className="w-full aspect-[4/3] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D2B22]/90 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-[#181A1F]/90 backdrop-blur-md border border-white/15 p-4 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#A3E635]">
                    Пример из склада • Ячейка A-04
                  </span>
                  <p className="text-sm font-bold text-white mt-0.5">
                    Кирпич красный — 240 шт.
                  </p>
                  <p className="text-xs text-slate-300">45 ₸/шт. • Зона A, стеллаж 1</p>
                </div>
                <Link
                  href="/warehouse?cell=A-04&highlight=A-04"
                  className="shrink-0 rounded-xl bg-[#A3E635] px-3 py-2 text-xs font-bold text-[#0D2B22] hover:bg-[#84CC16] transition-colors"
                >
                  На карте →
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-4 py-16 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <Badge variant="lime" className="mb-2">Процесс</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#181A1F]">
              Как работает ReBuild
            </h2>
          </div>
          <p className="text-sm text-slate-600 max-w-md">
            Простой цикл от остатка на стройплощадке до повторного применения в новом проекте.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              step: "01",
              title: "Размещение остатков",
              desc: "Частные лица и стройкомпании публикуют лишние или демонтированные материалы за 2 минуты.",
              icon: PackagePlus,
            },
            {
              step: "02",
              title: "Учёт на складе ReBuild",
              desc: "Материалы принимаются в Жезказгане, проверяются и получают адресную ячейку (например, A-04).",
              icon: Warehouse,
            },
            {
              step: "03",
              title: "Поиск и бронь онлайн",
              desc: "Покупатель находит позицию в каталоге или на 2D-карте склада и бронирует нужное количество.",
              icon: Search,
            },
            {
              step: "04",
              title: "Выдача и вторая жизнь",
              desc: "Кладовщик подтверждает выдачу, остаток обновляется, а материалы не попадают на свалку.",
              icon: Recycle,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="rounded-2xl bg-white border border-slate-200/90 p-6 shadow-xs hover:border-[#0D2B22]/40 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="h-11 w-11 rounded-xl bg-[#0D2B22] text-[#A3E635] flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-sm font-bold text-slate-400">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-bold text-base text-[#181A1F] mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="bg-white border-y border-slate-200/80 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <Badge variant="green" className="mb-2">8 направлений</Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#181A1F]">
                Категории стройматериалов
              </h2>
            </div>
            <Link
              href="/catalog"
              className="text-sm font-semibold text-[#0D2B22] hover:underline inline-flex items-center gap-1"
            >
              Весь каталог <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => {
              const count = materials.filter((m) => m.category === cat.id).length;
              return (
                <Link
                  key={cat.id}
                  href={`/catalog?category=${cat.id}`}
                  className="group rounded-2xl border border-slate-200 bg-[#F7F8F7] p-4 hover:bg-[#0D2B22] hover:text-white hover:border-[#0D2B22] transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 p-1.5 overflow-hidden">
                      <img
                        src={`/images/categories/${cat.id}.svg`}
                        alt={CATEGORY_LABELS[cat.id]}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <span className="text-xs font-bold rounded-full bg-white px-2.5 py-0.5 text-[#0D2B22]">
                      {count} поз.
                    </span>
                  </div>
                  <h3 className="font-bold text-sm sm:text-base">
                    {CATEGORY_LABELS[cat.id]}
                  </h3>
                  <p className="text-xs text-slate-500 group-hover:text-slate-300 mt-1">
                    {cat.desc}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* POPULAR OFFERS */}
      <section className="mx-auto max-w-7xl px-4 py-16 w-full">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <Badge variant="lime" className="mb-2">Демо-каталог</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#181A1F]">
              Популярные предложения
            </h2>
          </div>
          <Link
            href="/catalog"
            className="text-sm font-semibold text-[#0D2B22] hover:underline inline-flex items-center gap-1"
          >
            Смотреть все ({materials.length}) <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {popularMaterials.map((mat) => (
            <MaterialCard
              key={mat.id}
              material={mat}
              onReserve={(m) => setBookingTarget(m)}
            />
          ))}
        </div>
      </section>

      {/* WHY REUSE + WAREHOUSE DIGITAL TWIN */}
      <section className="bg-[#181A1F] text-white py-16">
        <div className="mx-auto max-w-7xl px-4 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <Badge className="bg-[#A3E635]/20 text-[#A3E635] border-[#A3E635]/30">
              Ценность для города и бизнеса
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold">
              Почему повторное использование выгодно
            </h2>
            <div className="space-y-4">
              {[
                {
                  icon: TrendingDown,
                  title: "Экономия до 40–70% бюджета",
                  desc: "Покупатели получают качественные остатки новых или б/у материалов значительно ниже рыночной цены.",
                },
                {
                  icon: Truck,
                  title: "Снижение затрат на вывоз мусора",
                  desc: "Стройкомпании и бригады не платят за полигон, а возвращают часть средств или отдают остатки бесплатно.",
                },
                {
                  icon: ShieldCheck,
                  title: "Прозрачный учёт и адресное хранение",
                  desc: "Каждая партия привязана к конкретной ячейке склада ReBuild, что исключает хаос и потери.",
                },
              ].map((b) => {
                const Icon = b.icon;
                return (
                  <div key={b.title} className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-[#0D2B22] text-[#A3E635] flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base">{b.title}</h3>
                      <p className="text-sm text-slate-400 mt-0.5">{b.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Warehouse Preview Card */}
          <div className="rounded-3xl bg-[#0D2B22] border border-white/15 p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#A3E635]">
                  Главная особенность
                </span>
                <h3 className="text-xl font-extrabold mt-1">
                  Система складского хранения 2D
                </h3>
              </div>
              <Layers className="h-8 w-8 text-[#A3E635]" />
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Склад разделён на 6 специализированных зон (A–F) с 36 ячейками. Цветовая индикация
              показывает статус в реальном времени, а поиск подсвечивает нужный стеллаж.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              {[
                { z: "Зона A", t: "Кирпичи и блоки", c: "bg-emerald-500/20 text-emerald-200" },
                { z: "Зона B", t: "Древесина", c: "bg-amber-500/20 text-amber-200" },
                { z: "Зона C", t: "Плитка", c: "bg-cyan-500/20 text-cyan-200" },
                { z: "Зона D", t: "Двери и окна", c: "bg-blue-500/20 text-blue-200" },
                { z: "Зона E", t: "Металл", c: "bg-slate-500/30 text-slate-200" },
                { z: "Зона F", t: "Прочие", c: "bg-lime-500/20 text-lime-200" },
              ].map((item) => (
                <div
                  key={item.z}
                  className={`rounded-xl px-3 py-2.5 border border-white/10 ${item.c}`}
                >
                  <p className="font-bold">{item.z}</p>
                  <p className="opacity-85 text-[11px]">{item.t}</p>
                </div>
              ))}
            </div>
            <Link href="/warehouse" className="block pt-1">
              <Button variant="lime" size="lg" className="w-full">
                <Warehouse className="h-4 w-4" />
                Перейти к интерактивной карте склада
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ECOLOGICAL IMPACT PREVIEW */}
      <section className="mx-auto max-w-7xl px-4 py-16 w-full">
        <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-10 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0D2B22]">
                <Leaf className="h-4 w-4 text-[#84CC16]" />
                ReBuild Impact • Пример расчёта по демо-данным
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#181A1F]">
                Измеримый экологический эффект
              </h2>
              <p className="text-sm text-slate-600">
                Показатели вычисляются напрямую из базы материалов и завершённых бронирований
                в системе (без неподтверждённых оценок CO₂).
              </p>
            </div>
            <Link href="/impact">
              <Button variant="primary" size="md">
                Открыть аналитику Impact
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-[#F7F8F7] p-5 border border-slate-200/70">
              <p className="text-xs font-semibold text-slate-500">
                Объём материалов в системе (пример)
              </p>
              <p className="mt-1 text-3xl font-extrabold text-[#0D2B22]">
                {materials.length} партий
              </p>
            </div>
            <div className="rounded-2xl bg-[#F7F8F7] p-5 border border-slate-200/70">
              <p className="text-xs font-semibold text-slate-500">
                Масса учтённых материалов (пример)
              </p>
              <p className="mt-1 text-3xl font-extrabold text-[#0D2B22]">
                {formatNumberRu(totalWeightKg)} кг
              </p>
            </div>
            <div className="rounded-2xl bg-[#F7F8F7] p-5 border border-slate-200/70">
              <p className="text-xs font-semibold text-slate-500">
                Завершённых сделок (демо)
              </p>
              <p className="mt-1 text-3xl font-extrabold text-[#0D2B22]">
                {completedDeals}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACTS & STARTUP INFO */}
      <section className="mx-auto max-w-7xl px-4 pb-16 w-full">
        <div className="rounded-3xl bg-[#0D2B22] text-white p-8 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h2 className="text-2xl font-extrabold">
              Запускаем пилот в Жезказгане
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Открыты к партнёрству со строительными компаниями, застройщиками и пунктами приёма.
              Хотите протестировать сценарий для жюри или подключить свой склад?
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-xs text-[#A3E635]">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Жезказган, Улытауская обл.
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Boxes className="h-4 w-4" /> Валюта: KZT (₸)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Hammer className="h-4 w-4" /> Версия MVP для Pizza Pitch
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/map">
              <Button variant="lime" size="lg">
                Карта города
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                variant="outline"
                size="lg"
                className="bg-white/10 border-white/25 text-white hover:bg-white/20 hover:text-white"
              >
                Личный кабинет
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <BookingModal
        material={bookingTarget}
        onClose={() => setBookingTarget(null)}
      />
    </div>
  );
}
