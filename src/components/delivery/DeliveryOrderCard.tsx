"use client";

import { useState } from "react";
import { formatCurrency, formatDuration, formatDistance } from "@/lib/utils";

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
  const earnings = order.riderEarnings ?? Number((effectiveFee * 0.8).toFixed(2));
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

  const cleanPhone = (order.recipientPhone || "").replace(/\D/g, "");
  const recipientWa = cleanPhone ? `https://wa.me/${cleanPhone}` : null;

  return (
    <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between h-full gap-4 shadow-xl transition-all">
      {/* 1. Header con Orden, Estado, Comercio y Ganancias */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-bold text-white tracking-tight">
                {cleanOrderNumber}
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusInfo.color}`}
              >
                {statusInfo.label}
              </span>
            </div>
            {merchantName && (
              <p className="text-xs text-slate-400 mt-1 font-medium">
                {merchantName}
              </p>
            )}
          </div>

          {/* Earnings Badge (100% para el delivery) */}
          <div className="text-right">
            <span className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider">Tarifa (100%)</span>
            <p className="text-lg font-extrabold text-emerald-400 font-mono">
              {formatCurrency(effectiveFee)}
            </p>
            <span className="text-[10px] text-slate-500">100% para ti</span>
          </div>
        </div>

        {/* 2. Datos del Cliente que Recibe (Justo debajo del bloque de datos de la orden) */}
        <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800/60">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cliente Recibe:</p>
            <p className="text-sm font-bold text-white truncate">{order.recipientName}</p>
            <p className="text-xs text-slate-300 font-mono">{order.recipientPhone}</p>
          </div>
          {recipientWa && (
            <a
              href={recipientWa}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl border border-emerald-500/30 transition-all shrink-0 shadow-sm"
            >
              <span>WhatsApp Cliente</span>
            </a>
          )}
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

        {/* Addresses con Botones GPS Más Visibles */}
        <div className="space-y-2.5">
          {/* Pickup */}
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
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <span>GPS Recogida ↗</span>
              </a>
            </div>
            <p className="text-xs text-slate-300 font-medium leading-snug line-clamp-2">{order.pickupAddress}</p>
          </div>

          {/* Dropoff */}
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
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
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
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg whitespace-nowrap shadow-sm"
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

      {/* Action Buttons */}
      <div className="pt-2 mt-auto">
        {order.status === "DRAFT_SUBMITTED" && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleStatusChange("CANCELLED")}
              disabled={!!loadingAction}
              className="px-3 py-2.5 text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              Rechazar
            </button>
            <button
              onClick={() => handleStatusChange("CONFIRMED_PICKUP")}
              disabled={!!loadingAction}
              className="px-3 py-2.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-colors disabled:opacity-50 shadow-sm shadow-amber-500/10 cursor-pointer"
            >
              {loadingAction === "CONFIRMED_PICKUP" ? "Aceptando..." : "Aceptar Pedido"}
            </button>
          </div>
        )}

        {order.status === "CONFIRMED_PICKUP" && (
          <button
            onClick={() => handleStatusChange("IN_TRANSIT")}
            disabled={!!loadingAction}
            className="w-full px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            {loadingAction === "IN_TRANSIT" ? (
              "Actualizando..."
            ) : (
              <>
                <span>Ya Retir&eacute; &bull; Voy en Camino</span>
                <span className="text-[11px] opacity-80">(Avisar a Cliente)</span>
              </>
            )}
          </button>
        )}

        {order.status === "IN_TRANSIT" && (
          <button
            onClick={() => handleStatusChange("DELIVERED")}
            disabled={!!loadingAction}
            className="w-full px-4 py-2.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
          >
            {loadingAction === "DELIVERED" ? "Confirmando..." : "Marcar como Entregado"}
          </button>
        )}

        {order.status === "DELIVERED" && (
          <div className="text-center py-2.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            Pedido Entregado con &Eacute;xito (+{formatCurrency(effectiveFee)})
          </div>
        )}

        {order.status === "CANCELLED" && (
          <div className="text-center py-2.5 text-xs font-bold text-rose-400 bg-rose-500/10 rounded-xl border border-rose-500/20">
            Pedido Cancelado
          </div>
        )}
      </div>
    </div>
  );
}
