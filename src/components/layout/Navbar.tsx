"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { UserRole } from "@/types/rebuild";
import { cn } from "@/lib/utils";
import {
  Boxes,
  Compass,
  LayoutDashboard,
  Leaf,
  Menu,
  PackageSearch,
  RotateCcw,
  ShieldCheck,
  Store,
  User,
  Warehouse,
  X,
} from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Главная", icon: Compass },
  { href: "/catalog", label: "Каталог", icon: PackageSearch },
  { href: "/warehouse", label: "Склад 2D", icon: Warehouse },
  { href: "/map", label: "Карта города", icon: Boxes },
  { href: "/impact", label: "Impact", icon: Leaf },
  { href: "/dashboard", label: "Кабинет", icon: LayoutDashboard },
];

const ROLE_OPTIONS: { value: UserRole; label: string; icon: React.ElementType }[] = [
  { value: "buyer", label: "Покупатель", icon: User },
  { value: "seller", label: "Продавец", icon: Store },
  { value: "admin", label: "Админ склада", icon: ShieldCheck },
];

export function Navbar() {
  const pathname = usePathname();
  const { isDemoMode, currentRole, setRole, resetDemoData, reservations } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const pendingCount = reservations.filter((r) => r.status === "pending").length;

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Demo Mode & Role Switcher Bar */}
      <div className="bg-[#0D2B22] text-white border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#A3E635]/20 px-2.5 py-0.5 text-[#A3E635] font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-[#A3E635] animate-pulse" />
              {isDemoMode ? "Демо-режим (тестовые данные)" : "Production (Supabase)"}
            </span>
            <span className="hidden md:inline text-slate-300">
              Пилот: г. Жезказган • Виртуальный склад ReBuild №1
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-slate-300">Роль:</span>
            <div className="inline-flex rounded-lg bg-white/10 p-0.5">
              {ROLE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = currentRole === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setRole(opt.value)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer",
                      active
                        ? "bg-[#A3E635] text-[#0D2B22] font-bold"
                        : "text-slate-200 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={resetDemoData}
              title="Сбросить демо-данные к исходному состоянию"
              className="inline-flex items-center gap-1 rounded-md border border-white/20 px-2 py-1 text-[11px] text-slate-200 hover:bg-white/10 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span className="hidden sm:inline">Сброс</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-[#0D2B22] flex items-center justify-center shadow-xs group-hover:bg-[#133C2F] transition-colors">
              <div className="h-4 w-4 rounded-sm bg-[#A3E635] rotate-12 group-hover:rotate-0 transition-transform" />
            </div>
            <div className="leading-tight">
              <span className="text-lg font-extrabold tracking-tight text-[#181A1F]">
                Re<span className="text-[#0D2B22]">Build</span>
              </span>
              <span className="block text-[10px] font-medium text-slate-500">
                Жезказган • Вторая жизнь материалов
              </span>
            </div>
          </Link>

          {/* Desktop Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-all",
                    isActive
                      ? "bg-[#0D2B22] text-white shadow-xs"
                      : "text-slate-700 hover:bg-slate-100 hover:text-[#181A1F]"
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive ? "text-[#A3E635]" : "text-slate-500")} />
                  <span>{item.label}</span>
                  {item.href === "/dashboard" && pendingCount > 0 && (
                    <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#A3E635] px-1.5 text-[11px] font-bold text-[#0D2B22]">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right CTA */}
          <div className="hidden sm:flex items-center gap-2">
            <Link
              href="/warehouse"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#A3E635] px-4 py-2 text-sm font-bold text-[#0D2B22] hover:bg-[#84CC16] transition-colors shadow-xs"
            >
              <Warehouse className="h-4 w-4" />
              <span>Открыть склад</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden rounded-xl p-2 text-slate-700 hover:bg-slate-100 cursor-pointer"
            aria-label="Меню"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
            {NAV_LINKS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium",
                    isActive
                      ? "bg-[#0D2B22] text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className={cn("h-4 w-4", isActive ? "text-[#A3E635]" : "text-slate-500")} />
                    {item.label}
                  </span>
                  {item.href === "/dashboard" && pendingCount > 0 && (
                    <span className="rounded-full bg-[#A3E635] px-2 py-0.5 text-xs font-bold text-[#0D2B22]">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}

