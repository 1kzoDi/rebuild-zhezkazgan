export type UserRole = "buyer" | "seller" | "admin";

export type MaterialCategory =
  | "bricks"
  | "wood"
  | "tiles"
  | "doors"
  | "metal"
  | "plumbing"
  | "finishing"
  | "other";

export type MaterialCondition =
  | "Новый остаток"
  | "Б/у, отличное состояние"
  | "Б/у, пригоден для повторного использования"
  | "Требует очистки";

export type CellStatus = "free" | "partial" | "full" | "reserved";

export type ReservationStatus = "pending" | "confirmed" | "completed" | "cancelled";

export type MovementType =
  | "intake"
  | "reserve"
  | "release"
  | "move"
  | "adjust"
  | "issue";

export type ZoneId = "A" | "B" | "C" | "D" | "E" | "F";

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
  company?: string;
  city: string;
  rating: number;
  verified: boolean;
}

export interface WarehouseZone {
  id: ZoneId;
  name: string;
  description: string;
  categories: MaterialCategory[];
  color: string;
  rows: number;
  cols: number;
}

export interface WarehouseCell {
  id: string; // e.g. "A-04"
  zoneId: ZoneId;
  rack: number;
  row: number;
  col: number;
  capacityUnits: number;
  status: CellStatus;
  materialId: string | null;
}

export interface Material {
  id: string;
  title: string;
  description: string;
  category: MaterialCategory;
  condition: MaterialCondition;
  priceKzt: number; // 0 = бесплатно
  unit: string; // "шт.", "м²", "м.п.", "уп.", "мешок", "лист"
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  weightPerUnitKg: number;
  location: string; // e.g. "г. Жезказган, Склад ReBuild №1"
  cityPointId?: string;
  cellId: string | null; // e.g. "A-04"
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  sellerType: "Частное лицо" | "Стройкомпания" | "Бригада";
  images: string[];
  dimensions?: string;
  createdAt: string;
  isDemo: boolean;
}

export interface Reservation {
  id: string;
  materialId: string;
  materialTitle: string;
  cellId: string | null;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  sellerId: string;
  quantity: number;
  unit: string;
  totalPriceKzt: number;
  status: ReservationStatus;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  type: MovementType;
  materialId: string;
  materialTitle: string;
  fromCellId: string | null;
  toCellId: string | null;
  quantityDelta: number;
  actorName: string;
  actorRole: UserRole;
  note: string;
  createdAt: string;
}

export type CityPointType = "warehouse" | "reception" | "pickup" | "seller";

export interface CityPoint {
  id: string;
  name: string;
  type: CityPointType;
  address: string;
  lat: number;
  lng: number;
  workingHours: string;
  phone: string;
  acceptedCategories: MaterialCategory[];
  description: string;
  isDemo: boolean;
}

export const CATEGORY_LABELS: Record<MaterialCategory, string> = {
  bricks: "Кирпичи и блоки",
  wood: "Доски и древесина",
  tiles: "Плитка и керамика",
  doors: "Двери и окна",
  metal: "Металлические изделия",
  plumbing: "Сантехника",
  finishing: "Отделочные материалы",
  other: "Прочие строительные остатки",
};

export const CELL_STATUS_LABELS: Record<CellStatus, string> = {
  free: "Свободно",
  partial: "Частично заполнено",
  full: "Заполнено",
  reserved: "Зарезервировано",
};

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: "Ожидает подтверждения",
  confirmed: "Подтверждено (готово к выдаче)",
  completed: "Выдано",
  cancelled: "Отменено",
};

