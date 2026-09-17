"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, X, Loader2, ShieldAlert } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  itemName: string;
  itemType: "comercio" | "repartidor";
  isLoading?: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  itemType,
  isLoading = false,
}: DeleteConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Modal Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-rose-500/30 shadow-2xl shadow-rose-500/10 p-6 z-10 space-y-5"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {title}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Acción de gestión de {itemType}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isLoading}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="space-y-3 text-xs text-slate-300">
              <p>
                ¿Estás seguro de que deseas eliminar o dar de baja a:{" "}
                <span className="font-bold text-white underline decoration-rose-400/50">
                  {itemName}
                </span>
                ?
              </p>

              <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/10 flex items-start gap-2.5 text-slate-400 text-[11px] leading-relaxed">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <b>Protección de Auditoría:</b> Si este {itemType} tiene servicios u órdenes históricas, el sistema lo <b>desactivará/ocultará</b> automáticamente protegiendo las liquidaciones y reportes. Si no tiene historial, se eliminará permanentemente.
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-red-600 hover:brightness-110 shadow-lg shadow-rose-500/20 disabled:opacity-50 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{isLoading ? "Procesando..." : "Confirmar"}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
