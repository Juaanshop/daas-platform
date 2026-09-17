"use client";

import React from "react";
import {
  X,
  User,
  Phone,
  MapPin,
  ExternalLink,
  MessageCircle,
  Bike,
  Clock,
  Package,
  DollarSign,
  Compass,
  Navigation,
  XCircle,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { StatusBadge } from "../shared/StatusBadge";
import { WhatsAppService } from "@/services/whatsapp";
import { getGoogleMapsSearchUrl, getGoogleMapsNavigationUrl } from "@/lib/maps";

export interface OrderDetail {
  id: string;
  orderNumber: string;
  pickupAddress: string;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  dropoffMapUrl?: string | null;
  recipientName: string;
  recipientPhone: string;
  packageNotes?: string | null;
  baseFee?: number;
  distanceKm: number;
  totalCost: number;
  status: string;
  createdAt: string;
  pickedUpAt?: string | null;
  deliveredAt?: string | null;
  merchant?: {
    businessName: string;
  };
  rider?: {
    id: string;
    phone: string;
    vehiclePlate: string;
    user: {
      name: string;
    };
  } | null;
}

interface CustomerDetailModalProps {
  order: OrderDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onCancelOrder?: (orderId: string) => void;
}

import { motion, AnimatePresence } from "framer-motion";

export function CustomerDetailModal({
  order,
  isOpen,
  onClose,
  onCancelOrder,
}: CustomerDetailModalProps) {
  if (!isOpen || !order) return null;

  const googleMapsUrl =
    order.dropoffMapUrl ||
    getGoogleMapsSearchUrl(
      order.dropoffLat,
      order.dropoffLng,
      order.dropoffAddress
    );

  const navigationUrl = getGoogleMapsNavigationUrl(
    order.dropoffLat,
    order.dropoffLng
  );

  const customerWhatsAppUrl = WhatsAppService.getCustomerWhatsAppUrl(
    order.recipientPhone,
    order.recipientName,
    order.orderNumber,
    order.merchant?.businessName
  );

  const createdAtFormatted = new Date(order.createdAt).toLocaleString("es-VE", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const statusSteps = [
    { key: "PENDING", label: "Pendiente" },
    { key: "ASSIGNED", label: "Asignado" },
    { key: "PICKING_UP", label: "En Local" },
    { key: "IN_TRANSIT", label: "En Camino" },
    { key: "DELIVERED", label: "Entregado" },
  ];

  const currentStepIndex = statusSteps.findIndex((s) => s.key === order.status);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="surface-card max-w-2xl w-full rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl space-y-6 relative my-8"
        >
          {/* Botón de Cierre */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-white/10 transition-colors cursor-pointer"
            title="Cerrar ficha"
          >
            <X className="w-5 h-5" />
          </button>

        {/* Encabezado */}
        <div className="flex flex-wrap items-center gap-3 pr-12">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
            <User className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Ficha del Cliente & Despacho
              </h2>
              <span className="font-mono text-sm font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                {order.orderNumber}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <Calendar className="w-3 h-3 text-slate-500" />
              <span>Solicitado el {createdAtFormatted}</span>
            </p>
          </div>
          <div className="ml-auto sm:ml-0">
            <StatusBadge status={order.status} />
          </div>
        </div>

        {/* Barra de Progreso del Estado */}
        {order.status !== "CANCELLED" ? (
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Progreso del Despacho
            </span>
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {statusSteps.map((step, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div key={step.key} className="text-center space-y-1">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        isCurrent
                          ? "bg-cyan-400 shadow-sm shadow-cyan-400/50"
                          : isPassed
                          ? "bg-emerald-400"
                          : "bg-slate-800"
                      }`}
                    />
                    <span
                      className={`text-[10px] block truncate font-medium ${
                        isCurrent
                          ? "text-cyan-300 font-bold"
                          : isPassed
                          ? "text-slate-300"
                          : "text-slate-600"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2 font-medium">
            <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>Este despacho fue cancelado por el comercio o administración.</span>
          </div>
        )}

        {/* Sección 1: Datos de Contacto del Cliente */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              Datos del Destinatario (Cliente)
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Contacto directo
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
              <span className="text-[11px] text-slate-400 block">Nombre Completo</span>
              <span className="text-base font-bold text-white block">
                {order.recipientName}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
              <span className="text-[11px] text-slate-400 block">Teléfono de Contacto</span>
              <span className="text-base font-bold text-sky-300 font-mono block">
                {order.recipientPhone}
              </span>
            </div>
          </div>

          {/* Botones de Acción Inmediata: WhatsApp y Llamada */}
          <div className="flex flex-wrap gap-2 pt-1">
            <a
              href={customerWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[200px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Contactar Cliente por WhatsApp</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>

            <a
              href={`tel:${order.recipientPhone}`}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-white/10 transition-all flex items-center justify-center gap-2"
            >
              <Phone className="w-3.5 h-3.5 text-sky-400" />
              <span>Llamar</span>
            </a>
          </div>
        </div>

        {/* Sección 2: Destino & Ubicación Exacta de Google Maps */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              Destino y Precisión Geográfica (Google Maps)
            </span>
            <span className="text-[11px] font-mono text-cyan-400">
              [{order.dropoffLat.toFixed(5)}, {order.dropoffLng.toFixed(5)}]
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
            <span className="text-[11px] text-slate-400 block">Dirección de Entrega:</span>
            <span className="text-sm font-medium text-slate-200 block">
              {order.dropoffAddress}
            </span>
          </div>

          {/* Enlaces de Google Maps */}
          <div className="flex flex-wrap gap-2 pt-1">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[180px] py-2.5 px-4 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Ver Ubicación en Google Maps</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>

            <a
              href={navigationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-4 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Ruta GPS</span>
            </a>
          </div>
        </div>

        {/* Sección 3: Detalles del Paquete y Desglose Financiero */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-amber-400" />
              Instrucciones / Paquete
            </span>
            <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-white/5 min-h-[50px]">
              {order.packageNotes || "Sin instrucciones especiales indicadas."}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              Desglose de Tarifación
            </span>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Distancia calculada:</span>
                <span className="font-bold text-white">{order.distanceKm} km</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Tarifa Base (2 km):</span>
                <span className="font-bold text-emerald-400">
                  ${(order.baseFee || 2.0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-xs pt-1 border-t border-white/5 font-bold">
                <span className="text-slate-200">Total Despacho:</span>
                <span className="text-emerald-400 text-sm">
                  ${order.totalCost.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sección 4: Repartidor Asignado */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Bike className="w-3.5 h-3.5 text-sky-400" />
            Repartidor Asignado
          </span>

          {order.rider ? (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center border border-sky-500/30">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">
                    {order.rider.user.name}
                  </div>
                  <div className="text-xs text-slate-400">
                    Placa:{" "}
                    <span className="font-mono text-slate-200 font-bold">
                      {order.rider.vehiclePlate}
                    </span>{" "}
                    • Tel: {order.rider.phone}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <a
                  href={`https://wa.me/${WhatsAppService.cleanPhoneNumber(
                    order.rider.phone
                  )}?text=${encodeURIComponent(
                    `Hola ${order.rider.user.name}, te escribimos del comercio respecto al pedido ${order.orderNumber}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-1.5 px-3 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="w-3 h-3" />
                  <span>WhatsApp</span>
                </a>

                <a
                  href={`tel:${order.rider.phone}`}
                  className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3 h-3" />
                  <span>Llamar</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="py-2 text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>
                Despacho en cola. El sistema o administración asignará un repartidor cercano.
              </span>
            </div>
          )}
        </div>

        {/* Footer / Acciones */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
          >
            Cerrar
          </button>

          {order.status === "PENDING" && onCancelOrder && (
            <button
              type="button"
              onClick={() => {
                if (confirm("¿Estás seguro de que deseas cancelar este despacho?")) {
                  onCancelOrder(order.id);
                  onClose();
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancelar Despacho</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  </AnimatePresence>
  );
}
