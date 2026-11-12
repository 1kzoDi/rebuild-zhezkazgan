"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import {
  CATEGORY_LABELS,
  CELL_STATUS_LABELS,
  MaterialCategory,
  MaterialCondition,
  RESERVATION_STATUS_LABELS,
  UserRole,
} from "@/types/rebuild";
import { formatDateRu, formatKzt } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  ArrowRightLeft,
  CheckCircle2,
  Heart,
  History,
  PackagePlus,
  ShieldCheck,
  Store,
  Trash2,
  User,
  Warehouse,
  XCircle,
} from "lucide-react";

function DashboardContent() {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab") as UserRole | null;

  const {
    currentRole,
    currentUser,
    setRole,
    users,
    materials,
    cells,
    reservations,
    movements,
    favorites,
    toggleFavorite,
    confirmReservation,
    completeReservation,
    cancelReservation,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    moveMaterialCell,
    adjustStock,
  } = useStore();

  // If user came via /dashboard?tab=seller, let them switch easily
  const activeRole = currentRole;

  // Seller / Admin New Material Form
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<MaterialCategory>("bricks");
  const [newCondition, setNewCondition] = useState<MaterialCondition>("Новый остаток");
  const [newPrice, setNewPrice] = useState(500);
  const [newQty, setNewQty] = useState(20);
  const [newUnit, setNewUnit] = useState("шт.");
  const [newWeight, setNewWeight] = useState(5);
  const [newCellId, setNewCellId] = useState<string>("");
  const [newDesc, setNewDesc] = useState("");
  const [newPhoto, setNewPhoto] = useState<string>("");

  // Admin move / adjust state
  const [moveMatId, setMoveMatId] = useState(materials[0]?.id || "");
  const [moveTargetCell, setMoveTargetCell] = useState("");
  const [adjustMatId, setAdjustMatId] = useState(materials[0]?.id || "");
  const [adjustQty, setAdjustQty] = useState(0);

  // Seller inline price edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editQty, setEditQty] = useState<number>(0);

  const freeCells = cells.filter((c) => c.status === "free");

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setNewPhoto(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const res = addMaterial({
      title: newTitle.trim(),
      description:
        newDesc.trim() || "Строительный материал в хорошем состоянии (г. Жезказган).",
      category: newCategory,
      condition: newCondition,
      priceKzt: Math.max(0, Number(newPrice)),
      unit: newUnit,
      totalQuantity: Math.max(1, Number(newQty)),
      weightPerUnitKg: Math.max(0.1, Number(newWeight)),
      location: newCellId
        ? `г. Жезказган, Склад ReBuild №1 (ячейка ${newCellId})`
        : "г. Жезказган, самовывоз от продавца",
      cellId: activeRole === "admin" && newCellId ? newCellId : null,
      images: newPhoto ? [newPhoto] : undefined,
    });
    if (res.ok) {
      setNewTitle("");
      setNewDesc("");
      setNewPhoto("");
      setNewCellId("");
    }
  };

  const favMaterials = materials.filter((m) => favorites.includes(m.id));
  const sellerMaterials = materials.filter((m) => m.sellerId === currentUser.id);
  const sellerOrders = reservations.filter((r) => r.sellerId === currentUser.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 w-full space-y-6">
      {/* Header & Role Switcher */}
      <div className="rounded-3xl bg-[#0D2B22] text-white p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge className="bg-[#A3E635] text-[#0D2B22] border-0 font-bold">
              Личный кабинет • Демо-доступ
            </Badge>
            {requestedTab && requestedTab !== activeRole && (
              <button
                onClick={() => setRole(requestedTab)}
                className="text-xs underline text-[#A3E635] cursor-pointer"
              >
                Переключить на роль «{requestedTab}»
              </button>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">{currentUser.name}</h1>
          <p className="text-xs text-slate-300 mt-1">
            {currentUser.city} • {currentUser.phone}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { role: "buyer" as UserRole, label: "Покупатель", icon: User },
            { role: "seller" as UserRole, label: "Продавец", icon: Store },
            { role: "admin" as UserRole, label: "Администратор склада", icon: ShieldCheck },
          ].map((r) => {
            const Icon = r.icon;
            const active = activeRole === r.role;
            return (
              <button
                key={r.role}
                onClick={() => setRole(r.role)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                  active
                    ? "bg-[#A3E635] text-[#0D2B22] font-bold shadow-md"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                <Icon className="h-4 w-4" />
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= BUYER VIEW ================= */}
      {activeRole === "buyer" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Reservations & Orders */}
          <div className="lg:col-span-7 rounded-3xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-[#181A1F]">
                Мои бронирования и заказы ({reservations.length})
              </h2>
              <Link href="/catalog" className="text-xs font-semibold text-[#0D2B22] hover:underline">
                + Найти материалы
              </Link>
            </div>

            {reservations.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">
                У вас пока нет бронирований.
              </p>
            ) : (
              <div className="space-y-3">
                {reservations.map((res) => (
                  <div
                    key={res.id}
                    className="rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500">
                          #{res.id}
                        </span>
                        <Badge
                          variant={
                            res.status === "completed"
                              ? "green"
                              : res.status === "confirmed"
                              ? "blue"
                              : res.status === "cancelled"
                              ? "red"
                              : "yellow"
                          }
                        >
                          {RESERVATION_STATUS_LABELS[res.status]}
                        </Badge>
                        {res.cellId && (
                          <Link
                            href={`/warehouse?cell=${res.cellId}&highlight=${res.cellId}`}
                            className="text-xs font-bold text-[#0D2B22] bg-[#A3E635]/30 px-2 py-0.5 rounded-md"
                          >
                            Ячейка {res.cellId}
                          </Link>
                        )}
                      </div>
                      <Link
                        href={`/catalog/${res.materialId}`}
                        className="font-bold text-sm text-[#181A1F] hover:underline block"
                      >
                        {res.materialTitle}
                      </Link>
                      <p className="text-xs text-slate-500">
                        Количество: {res.quantity} {res.unit} • Сумма:{" "}
                        <strong className="text-[#0D2B22]">{formatKzt(res.totalPriceKzt)}</strong> •{" "}
                        {formatDateRu(res.createdAt)}
                      </p>
                    </div>

                    {(res.status === "pending" || res.status === "confirmed") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cancelReservation(res.id)}
                      >
                        Отменить бронь
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Favorites */}
          <div className="lg:col-span-5 rounded-3xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500 fill-red-500" />
              <h2 className="text-lg font-extrabold text-[#181A1F]">
                Избранное ({favMaterials.length})
              </h2>
            </div>

            {favMaterials.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">
                Добавляйте материалы сердечком в каталоге.
              </p>
            ) : (
              <div className="space-y-3">
                {favMaterials.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={m.images[0] || `/images/categories/${m.category}.svg`}
                        alt={m.title}
                        className="h-12 w-12 rounded-xl object-cover bg-slate-100 shrink-0"
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/catalog/${m.id}`}
                          className="font-bold text-sm text-[#181A1F] truncate block hover:underline"
                        >
                          {m.title}
                        </Link>
                        <p className="text-xs text-slate-500">
                          {formatKzt(m.priceKzt)}/{m.unit} • Остаток: {m.availableQuantity}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleFavorite(m.id)}
                      className="text-slate-400 hover:text-red-500 cursor-pointer p-1"
                      title="Убрать"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= SELLER VIEW ================= */}
      {activeRole === "seller" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Add Listing Form */}
          <div className="lg:col-span-5 rounded-3xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <PackagePlus className="h-5 w-5 text-[#0D2B22]" />
              <h2 className="text-lg font-extrabold text-[#181A1F]">
                Разместить материал
              </h2>
            </div>

            <form onSubmit={handleCreateMaterial} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Название материала
                </label>
                <input
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Например: Профлист оцинкованный 2 м"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-[#0D2B22] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Категория
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as MaterialCategory)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white"
                  >
                    {(Object.keys(CATEGORY_LABELS) as MaterialCategory[]).map((k) => (
                      <option key={k} value={k}>
                        {CATEGORY_LABELS[k]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Состояние
                  </label>
                  <select
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value as MaterialCondition)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white"
                  >
                    <option value="Новый остаток">Новый остаток</option>
                    <option value="Б/у, отличное состояние">Б/у, отличное</option>
                    <option value="Б/у, пригоден для повторного использования">Б/у, пригоден</option>
                    <option value="Требует очистки">Требует очистки</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Цена (₸)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Кол-во
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newQty}
                    onChange={(e) => setNewQty(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Ед. изм.
                  </label>
                  <input
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Фотография (опционально)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#0D2B22] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Описание
                </label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Состояние, размеры, условия самовывоза..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>

              <Button type="submit" variant="lime" className="w-full">
                Опубликовать объявление
              </Button>
            </form>
          </div>

          {/* Seller's Own Listings & Incoming Orders */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
              <h2 className="text-lg font-extrabold text-[#181A1F]">
                Мои объявления ({sellerMaterials.length})
              </h2>
              <div className="space-y-3">
                {sellerMaterials.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-bold text-sm text-[#181A1F]">{m.title}</p>
                      {editingId === m.id ? (
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <input
                            type="number"
                            value={editPrice}
                            onChange={(e) => setEditPrice(Number(e.target.value))}
                            className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-xs"
                          />
                          <span className="text-xs">₸</span>
                          <input
                            type="number"
                            value={editQty}
                            onChange={(e) => setEditQty(Number(e.target.value))}
                            className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-xs"
                          />
                          <span className="text-xs">{m.unit}</span>
                          <Button
                            size="sm"
                            variant="lime"
                            onClick={() => {
                              updateMaterial(m.id, {
                                priceKzt: editPrice,
                                availableQuantity: editQty,
                                totalQuantity: editQty + m.reservedQuantity,
                              });
                              setEditingId(null);
                            }}
                          >
                            Сохранить
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatKzt(m.priceKzt)}/{m.unit} • Доступно: {m.availableQuantity}{" "}
                          {m.unit}
                          {m.cellId ? ` • Ячейка ${m.cellId}` : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingId(m.id);
                          setEditPrice(m.priceKzt);
                          setEditQty(m.availableQuantity);
                        }}
                      >
                        Редактировать
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMaterial(m.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xs space-y-3">
              <h2 className="text-lg font-extrabold text-[#181A1F]">
                Поступившие заказы ({sellerOrders.length})
              </h2>
              {sellerOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="rounded-2xl border border-slate-200 p-3.5 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-sm text-[#181A1F]">{ord.materialTitle}</p>
                    <p className="text-slate-500">
                      Покупатель: {ord.buyerName} • {ord.quantity} {ord.unit} •{" "}
                      {formatKzt(ord.totalPriceKzt)}
                    </p>
                  </div>
                  <Badge variant="blue">{RESERVATION_STATUS_LABELS[ord.status]}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= WAREHOUSE ADMIN VIEW ================= */}
      {activeRole === "admin" && (
        <div className="space-y-6">
          {/* 1. Reservations Queue */}
          <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-extrabold text-[#181A1F]">
                  Обработка бронирований ({reservations.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Подтверждение выдачи или отмена резерва синхронно обновляет каталог и 2D-карту склада.
                </p>
              </div>
              <Link href="/warehouse">
                <Button variant="outline" size="sm">
                  <Warehouse className="h-4 w-4" />
                  Открыть 2D-карту
                </Button>
              </Link>
            </div>

            <div className="space-y-3">
              {reservations.map((res) => (
                <div
                  key={res.id}
                  className="rounded-2xl border border-slate-200 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500">
                        #{res.id}
                      </span>
                      <Badge
                        variant={
                          res.status === "completed"
                            ? "green"
                            : res.status === "confirmed"
                            ? "blue"
                            : res.status === "cancelled"
                            ? "red"
                            : "yellow"
                        }
                      >
                        {RESERVATION_STATUS_LABELS[res.status]}
                      </Badge>
                      {res.cellId && (
                        <Link
                          href={`/warehouse?cell=${res.cellId}&highlight=${res.cellId}`}
                          className="text-xs font-bold text-[#0D2B22] bg-[#A3E635]/35 px-2 py-0.5 rounded-md"
                        >
                          Ячейка {res.cellId}
                        </Link>
                      )}
                    </div>
                    <p className="font-bold text-sm text-[#181A1F]">
                      {res.materialTitle} — {res.quantity} {res.unit} ({formatKzt(res.totalPriceKzt)})
                    </p>
                    <p className="text-xs text-slate-500">
                      Покупатель: {res.buyerName} ({res.buyerPhone})
                      {res.comment ? ` • «${res.comment}»` : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {res.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => confirmReservation(res.id)}
                      >
                        <CheckCircle2 className="h-4 w-4 text-blue-600" />
                        Подтвердить бронь
                      </Button>
                    )}
                    {(res.status === "pending" || res.status === "confirmed") && (
                      <>
                        <Button
                          variant="lime"
                          size="sm"
                          onClick={() => completeReservation(res.id)}
                        >
                          Подтвердить выдачу
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => cancelReservation(res.id)}
                        >
                          <XCircle className="h-4 w-4" />
                          Отменить резерв
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Cell Assignment, Move & Stock Adjustment */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Add material to cell */}
            <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-base text-[#181A1F] flex items-center gap-2">
                <PackagePlus className="h-4 w-4 text-[#0D2B22]" />
                Приёмка в ячейку
              </h3>
              <form onSubmit={handleCreateMaterial} className="space-y-2.5 text-xs">
                <input
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Название материала"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as MaterialCategory)}
                    className="rounded-xl border border-slate-300 px-2.5 py-2 bg-white"
                  >
                    {(Object.keys(CATEGORY_LABELS) as MaterialCategory[]).map((k) => (
                      <option key={k} value={k}>
                        {CATEGORY_LABELS[k]}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newCellId}
                    onChange={(e) => setNewCellId(e.target.value)}
                    className="rounded-xl border border-slate-300 px-2.5 py-2 bg-white"
                  >
                    <option value="">Без ячейки</option>
                    {freeCells.map((c) => (
                      <option key={c.id} value={c.id}>
                        Ячейка {c.id} (свободна)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    min={0}
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    placeholder="Цена ₸"
                    className="rounded-xl border border-slate-300 px-2.5 py-2"
                  />
                  <input
                    type="number"
                    min={1}
                    value={newQty}
                    onChange={(e) => setNewQty(Number(e.target.value))}
                    placeholder="Кол-во"
                    className="rounded-xl border border-slate-300 px-2.5 py-2"
                  />
                  <input
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    placeholder="шт."
                    className="rounded-xl border border-slate-300 px-2.5 py-2"
                  />
                </div>
                <Button type="submit" variant="primary" size="sm" className="w-full">
                  Принять на склад
                </Button>
              </form>
            </div>

            {/* Move between cells */}
            <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-base text-[#181A1F] flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-[#0D2B22]" />
                Переместить в ячейку
              </h3>
              <div className="space-y-2.5 text-xs">
                <select
                  value={moveMatId}
                  onChange={(e) => setMoveMatId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.cellId || "без ячейки"})
                    </option>
                  ))}
                </select>
                <select
                  value={moveTargetCell}
                  onChange={(e) => setMoveTargetCell(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white"
                >
                  <option value="">Выберите свободную ячейку</option>
                  {freeCells.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} (Зона {c.zoneId})
                    </option>
                  ))}
                </select>
                <Button
                  variant="lime"
                  size="sm"
                  className="w-full"
                  disabled={!moveMatId || !moveTargetCell}
                  onClick={() => moveMaterialCell(moveMatId, moveTargetCell)}
                >
                  Переместить товар
                </Button>
              </div>
            </div>

            {/* Adjust Stock */}
            <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-base text-[#181A1F]">
                Корректировка остатка
              </h3>
              <div className="space-y-2.5 text-xs">
                <select
                  value={adjustMatId}
                  onChange={(e) => {
                    setAdjustMatId(e.target.value);
                    const found = materials.find((m) => m.id === e.target.value);
                    if (found) setAdjustQty(found.availableQuantity);
                  }}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} (сейчас: {m.availableQuantity} {m.unit})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0}
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  placeholder="Новый доступный остаток"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  onClick={() => adjustStock(adjustMatId, adjustQty)}
                >
                  Обновить остаток
                </Button>
              </div>
            </div>
          </div>

          {/* 3. Free vs Occupied Cells Overview + Users */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 rounded-3xl bg-white border border-slate-200 p-6 shadow-xs space-y-3">
              <h3 className="font-bold text-base text-[#181A1F]">
                Занятые и свободные ячейки ({freeCells.length} свободно из {cells.length})
              </h3>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {cells.map((c) => (
                  <Link
                    key={c.id}
                    href={`/warehouse?cell=${c.id}&highlight=${c.id}`}
                    className={`rounded-xl border p-2 text-center text-xs font-mono font-bold transition-colors ${
                      c.status === "free"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : c.status === "partial"
                        ? "bg-amber-50 border-amber-200 text-amber-800"
                        : c.status === "full"
                        ? "bg-red-50 border-red-200 text-red-800"
                        : "bg-blue-50 border-blue-200 text-blue-800"
                    }`}
                    title={CELL_STATUS_LABELS[c.status]}
                  >
                    {c.id}
                  </Link>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 rounded-3xl bg-white border border-slate-200 p-6 shadow-xs space-y-3">
              <h3 className="font-bold text-base text-[#181A1F]">
                Пользователи платформы (демо)
              </h3>
              <div className="space-y-2">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  >
                    <div>
                      <p className="font-bold text-[#181A1F]">{u.name}</p>
                      <p className="text-slate-500">{u.phone}</p>
                    </div>
                    <Badge variant="outline">{u.role}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Stock Movements Audit Log */}
          <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-[#0D2B22]" />
              <h2 className="text-lg font-extrabold text-[#181A1F]">
                История складских операций ({movements.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-2 pr-4">Время</th>
                    <th className="pb-2 pr-4">Операция</th>
                    <th className="pb-2 pr-4">Материал</th>
                    <th className="pb-2 pr-4">Ячейка</th>
                    <th className="pb-2 pr-4">Исполнитель</th>
                    <th className="pb-2">Комментарий</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.slice(0, 15).map((mov) => (
                    <tr key={mov.id}>
                      <td className="py-2.5 pr-4 text-slate-500 whitespace-nowrap">
                        {formatDateRu(mov.createdAt)}
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge variant="outline">{mov.type}</Badge>
                      </td>
                      <td className="py-2.5 pr-4 font-semibold text-[#181A1F]">
                        {mov.materialTitle}
                      </td>
                      <td className="py-2.5 pr-4 font-mono">
                        {mov.fromCellId || "—"} → {mov.toCellId || "—"}
                      </td>
                      <td className="py-2.5 pr-4">{mov.actorName}</td>
                      <td className="py-2.5 text-slate-600">{mov.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Загрузка личного кабинета...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

