"use client";

import { useStore } from "@/context/StoreContext";
import { CheckCircle2, Info, AlertCircle, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function ToastContainer() {
  const { toasts, dismissToast } = useStore();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-slate-200 bg-[#181A1F] text-white p-4 shadow-xl"
          >
            {t.variant === "success" && (
              <CheckCircle2 className="h-5 w-5 text-[#A3E635] shrink-0 mt-0.5" />
            )}
            {t.variant === "error" && (
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            )}
            {(!t.variant || t.variant === "info") && (
              <Info className="h-5 w-5 text-[#A3E635] shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{t.title}</p>
              {t.description && (
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  {t.description}
                </p>
              )}
            </div>
            <button
              onClick={() => dismissToast(t.id)}
              className="text-slate-400 hover:text-white cursor-pointer"
              aria-label="Закрыть уведомление"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

