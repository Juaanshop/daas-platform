"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Package,
  Phone,
  CheckCircle2,
  Bike,
  Navigation,
  ArrowRight,
  Sparkles,
  ExternalLink,
  MessageCircle,
  Clock,
} from "lucide-react";
import { getGoogleMapsSearchUrl, getGoogleMapsNavigationUrl } from "@/lib/maps";

interface Order {
  id: string;
  orderNumber: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  recipientName: string;
  recipientPhone: string;
  packageNotes?: string | null;
  distanceKm: number;
  totalCost: number;
  status: string;
  createdAt: string;
  merchant: {
    businessName: string;
    address: string;
    phone: string;
  };
}

interface RiderJobCardProps {
  order: Order;
  onUpdateStatus: (orderId: string, nextStatus: string) => Promise<void>;
}

export function RiderJobCard({ order, onUpdateStatus }: RiderJobCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  // Determinar siguiente acción disponible según estado actual
  const getNextAction = () => {
    if (order.status === "ASSIGNED") {
      return {
        nextStatus: "PICKING_UP",
        label: "Llegué al Comercio (Retirar)",
        icon: Package,
        gradient: "from-indigo-500 via-indigo-600 to-sky-600",
        shadow: "shadow-indigo-500/25",
        description: "Notifica al restaurante que estás en el local",
      };
    }
    if (order.status === "PICKING_UP") {
      return {
        nextStatus: "IN_TRANSIT",
        label: "Confirmar Paquete Retirado (En Camino)",
        icon: Bike,
        gradient: "from-sky-500 via-teal-500 to-emerald-500",
        shadow: "shadow-teal-500/25",
        description: "Tienes el paquete en mano y vas hacia el destino",
      };
    }
    if (order.status === "IN_TRANSIT") {
      return {
        nextStatus: "DELIVERED",
        label: "Confirmar Entrega al Cliente",
        icon: CheckCircle2,
        gradient: "from-emerald-500 via-emerald-600 to-teal-600",
        shadow: "shadow-emerald-500/30",
        description: "Finaliza el despacho y libera tu disponibilidad",
      };
    }
    return null;
  };

  const action = getNextAction();

  const handleAction = async () => {
    if (!action) return;
    try {
      setIsUpdating(true);
      await onUpdateStatus(order.id, action.nextStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const riderEarnings = (order.totalCost * 0.8).toFixed(2);
  const pickupMapsUrl = getGoogleMapsSearchUrl(
    order.pickupLat,
    order.pickupLng,
    order.merchant.address
  );
  const dropoffMapsUrl = getGoogleMapsSearchUrl(
    order.dropoffLat,
    order.dropoffLng,
    order.dropoffAddress
  );
  const navigationGpsUrl = getGoogleMapsNavigationUrl(
    order.dropoffLat,
    order.dropoffLng
  );
  const customerWhatsAppUrl = `https://wa.me/${order.recipientPhone.replace(
    /[^0-9]/g,
    ""
  )}?text=${encodeURIComponent(
    `Hola ${order.recipientName}, soy tu repartidor de DaaS Flash llevando tu pedido de ${order.merchant.businessName}. Estoy en camino a ${order.dropoffAddress}.`
  )}`;

  const isStep1Active = order.status === "ASSIGNED" || order.status === "PICKING_UP";
  const isStep2Active = order.status === "IN_TRANSIT";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="surface-card rounded-2xl p-5 border border-emerald-500/30 shadow-2xl relative overflow-hidden space-y-4"
    >
      {/* Decorative pulse background glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-base font-black text-emerald-400">
            {order.orderNumber}
          </span>
          <Badge
            variant={
              order.status === "DELIVERED"
                ? "success"
                : order.status === "IN_TRANSIT"
                ? "info"
                : "warning"
            }
            pulse={order.status !== "DELIVERED"}
          >
            {order.status === "ASSIGNED"
              ? "Asignado"
              : order.status === "PICKING_UP"
              ? "En Retiro"
              : order.status === "IN_TRANSIT"
              ? "En Ruta"
              : "Completado"}
          </Badge>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
            Tu Pago
          </span>
          <span className="font-mono text-lg font-black text-emerald-300 tabular-nums">
            ${riderEarnings}
          </span>
        </div>
      </div>

      {/* Paso 1: Retiro en Comercio */}
      <div
        className={`p-3.5 rounded-xl border transition-all duration-300 ${
          isStep1Active
            ? "bg-slate-900/95 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/20"
            : "bg-slate-950/40 border-white/5 opacity-70"
        }`}
      >
        <div className="flex items-center justify-between text-xs font-semibold text-indigo-400 mb-1.5">
          <span className="flex items-center gap-2">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                isStep1Active
                  ? "bg-indigo-500 text-white shadow-sm shadow-indigo-500/50 animate-pulse"
                  : "bg-indigo-500/20 text-indigo-300"
              }`}
            >
              1
            </span>
            Retiro en Local
          </span>
          <a
            href={`tel:${order.merchant.phone}`}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            <Phone className="w-3 h-3 text-indigo-400" />
            <span>Llamar</span>
          </a>
        </div>

        <div className="text-sm font-bold text-white">
          {order.merchant.businessName}
        </div>
        <div className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
          <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          <span>{order.merchant.address}</span>
        </div>

        {/* Botón de Google Maps para el local */}
        <a
          href={pickupMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 border border-indigo-500/30 flex items-center justify-center gap-1.5 transition-all hover:translate-y-[-1px]"
        >
          <MapPin className="w-3.5 h-3.5 text-indigo-400" />
          <span>Ver Local en Google Maps</span>
          <ExternalLink className="w-3 h-3 opacity-60" />
        </a>
      </div>

      {/* Indicador de Trayecto */}
      <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-mono">
        <span className="w-8 h-[1px] bg-white/10" />
        <span>Distancia:</span>
        <span className="font-bold text-slate-200 tabular-nums">{order.distanceKm} km</span>
        <span className="w-8 h-[1px] bg-white/10" />
      </div>

      {/* Paso 2: Entrega al Cliente */}
      <div
        className={`p-3.5 rounded-xl border transition-all duration-300 ${
          isStep2Active
            ? "bg-slate-900/95 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20"
            : "bg-slate-950/40 border-white/5 opacity-70"
        }`}
      >
        <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 mb-1.5">
          <span className="flex items-center gap-2">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                isStep2Active
                  ? "bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/50 animate-pulse font-extrabold"
                  : "bg-emerald-500/20 text-emerald-300"
              }`}
            >
              2
            </span>
            Entrega a Destinatario
          </span>
          <a
            href={`tel:${order.recipientPhone}`}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            <Phone className="w-3 h-3 text-emerald-400" />
            <span>Llamar</span>
          </a>
        </div>

        <div className="text-sm font-bold text-white">
          {order.recipientName}
        </div>
        <div className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
          <Navigation className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span>{order.dropoffAddress}</span>
        </div>

        {order.packageNotes && (
          <div className="mt-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg">
            <span className="font-bold block text-[10px] uppercase tracking-wider text-amber-400">
              Instrucciones Especiales:
            </span>
            {order.packageNotes}
          </div>
        )}

        {/* Acciones de Google Maps y WhatsApp Cliente */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-white/5">
          <a
            href={navigationGpsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 flex items-center justify-center gap-1.5 transition-all hover:translate-y-[-1px] shadow-sm"
          >
            <Navigation className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Navegar GPS</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>

          <a
            href={customerWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold px-3 py-2 rounded-lg bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-white/10 flex items-center justify-center gap-1.5 transition-all hover:translate-y-[-1px]"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>WhatsApp</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        </div>
      </div>

      {/* Botón de Acción Táctil Principal con Framer Motion */}
      {action && (
        <motion.button
          id={`btn-rider-action-${order.id}`}
          onClick={handleAction}
          disabled={isUpdating}
          whileTap={{ scale: 0.98 }}
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={`w-full py-4 px-4 rounded-xl font-extrabold text-sm text-slate-950 bg-gradient-to-r ${action.gradient} hover:brightness-110 shadow-lg ${action.shadow} transition-all flex flex-col items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isUpdating ? (
            <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <div className="flex items-center gap-2">
                <action.icon className="w-5 h-5" />
                <span>{action.label}</span>
              </div>
              <span className="text-[11px] font-normal text-slate-900/80 mt-0.5">
                {action.description}
              </span>
            </>
          )}
        </motion.button>
      )}
    </motion.div>
  );
}

