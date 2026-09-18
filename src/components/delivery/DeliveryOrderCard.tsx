"use client";

import { useState } from "react";
import { formatCurrency, formatDuration, formatDistance } from "@/lib/utils";
import { Phone, MessageCircle, Navigation, MapPin } from "lucide-react";

export interface DeliveryOrderCardProps {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    description?: string;
    packageDescription?: string;
    packageSize?: string;
    pickupAddress: string;
    pickupLat?: number | null;
    pickupLng?: number | null;
    dropoffAddress: string;
    dropoffLat?: number | null;
    dropoffLng?: number | null;
    recipientName: string;
    recipientPhone: string;
    recipientNotes?: string | null;
    packageNotes?: string | null;
    distanceKm?: number;
    durationMin?: number;
    fee?: number;
    totalCost?: number;
    riderEarnings?: number | null;
    confirmedAt?: string | null;
    pickedUpAt?: string | null;
    deliveredAt?: string | null;
    createdAt: string;
    merchant?: {
      name?: string;
      businessName?: string;
      email?: string;
      phone?: string | null;
    };
  };
  onStatusUpdated?: () => void;
}

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  DRAFT_SUBMITTED: { label: "Solicitada", color: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  CONFIRMED_PICKUP: { label: "Por Retirar", color: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  IN_TRANSIT: { label: "En Camino", color: "bg-purple-500/10 text-purple-400 border-purple-500/30" },
  DELIVERED: { label: "Entregada", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  CANCELLED: { label: "Cancelada", color: "bg-rose-500/10 text-rose-400 border-rose-500/30" },
};

export function DeliveryOrderCard({ order, onStatusUpdated }: DeliveryOrderCardProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingWhatsappUrl, setPendingWhatsappUrl] = useState<string | null>(null);

  const statusInfo = STATUS_BADGES[order.status] || {
    label: order.status,
    color: "bg-slate-800 text-slate-300 border-slate-700",
  };

  const effectiveFee = order.fee ?? order.totalCost ?? 0;
  const earnings = order.riderEarnings ?? effectiveFee;
  const effectiveDistance = order.distanceKm ?? 0;
  const effectiveDuration =
    order.durationMin ?? Math.max(5, Math.round(((order.distanceKm || 1) / 35) * 60));
  // Formato: #ORD y exactamente 4 caracteres (ej: #ORD2574)
  const rawDigitsOrChars = order.orderNumber.replace(/[^a-zA-Z0-9]/g, "").replace(/^ORD/i, "");
  const fourChars = rawDigitsOrChars.slice(-4).padStart(4, "0");
  const cleanOrderNumber = `#ORD${fourChars}`;

  const displayDescription =
    order.description || order.packageDescription || order.packageNotes || "Paquete";
  const merchantName = order.merchant?.businessName || order.merchant?.name;

  const handleStatusChange = async (newStatus: string) => {
    try {
      // Respuesta háptica en móvil al pulsar acción
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([35, 50, 35]);
      }

      setLoadingAction(newStatus);
      setError(null);
      setPendingWhatsappUrl(null);

      const res = await fetch(`/api/delivery/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al actualizar estado");
      }

      // Check if WhatsApp notification URL is returned
      const waUrl = data.whatsappUrl || data.whatsappNotification?.whatsappUrl;
      if (waUrl) {
        setPendingWhatsappUrl(waUrl);
        // Try opening in new window/tab directly
        try {
          const opened = window.open(waUrl, "_blank", "noopener,noreferrer");
          if (!opened || opened.closed || typeof opened.closed === "undefined") {
            // Popup blocked: pendingWhatsappUrl will show manual button
          }
        } catch {
          // Popup blocked fallback
        }
      }

      if (onStatusUpdated) {
        onStatusUpdated();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado";
      setError(msg);
    } finally {
      setLoadingAction(null);
    }
  };

  const getMapsUrl = (lat?: number | null, lng?: number | null, fallbackAddr?: string) => {
    if (lat && lng) {
      return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallbackAddr || "")}`;
  };

  const getWazeUrl = (lat?: number | null, lng?: number | null) => {
    if (lat && lng) {
      return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    }
    return null;
  };

  const cleanPhone = (order.recipientPhone || "").replace(/\D/g, "");
  const recipientWa = cleanPhone ? `https://wa.me/${cleanPhone}` : null;

  return (
    <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between h-full gap-4 shadow-xl transition-all">
      {/* 1. Header con Orden, Estado, Comercio y Ganancias */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base sm:text-lg font-bold text-white tracking-tight">
                {cleanOrderNumber}
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusInfo.color}`}
              >
                {statusInfo.label}
              </span>
            </div>
            {merchantName && (
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
                {merchantName}
              </p>
            )}
          </div>

          {/* Earnings Badge (100% para el delivery) */}
          <div className="text-right">
            <span className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider">Tarifa (100%)</span>
            <p className="text-lg sm:text-xl font-extrabold text-emerald-400 font-mono">
              {formatCurrency(effectiveFee)}
            </p>
            <span className="text-[10px] text-slate-500">100% para ti</span>
          </div>
        </div>

        {/* 2. Datos del Cliente que Recibe con Botón de Llamada Directa y WhatsApp */}
        <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800/60">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cliente Recibe:</p>
            <p className="text-sm font-bold text-white truncate">{order.recipientName}</p>
            <p className="text-xs text-slate-300 font-mono">{order.recipientPhone}</p>
          </div>
          
          <div className="flex items-center gap-1.5 shrink-0">
            {cleanPhone && (
              <a
                href={`tel:${cleanPhone}`}
                className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-bold text-slate-200 bg-slate-800/90 hover:bg-slate-700 rounded-xl border border-slate-700/80 transition-all shadow-xs cursor-pointer"
                title="Llamada telefónica directa"
              >
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden xs:inline">Llamar</span>
              </a>
            )}
            {recipientWa && (
              <a
                href={recipientWa}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl border border-emerald-500/30 transition-all shrink-0 shadow-xs cursor-pointer"
                title="Abrir chat de WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* 3. Package & Route Details */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 space-y-3 text-sm">
        <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-2">
          <span>
            Paquete: <strong className="text-slate-200 font-medium">{displayDescription}</strong>
          </span>
          <span className="font-semibold text-amber-400 text-[11px] uppercase tracking-wider">
            {order.packageSize || "Estándar"}
          </span>
        </div>

        {/* Addresses con Botones GPS de Alto Contraste y Acceso Directo */}
        <div className="space-y-2.5">
          {/* Punto de Retiro (Pickup) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0 ring-4 ring-emerald-500/20" />
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide">Punto de Retiro</span>
              </div>
              <a
                href={getMapsUrl(order.pickupLat, order.pickupLng, order.pickupAddress)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-black text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>GPS Recogida ↗</span>
              </a>
            </div>
            <p className="text-xs text-slate-300 font-medium leading-snug line-clamp-2">{order.pickupAddress}</p>
          </div>

          {/* Punto de Entrega (Dropoff) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-rose-500 shrink-0 ring-4 ring-rose-500/20" />
                <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wide">Punto de Entrega</span>
              </div>
              <a
                href={getMapsUrl(order.dropoffLat, order.dropoffLng, order.dropoffAddress)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-black text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>GPS Destino ↗</span>
              </a>
            </div>
            <p className="text-xs text-slate-300 font-medium leading-snug line-clamp-2">{order.dropoffAddress}</p>
          </div>
        </div>

        {/* Distance & Duration */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400 font-medium">
          <span>Distancia: <strong className="text-slate-200">{formatDistance(effectiveDistance)}</strong></span>
          <span>Tiempo estimado: <strong className="text-slate-200">{formatDuration(effectiveDuration)}</strong></span>
        </div>
      </div>

      {pendingWhatsappUrl && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-2 animate-pulse">
          <div className="text-xs text-emerald-300">
            <p className="font-bold">📲 Mensaje a Cliente listo</p>
            <p className="text-[11px] text-emerald-400/80">Toca para abrir WhatsApp si no se abrió automáticamente:</p>
          </div>
          <a
            href={pendingWhatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setPendingWhatsappUrl(null)}
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl whitespace-nowrap shadow-sm cursor-pointer"
          >
            Abrir WhatsApp
          </a>
        </div>
      )}

      {error && (
        <div className="p-2.5 text-xs text-rose-400 bg-rose-500/10 rounded-lg border border-rose-500/20">
          {error}
        </div>
      )}

      {/* Action Buttons con Altura Táctil Optimizada (50px) para Guantes o Manejo */}
      <div className="pt-2 mt-auto">
        {order.status === "DRAFT_SUBMITTED" && (
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => handleStatusChange("CANCELLED")}
              disabled={!!loadingAction}
              className="min-h-[50px] px-3 py-3 text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition-all disabled:opacity-50 cursor-pointer active:scale-[0.98]"
            >
              Rechazar
            </button>
            <button
              onClick={() => handleStatusChange("CONFIRMED_PICKUP")}
              disabled={!!loadingAction}
              className="min-h-[50px] px-3 py-3 text-sm font-black text-slate-950 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 rounded-xl transition-all disabled:opacity-50 shadow-md shadow-amber-500/20 cursor-pointer active:scale-[0.98]"
            >
              {loadingAction === "CONFIRMED_PICKUP" ? "Aceptando..." : "Aceptar Pedido"}
            </button>
          </div>
        )}

        {order.status === "CONFIRMED_PICKUP" && (
          <button
            onClick={() => handleStatusChange("IN_TRANSIT")}
            disabled={!!loadingAction}
            className="w-full min-h-[52px] px-4 py-3.5 text-sm font-black text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all disabled:opacity-50 shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            {loadingAction === "IN_TRANSIT" ? (
              "Actualizando..."
            ) : (
              <>
                <span>Ya Retiré &bull; Voy en Camino</span>
                <span className="text-xs opacity-80">(Avisar a Cliente)</span>
              </>
            )}
          </button>
        )}

        {order.status === "IN_TRANSIT" && (
          <button
            onClick={() => handleStatusChange("DELIVERED")}
            disabled={!!loadingAction}
            className="w-full min-h-[52px] px-4 py-3.5 text-sm font-black text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all disabled:opacity-50 shadow-md shadow-emerald-400/20 cursor-pointer active:scale-[0.98]"
          >
            {loadingAction === "DELIVERED" ? "Confirmando..." : "✓ Marcar como Entregado"}
          </button>
        )}

        {order.status === "DELIVERED" && (
          <div className="min-h-[48px] flex items-center justify-center text-center py-2.5 px-3 text-xs sm:text-sm font-black text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            Pedido Entregado con Éxito (+{formatCurrency(effectiveFee)})
          </div>
        )}

        {order.status === "CANCELLED" && (
          <div className="min-h-[48px] flex items-center justify-center text-center py-2.5 px-3 text-xs font-bold text-rose-400 bg-rose-500/10 rounded-xl border border-rose-500/20">
            Pedido Cancelado
          </div>
        )}
      </div>
    </div>
  );
}
