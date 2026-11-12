"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEMO_USERS,
  INITIAL_CELLS,
  INITIAL_MATERIALS,
  INITIAL_MOVEMENTS,
  INITIAL_RESERVATIONS,
  ZHEZKAZGAN_CITY_POINTS,
  WAREHOUSE_ZONES,
} from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  CellStatus,
  CityPoint,
  Material,
  MaterialCategory,
  MaterialCondition,
  Reservation,
  StockMovement,
  UserProfile,
  UserRole,
  WarehouseCell,
  WarehouseZone,
} from "@/types/rebuild";

const STORAGE_KEY = "rebuild_demo_state_zhezkazgan_v2";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: "success" | "error" | "info";
}

interface NewMaterialInput {
  title: string;
  description: string;
  category: MaterialCategory;
  condition: MaterialCondition;
  priceKzt: number;
  unit: string;
  totalQuantity: number;
  weightPerUnitKg: number;
  location: string;
  cellId?: string | null;
  dimensions?: string;
  images?: string[];
}

interface StoreContextValue {
  isDemoMode: boolean;
  currentRole: UserRole;
  currentUser: UserProfile;
  setRole: (role: UserRole) => void;
  users: UserProfile[];
  zones: WarehouseZone[];
  cells: WarehouseCell[];
  materials: Material[];
  reservations: Reservation[];
  movements: StockMovement[];
  cityPoints: CityPoint[];
  favorites: string[];
  toasts: ToastMessage[];
  dismissToast: (id: string) => void;
  notify: (title: string, description?: string, variant?: ToastMessage["variant"]) => void;
  toggleFavorite: (materialId: string) => void;
  createReservation: (
    materialId: string,
    quantity: number,
    comment?: string
  ) => { ok: boolean; error?: string; reservation?: Reservation };
  confirmReservation: (reservationId: string) => { ok: boolean; error?: string };
  completeReservation: (reservationId: string) => { ok: boolean; error?: string };
  cancelReservation: (reservationId: string) => { ok: boolean; error?: string };
  addMaterial: (input: NewMaterialInput) => { ok: boolean; material?: Material; error?: string };
  updateMaterial: (
    id: string,
    patch: Partial<Pick<Material, "priceKzt" | "availableQuantity" | "totalQuantity" | "condition" | "title" | "description">>
  ) => { ok: boolean; error?: string };
  deleteMaterial: (id: string) => { ok: boolean; error?: string };
  moveMaterialCell: (materialId: string, targetCellId: string) => { ok: boolean; error?: string };
  adjustStock: (materialId: string, newAvailable: number) => { ok: boolean; error?: string };
  resetDemoData: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function computeCellStatus(
  cell: WarehouseCell,
  material: Material | undefined
): CellStatus {
  if (!material || (material.availableQuantity <= 0 && material.reservedQuantity <= 0)) {
    return "free";
  }
  if (material.reservedQuantity > 0 && material.availableQuantity === 0) {
    return "reserved";
  }
  if (material.reservedQuantity > 0) {
    return "reserved";
  }
  const fillRatio = material.availableQuantity / Math.max(1, cell.capacityUnits);
  if (fillRatio >= 0.75) return "full";
  return "partial";
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [currentRole, setCurrentRole] = useState<UserRole>("buyer");
  const [users] = useState<UserProfile[]>(DEMO_USERS);
  const [zones] = useState<WarehouseZone[]>(WAREHOUSE_ZONES);
  const [cells, setCells] = useState<WarehouseCell[]>(INITIAL_CELLS);
  const [materials, setMaterials] = useState<Material[]>(INITIAL_MATERIALS);
  const [reservations, setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS);
  const [movements, setMovements] = useState<StockMovement[]>(INITIAL_MOVEMENTS);
  const [favorites, setFavorites] = useState<string[]>(["mat-1", "mat-5", "mat-9"]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage for persistent Pizza Pitch demo
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.cells) setCells(parsed.cells);
        if (parsed.materials) setMaterials(parsed.materials);
        if (parsed.reservations) setReservations(parsed.reservations);
        if (parsed.movements) setMovements(parsed.movements);
        if (parsed.favorites) setFavorites(parsed.favorites);
        if (parsed.currentRole) setCurrentRole(parsed.currentRole);
      }
    } catch {
      // Ignore corrupted localStorage
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          currentRole,
          cells,
          materials,
          reservations,
          movements,
          favorites,
        })
      );
    } catch {
      // Ignore quota errors
    }
  }, [hydrated, currentRole, cells, materials, reservations, movements, favorites]);

  const currentUser = useMemo(() => {
    if (currentRole === "admin") return users.find((u) => u.role === "admin") ?? users[0];
    if (currentRole === "seller") return users.find((u) => u.role === "seller") ?? users[0];
    return users.find((u) => u.role === "buyer") ?? users[0];
  }, [currentRole, users]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (title: string, description?: string, variant: ToastMessage["variant"] = "info") => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, title, description, variant }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const setRole = useCallback(
    (role: UserRole) => {
      setCurrentRole(role);
      const roleLabels: Record<UserRole, string> = {
        buyer: "Покупатель",
        seller: "Продавец",
        admin: "Администратор склада",
      };
      notify(`Режим: ${roleLabels[role]}`, "Права доступа обновлены для демонстрации", "info");
    },
    [notify]
  );

  const toggleFavorite = useCallback((materialId: string) => {
    setFavorites((prev) =>
      prev.includes(materialId) ? prev.filter((id) => id !== materialId) : [...prev, materialId]
    );
  }, []);

  const syncCellWithMaterials = useCallback(
    (nextMaterials: Material[], nextCells: WarehouseCell[]) => {
      return nextCells.map((cell) => {
        const mat = nextMaterials.find((m) => m.cellId === cell.id);
        if (!mat) {
          return { ...cell, materialId: null, status: "free" as CellStatus };
        }
        return {
          ...cell,
          materialId: mat.id,
          status: computeCellStatus(cell, mat),
        };
      });
    },
    []
  );

  const createReservation = useCallback(
    (materialId: string, quantity: number, comment?: string) => {
      const target = materials.find((m) => m.id === materialId);
      if (!target) return { ok: false, error: "Материал не найден" };
      if (quantity <= 0 || !Number.isFinite(quantity)) {
        return { ok: false, error: "Укажите корректное количество" };
      }
      if (quantity > target.availableQuantity) {
        return {
          ok: false,
          error: `Доступно только ${target.availableQuantity} ${target.unit}`,
        };
      }

      const now = new Date().toISOString();
      const newRes: Reservation = {
        id: `res-${Math.floor(100 + Math.random() * 900)}`,
        materialId: target.id,
        materialTitle: target.title,
        cellId: target.cellId,
        buyerId: currentUser.id,
        buyerName: currentUser.name,
        buyerPhone: currentUser.phone,
        sellerId: target.sellerId,
        quantity,
        unit: target.unit,
        totalPriceKzt: target.priceKzt * quantity,
        status: "pending",
        comment: comment?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };

      const nextMaterials = materials.map((m) =>
        m.id === target.id
          ? {
              ...m,
              availableQuantity: m.availableQuantity - quantity,
              reservedQuantity: m.reservedQuantity + quantity,
            }
          : m
      );

      const nextCells = syncCellWithMaterials(nextMaterials, cells);
      const movement: StockMovement = {
        id: `mov-${Date.now()}`,
        type: "reserve",
        materialId: target.id,
        materialTitle: target.title,
        fromCellId: target.cellId,
        toCellId: target.cellId,
        quantityDelta: -quantity,
        actorName: currentUser.name,
        actorRole: currentRole,
        note: `Бронирование #${newRes.id}: ${quantity} ${target.unit}`,
        createdAt: now,
      };

      setMaterials(nextMaterials);
      setCells(nextCells);
      setReservations((prev) => [newRes, ...prev]);
      setMovements((prev) => [movement, ...prev]);

      notify(
        "Бронирование оформлено!",
        `${target.title} (${quantity} ${target.unit})${target.cellId ? ` — ячейка ${target.cellId} отмечена на карте` : ""}`,
        "success"
      );

      return { ok: true, reservation: newRes };
    },
    [materials, cells, currentUser, currentRole, syncCellWithMaterials, notify]
  );

  const confirmReservation = useCallback(
    (reservationId: string) => {
      if (currentRole !== "admin") {
        return { ok: false, error: "Только администратор склада может подтверждать бронь" };
      }
      const res = reservations.find((r) => r.id === reservationId);
      if (!res || res.status !== "pending") {
        return { ok: false, error: "Бронирование недоступно для подтверждения" };
      }
      const now = new Date().toISOString();
      setReservations((prev) =>
        prev.map((r) =>
          r.id === reservationId ? { ...r, status: "confirmed", updatedAt: now } : r
        )
      );
      notify("Бронирование подтверждено", `Заказ #${res.id} готов к выдаче`, "success");
      return { ok: true };
    },
    [currentRole, reservations, notify]
  );

  const completeReservation = useCallback(
    (reservationId: string) => {
      if (currentRole !== "admin") {
        return { ok: false, error: "Только администратор склада может подтверждать выдачу" };
      }
      const res = reservations.find((r) => r.id === reservationId);
      if (!res || (res.status !== "pending" && res.status !== "confirmed")) {
        return { ok: false, error: "Заказ нельзя завершить в текущем статусе" };
      }

      const now = new Date().toISOString();
      const nextMaterials = materials.map((m) => {
        if (m.id !== res.materialId) return m;
        const nextReserved = Math.max(0, m.reservedQuantity - res.quantity);
        const nextTotal = Math.max(0, m.totalQuantity - res.quantity);
        return {
          ...m,
          reservedQuantity: nextReserved,
          totalQuantity: nextTotal,
          cellId: m.availableQuantity === 0 && nextReserved === 0 ? null : m.cellId,
        };
      });

      const nextCells = syncCellWithMaterials(nextMaterials, cells);
      const movement: StockMovement = {
        id: `mov-${Date.now()}`,
        type: "issue",
        materialId: res.materialId,
        materialTitle: res.materialTitle,
        fromCellId: res.cellId,
        toCellId: null,
        quantityDelta: -res.quantity,
        actorName: currentUser.name,
        actorRole: currentRole,
        note: `Выдача по заказу #${res.id} (${res.quantity} ${res.unit})`,
        createdAt: now,
      };

      setMaterials(nextMaterials);
      setCells(nextCells);
      setReservations((prev) =>
        prev.map((r) =>
          r.id === reservationId ? { ...r, status: "completed", updatedAt: now } : r
        )
      );
      setMovements((prev) => [movement, ...prev]);
      notify("Выдача подтверждена", `Материал передан покупателю (${res.quantity} ${res.unit})`, "success");
      return { ok: true };
    },
    [currentRole, reservations, materials, cells, currentUser.name, syncCellWithMaterials, notify]
  );

  const cancelReservation = useCallback(
    (reservationId: string) => {
      const res = reservations.find((r) => r.id === reservationId);
      if (!res || res.status === "completed" || res.status === "cancelled") {
        return { ok: false, error: "Отмена невозможна" };
      }
      if (currentRole === "seller") {
        return { ok: false, error: "Недостаточно прав" };
      }

      const now = new Date().toISOString();
      const nextMaterials = materials.map((m) =>
        m.id === res.materialId
          ? {
              ...m,
              availableQuantity: m.availableQuantity + res.quantity,
              reservedQuantity: Math.max(0, m.reservedQuantity - res.quantity),
            }
          : m
      );

      const nextCells = syncCellWithMaterials(nextMaterials, cells);
      const movement: StockMovement = {
        id: `mov-${Date.now()}`,
        type: "release",
        materialId: res.materialId,
        materialTitle: res.materialTitle,
        fromCellId: res.cellId,
        toCellId: res.cellId,
        quantityDelta: res.quantity,
        actorName: currentUser.name,
        actorRole: currentRole,
        note: `Отмена брони #${res.id}: возвращено ${res.quantity} ${res.unit}`,
        createdAt: now,
      };

      setMaterials(nextMaterials);
      setCells(nextCells);
      setReservations((prev) =>
        prev.map((r) =>
          r.id === reservationId ? { ...r, status: "cancelled", updatedAt: now } : r
        )
      );
      setMovements((prev) => [movement, ...prev]);
      notify("Бронирование отменено", `Остаток ${res.quantity} ${res.unit} возвращён в каталог`, "info");
      return { ok: true };
    },
    [reservations, currentRole, materials, cells, currentUser.name, syncCellWithMaterials, notify]
  );

  const addMaterial = useCallback(
    (input: NewMaterialInput) => {
      if (currentRole === "buyer") {
        return { ok: false, error: "Покупатели не могут размещать материалы" };
      }

      const now = new Date().toISOString();
      const cellId = input.cellId || null;
      const newMat: Material = {
        id: `mat-${Date.now()}`,
        title: input.title,
        description: input.description,
        category: input.category,
        condition: input.condition,
        priceKzt: input.priceKzt,
        unit: input.unit,
        totalQuantity: input.totalQuantity,
        availableQuantity: input.totalQuantity,
        reservedQuantity: 0,
        weightPerUnitKg: input.weightPerUnitKg,
        location: input.location,
        cityPointId: "cp-warehouse-1",
        cellId,
        sellerId: currentUser.id,
        sellerName: currentUser.name,
        sellerPhone: currentUser.phone,
        sellerType: currentUser.company ? "Стройкомпания" : "Частное лицо",
        images:
          input.images && input.images.length > 0
            ? input.images
            : [`/images/categories/${input.category}.svg`],
        dimensions: input.dimensions,
        createdAt: now,
        isDemo: true,
      };

      const nextMaterials = [newMat, ...materials];
      const nextCells = syncCellWithMaterials(nextMaterials, cells);
      const movement: StockMovement = {
        id: `mov-${Date.now()}`,
        type: "intake",
        materialId: newMat.id,
        materialTitle: newMat.title,
        fromCellId: null,
        toCellId: cellId,
        quantityDelta: newMat.totalQuantity,
        actorName: currentUser.name,
        actorRole: currentRole,
        note: cellId ? `Приёмка на склад в ячейку ${cellId}` : "Новое объявление продавца",
        createdAt: now,
      };

      setMaterials(nextMaterials);
      setCells(nextCells);
      setMovements((prev) => [movement, ...prev]);
      notify("Материал добавлен", newMat.title, "success");
      return { ok: true, material: newMat };
    },
    [currentRole, currentUser, materials, cells, syncCellWithMaterials, notify]
  );

  const updateMaterial = useCallback(
    (
      id: string,
      patch: Partial<
        Pick<
          Material,
          "priceKzt" | "availableQuantity" | "totalQuantity" | "condition" | "title" | "description"
        >
      >
    ) => {
      const target = materials.find((m) => m.id === id);
      if (!target) return { ok: false, error: "Материал не найден" };
      if (currentRole === "buyer") {
        return { ok: false, error: "Недостаточно прав" };
      }
      if (currentRole === "seller" && target.sellerId !== currentUser.id) {
        return { ok: false, error: "Вы можете редактировать только свои объявления" };
      }

      const nextMaterials = materials.map((m) =>
        m.id === id ? { ...m, ...patch } : m
      );
      const nextCells = syncCellWithMaterials(nextMaterials, cells);
      setMaterials(nextMaterials);
      setCells(nextCells);
      notify("Объявление обновлено", target.title, "success");
      return { ok: true };
    },
    [materials, currentRole, currentUser.id, cells, syncCellWithMaterials, notify]
  );

  const deleteMaterial = useCallback(
    (id: string) => {
      const target = materials.find((m) => m.id === id);
      if (!target) return { ok: false, error: "Не найден" };
      if (currentRole === "buyer") return { ok: false, error: "Недостаточно прав" };
      if (currentRole === "seller" && target.sellerId !== currentUser.id) {
        return { ok: false, error: "Можно удалять только свои объявления" };
      }
      const nextMaterials = materials.filter((m) => m.id !== id);
      const nextCells = syncCellWithMaterials(nextMaterials, cells);
      setMaterials(nextMaterials);
      setCells(nextCells);
      notify("Материал удалён", target.title, "info");
      return { ok: true };
    },
    [materials, currentRole, currentUser.id, cells, syncCellWithMaterials, notify]
  );

  const moveMaterialCell = useCallback(
    (materialId: string, targetCellId: string) => {
      if (currentRole !== "admin") {
        return { ok: false, error: "Только администратор склада может перемещать ячейки" };
      }
      const mat = materials.find((m) => m.id === materialId);
      const targetCell = cells.find((c) => c.id === targetCellId);
      if (!mat || !targetCell) return { ok: false, error: "Материал или ячейка не найдены" };
      if (targetCell.materialId && targetCell.materialId !== materialId) {
        return { ok: false, error: `Ячейка ${targetCellId} уже занята` };
      }

      const oldCellId = mat.cellId;
      const now = new Date().toISOString();
      const nextMaterials = materials.map((m) =>
        m.id === materialId
          ? {
              ...m,
              cellId: targetCellId,
              location: `г. Жезказган, Склад ReBuild №1 (Зона ${targetCell.zoneId}, стеллаж ${targetCell.rack}, ячейка ${targetCellId})`,
            }
          : m
      );
      const nextCells = syncCellWithMaterials(nextMaterials, cells);
      const movement: StockMovement = {
        id: `mov-${Date.now()}`,
        type: "move",
        materialId: mat.id,
        materialTitle: mat.title,
        fromCellId: oldCellId,
        toCellId: targetCellId,
        quantityDelta: 0,
        actorName: currentUser.name,
        actorRole: currentRole,
        note: `Перемещение ${oldCellId ?? "без ячейки"} → ${targetCellId}`,
        createdAt: now,
      };

      setMaterials(nextMaterials);
      setCells(nextCells);
      setMovements((prev) => [movement, ...prev]);
      notify("Ячейка обновлена", `${mat.title} → ${targetCellId}`, "success");
      return { ok: true };
    },
    [currentRole, materials, cells, currentUser.name, syncCellWithMaterials, notify]
  );

  const adjustStock = useCallback(
    (materialId: string, newAvailable: number) => {
      if (currentRole !== "admin") {
        return { ok: false, error: "Только администратор склада может менять складские остатки" };
      }
      const mat = materials.find((m) => m.id === materialId);
      if (!mat) return { ok: false, error: "Материал не найден" };
      const safeQty = Math.max(0, Math.round(newAvailable));
      const delta = safeQty - mat.availableQuantity;
      const now = new Date().toISOString();

      const nextMaterials = materials.map((m) =>
        m.id === materialId
          ? {
              ...m,
              availableQuantity: safeQty,
              totalQuantity: safeQty + m.reservedQuantity,
            }
          : m
      );
      const nextCells = syncCellWithMaterials(nextMaterials, cells);
      const movement: StockMovement = {
        id: `mov-${Date.now()}`,
        type: "adjust",
        materialId: mat.id,
        materialTitle: mat.title,
        fromCellId: mat.cellId,
        toCellId: mat.cellId,
        quantityDelta: delta,
        actorName: currentUser.name,
        actorRole: currentRole,
        note: `Корректировка остатка: ${mat.availableQuantity} → ${safeQty} ${mat.unit}`,
        createdAt: now,
      };

      setMaterials(nextMaterials);
      setCells(nextCells);
      setMovements((prev) => [movement, ...prev]);
      notify("Остаток обновлён", `${mat.title}: ${safeQty} ${mat.unit}`, "success");
      return { ok: true };
    },
    [currentRole, materials, cells, currentUser.name, syncCellWithMaterials, notify]
  );

  const resetDemoData = useCallback(() => {
    setCells(INITIAL_CELLS);
    setMaterials(INITIAL_MATERIALS);
    setReservations(INITIAL_RESERVATIONS);
    setMovements(INITIAL_MOVEMENTS);
    setFavorites(["mat-1", "mat-5", "mat-9"]);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    notify("Демо-данные сброшены", "Восстановлено исходное состояние склада ReBuild", "info");
  }, [notify]);

  const value: StoreContextValue = {
    isDemoMode: !isSupabaseConfigured,
    currentRole,
    currentUser,
    setRole,
    users,
    zones,
    cells,
    materials,
    reservations,
    movements,
    cityPoints: ZHEZKAZGAN_CITY_POINTS,
    favorites,
    toasts,
    dismissToast,
    notify,
    toggleFavorite,
    createReservation,
    confirmReservation,
    completeReservation,
    cancelReservation,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    moveMaterialCell,
    adjustStock,
    resetDemoData,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

