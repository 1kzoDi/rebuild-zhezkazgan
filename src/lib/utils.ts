import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKzt(amount: number): string {
  if (amount === 0) return "Бесплатно";
  return `${new Intl.NumberFormat("ru-RU").format(amount)} ₸`;
}

export function formatDateRu(isoString: string): string {
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

export function formatNumberRu(num: number): string {
  return new Intl.NumberFormat("ru-RU").format(Math.round(num));
}

