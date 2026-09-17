"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Bike,
  Phone,
  PhoneCall,
  Mail,
  MessageSquare,
  Power,
  Copy,
  Check,
  ExternalLink,
  MapPin,
  Package,
  PackageCheck,
  DollarSign,
  Route,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Calendar,
  Navigation,
  Send,
} from "lucide-react";
import { GeofenceService } from "@/services/geofence";
import { getGoogleMapsSearchUrl, getGoogleMapsNavigationUrl } from "@/lib/maps";

export interface OrderItem {
  id: string;
  orderNumber: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  dropoffMapUrl?: string | null;
  recipientName: string;
  recipientPhone: string;
  packageNotes?: string | null;
  distanceKm: number;
  totalCost: number;
  status: string;
  riderId?: string | null;
  createdAt: string;
  deliveredAt?: string | null;
  merchant: {
    businessName: string;
    address: string;
    phone: string;
  };
}

export interface RiderProfile {
  id: string;
  phone: string;
  vehiclePlate: string;
  status: string; // IDLE, BUSY, OFFLINE
  isActive?: boolean;
  currentLat?: number | null;
  currentLng?: number | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface RiderRecordCardProps {
  rider: RiderProfile;
  orders: OrderItem[];
  onUpdateOrderStatus: (orderId: string, nextStatus: string) => Promise<void>;
  onToggleStatus: (riderId: string, currentStatus: string) => Promise<void>;
}

/** Formatea número venezolano a formato internacional para WhatsApp */
function getWhatsAppUrl(phone: string, riderName: string): string {
  const digits = phone.replace(/\D/g, "");
  let cleanNumber = digits;
  if (digits.startsWith("04")) {
    cleanNumber = "58" + digits.slice(1);
  } else if (digits.length === 10 && digits.startsWith("4")) {
    cleanNumber = "58" + digits;
  }
  const text = encodeURIComponent(
    `Hola ${riderName}, te contacto respecto a tus despachos en DaaS Carabobo.`
  );
  return `https://wa.me/${cleanNumber}?text=${text}`;
}

/** Extrae las iniciales del nombre */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function RiderRecordCard({
  rider,
  orders,
  onUpdateOrderStatus,
  onToggleStatus,
}: RiderRecordCardProps) {
  const [showAllDispatches, setShowAllDispatches] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const isActive = rider.isActive !== false;
  const isIdle = rider.status === "IDLE" && isActive;
  const isBusy = rider.status === "BUSY" && isActive;
  const isOffline = rider.status === "OFFLINE" || !isActive;

  // Clasificación de órdenes
  const activeOrder = orders.find((o) =>
    ["ASSIGNED", "PICKING_UP", "IN_TRANSIT"].includes(o.status)
  );
  const deliveredOrders = orders.filter((o) => o.status === "DELIVERED");
  const cancelledOrders = orders.filter((o) => o.status === "CANCELLED");

  // Métricas financieras y de distancia (80% al repartidor)
  const totalEarnings = deliveredOrders.reduce(
    (sum, o) => sum + o.totalCost * 0.8,
    0
  );
  const totalKm = orders.reduce((sum, o) => sum + (o.distanceKm || 0), 0);

  // Ubicación y geocerca
  let sectorLabel = "Base Operativa Carabobo";
  let municipalityLabel = "Valencia / Naguanagua / San Diego";
  let gpsMapUrl: string | null = null;

  if (rider.currentLat && rider.currentLng) {
    const cov = GeofenceService.checkLocationCoverage(
      rider.currentLat,
      rider.currentLng
    );
    if (cov.nearestSector) sectorLabel = cov.nearestSector;
    if (cov.municipality) municipalityLabel = cov.municipality;
    gpsMapUrl = `https://www.google.com/maps?q=${rider.currentLat},${rider.currentLng}`;
  }

  // Copiar teléfono
  const handleCopyPhone = () => {
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(rider.phone);
      } else {
        const input = document.createElement("input");
        input.value = rider.phone;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  // Próxima acción para despacho activo
  const getActiveOrderNextAction = () => {
    if (!activeOrder) return null;
    if (activeOrder.status === "ASSIGNED") {
      return {
        nextStatus: "PICKING_UP",
        label: "Llegué al Comercio (Retirar)",
        icon: Package,
        color: "bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/25",
        hint: "Avisar que estás en el local",
      };
    }
    if (activeOrder.status === "PICKING_UP") {
      return {
        nextStatus: "IN_TRANSIT",
        label: "Confirmar Retiro (En Camino)",
        icon: Bike,
        color: "bg-sky-500 hover:bg-sky-600 text-white shadow-sky-500/25",
        hint: "Paquete en mano, ruta al cliente",
      };
    }
    if (activeOrder.status === "IN_TRANSIT") {
      return {
        nextStatus: "DELIVERED",
        label: "Confirmar Entrega al Cliente",
        icon: CheckCircle2,
        color: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30",
        hint: "Finalizar despacho y cobrar tarifa",
      };
    }
    return null;
  };

  const nextAction = getActiveOrderNextAction();

  const handleExecuteNextAction = async () => {
    if (!activeOrder || !nextAction) return;
    try {
      setIsUpdatingStatus(true);
      await onUpdateOrderStatus(activeOrder.id, nextAction.nextStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const displayedOrders = showAllDispatches ? orders : orders.slice(0, 3);
  const waUrl = getWhatsAppUrl(rider.phone, rider.user.name);
  const initials = getInitials(rider.user.name);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={`surface-card rounded-3xl p-6 border transition-all flex flex-col justify-between relative overflow-hidden shadow-2xl ${
        !isActive
          ? "bg-slate-950/40 border-amber-500/20 opacity-80"
          : isIdle
          ? "border-emerald-500/35 shadow-emerald-500/5 hover:border-emerald-500/50"
          : isBusy
          ? "border-sky-500/40 shadow-sky-500/5 hover:border-sky-500/60"
          : "border-white/10 hover:border-white/20"
      }`}
    >
      {/* Acento de luz superior */}
      <div
        className={`absolute top-0 left-0 right-0 h-1.5 ${
          !isActive
            ? "bg-amber-500/40"
            : isIdle
            ? "bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500"
            : isBusy
            ? "bg-gradient-to-r from-sky-400 via-cyan-300 to-sky-500"
            : "bg-slate-700/60"
        }`}
      />

      <div className="space-y-5">
        {/* ENCABEZADO: Identidad del Repartidor */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            {/* Avatar con halo de estado */}
            <div className="relative">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg shadow-xl transition-all ${
                  !isActive
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    : isIdle
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 ring-4 ring-emerald-500/10"
                    : isBusy
                    ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 ring-4 ring-sky-500/10"
                    : "bg-slate-800 text-slate-400 border border-white/10"
                }`}
              >
                <span>{initials}</span>
              </div>
              <div
                className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-950 flex items-center justify-center ${
                  !isActive
                    ? "bg-amber-500"
                    : isIdle
                    ? "bg-emerald-400"
                    : isBusy
                    ? "bg-sky-400 animate-pulse"
                    : "bg-slate-600"
                }`}
              >
                <Bike className="w-3 h-3 text-slate-950" />
              </div>
            </div>

            {/* Datos Personales & Placa */}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white leading-snug">
                  {rider.user.name}
                </h3>
                {isActive && isIdle && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                )}
                {!isActive && (
                  <span className="text-[10px] font-bold text-amber-400 font-mono px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                    Oculto
                  </span>
                )}
              </div>

              {/* Chapa Vehicular */}
              <div className="flex items-center gap-2 mt-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-700/80 shadow-inner">
                  <span className="text-[11px] uppercase font-mono font-black tracking-widest text-slate-200">
                    🏍️ {rider.vehiclePlate}
                  </span>
                </div>
                <span className="text-xs text-slate-400 truncate max-w-[140px]" title={rider.user.email}>
                  {rider.user.email}
                </span>
              </div>
            </div>
          </div>

          {/* Badge de Disponibilidad & Botón Conexión */}
          <div className="flex flex-col items-end gap-1.5">
            <Badge
              variant={
                !isActive
                  ? "outline"
                  : isIdle
                  ? "success"
                  : isBusy
                  ? "info"
                  : "default"
              }
              pulse={isActive && (isIdle || isBusy)}
              className="text-xs py-1 px-3"
            >
              {!isActive
                ? "Inactivo"
                : isIdle
                ? "Disponible"
                : isBusy
                ? "En Despacho"
                : "Fuera de Turno"}
            </Badge>

            {isActive && !isBusy && (
              <button
                onClick={() => onToggleStatus(rider.id, rider.status)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                  isOffline
                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20"
                    : "text-slate-400 bg-slate-900 border-white/10 hover:text-white"
                }`}
                title={isOffline ? "Conectar a turno disponible" : "Cerrar turno"}
              >
                <Power className="w-3 h-3" />
                <span>{isOffline ? "Conectar" : "Desconectar"}</span>
              </button>
            )}
          </div>
        </div>

        {/* CANALES DE CONTACTO DIRECTO */}
        <div className="bg-slate-950/80 rounded-2xl p-3 border border-white/[0.08] space-y-2.5 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-sky-400" />
              Contacto Directo
            </span>
            <span className="text-[11px] font-mono text-slate-300 font-bold">
              {rider.phone}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {/* WhatsApp */}
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm shadow-emerald-500/5 cursor-pointer"
              title="Abrir chat en WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp</span>
            </a>

            {/* Llamada */}
            <a
              href={`tel:${rider.phone}`}
              className="flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-xs font-bold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm shadow-sky-500/5 cursor-pointer"
              title={`Llamar a ${rider.phone}`}
            >
              <PhoneCall className="w-3.5 h-3.5 text-sky-400" />
              <span>Llamar</span>
            </a>

            {/* Correo */}
            <a
              href={`mailto:${rider.user.email}?subject=Notificación DaaS Repartidor`}
              className="flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-xs font-bold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm shadow-indigo-500/5 cursor-pointer"
              title={`Enviar correo a ${rider.user.email}`}
            >
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
              <span>Email</span>
            </a>

            {/* Copiar */}
            <button
              type="button"
              onClick={handleCopyPhone}
              className={`flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer border ${
                copied
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-slate-900 text-slate-300 hover:text-white border-white/10"
              }`}
              title="Copiar número"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* UBICACIÓN & ZONA OPERATIVA */}
        <div className="flex items-center justify-between text-xs px-1 text-slate-400">
          <div className="flex items-center gap-1.5 truncate max-w-[240px]">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="truncate text-slate-300 font-semibold">
              {sectorLabel}
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-white/10">
              {municipalityLabel}
            </span>
          </div>

          {gpsMapUrl ? (
            <a
              href={gpsMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
              title="Ver en Google Maps en tiempo real"
            >
              <Navigation className="w-3 h-3 text-cyan-400" />
              <span>Ver GPS</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          ) : (
            <span className="text-[11px] font-mono text-slate-500">
              GPS Standby
            </span>
          )}
        </div>

        {/* MÉTRICAS DE RENDIMIENTO (KPI CHIPS) */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/5 text-center">
          {/* Ganancias Acumuladas (80%) */}
          <div className="bg-slate-900/90 rounded-2xl p-2.5 border border-emerald-500/20">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">
              Ganancia (80%)
            </span>
            <span className="text-sm font-black text-emerald-400 font-mono">
              ${totalEarnings.toFixed(2)}
            </span>
          </div>

          {/* Despachos Completados */}
          <div className="bg-slate-900/90 rounded-2xl p-2.5 border border-white/5">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">
              Entregados
            </span>
            <span className="text-sm font-black text-white font-mono">
              {deliveredOrders.length}
            </span>
          </div>

          {/* En Ruta Activa */}
          <div className="bg-slate-900/90 rounded-2xl p-2.5 border border-white/5">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">
              En Curso
            </span>
            <span className={`text-sm font-black font-mono ${activeOrder ? "text-sky-400 animate-pulse" : "text-slate-500"}`}>
              {activeOrder ? "1" : "0"}
            </span>
          </div>

          {/* Km Recorridos */}
          <div className="bg-slate-900/90 rounded-2xl p-2.5 border border-white/5">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">
              Km Ruta
            </span>
            <span className="text-sm font-black text-sky-400 font-mono">
              {totalKm.toFixed(1)}
            </span>
          </div>
        </div>

        {/* DESPACHO ACTIVO EN CURSO (SI EXISTE) */}
        {activeOrder && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-950/70 via-slate-900/90 to-indigo-950/70 border border-sky-500/40 shadow-xl space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                <Route className="w-4 h-4 text-sky-400 animate-spin" />
                Despacho Activo en Curso
              </span>
              <Badge variant="info" pulse className="font-mono text-[10px]">
                {activeOrder.orderNumber}
              </Badge>
            </div>

            {/* Rutas: Retiro y Entrega */}
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1 flex-shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Retiro: {activeOrder.merchant.businessName}
                  </span>
                  <span className="text-white font-medium">
                    {activeOrder.pickupAddress}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-sky-400 mt-1 flex-shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Entrega a: {activeOrder.recipientName} ({activeOrder.recipientPhone})
                  </span>
                  <span className="text-white font-medium">
                    {activeOrder.dropoffAddress}
                  </span>
                </div>
              </div>
            </div>

            {/* Metadatos y Ganancia de la Orden */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
              <span className="text-slate-400 font-mono">
                Ruta: <b className="text-white">{activeOrder.distanceKm} km</b>
              </span>
              <span className="text-emerald-400 font-mono font-bold">
                Ganancia: +${(activeOrder.totalCost * 0.8).toFixed(2)}
              </span>
            </div>

            {/* Botón de Actualización de Estado en 1 Clic */}
            {nextAction && (
              <button
                type="button"
                onClick={handleExecuteNextAction}
                disabled={isUpdatingStatus}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${nextAction.color} disabled:opacity-50`}
              >
                <nextAction.icon className="w-4 h-4" />
                <span>{isUpdatingStatus ? "Actualizando..." : nextAction.label}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* TODO SU RÉCORD DE DESPACHOS */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              Récord Histórico de Despachos
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-white/10 text-slate-400 font-mono">
                {orders.length} totales
              </span>
            </h4>

            {orders.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllDispatches(!showAllDispatches)}
                className="text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>{showAllDispatches ? "Ver menos" : `Ver todos (${orders.length})`}</span>
                {showAllDispatches ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>

          {/* Lista de Despachos del Récord */}
          {displayedOrders.length > 0 ? (
            <div className="space-y-2">
              {displayedOrders.map((order) => {
                const isDelivered = order.status === "DELIVERED";
                const isOrderActive = ["ASSIGNED", "PICKING_UP", "IN_TRANSIT"].includes(order.status);
                const isCancelled = order.status === "CANCELLED";
                const feeEarned = (order.totalCost * 0.8).toFixed(2);
                const orderDate = new Date(order.createdAt).toLocaleDateString("es-VE", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const mapsUrl = getGoogleMapsSearchUrl(order.dropoffLat, order.dropoffLng);

                return (
                  <div
                    key={order.id}
                    className={`p-3 rounded-2xl border transition-all text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                      isDelivered
                        ? "bg-slate-950/60 border-white/5 hover:border-emerald-500/30"
                        : isOrderActive
                        ? "bg-sky-950/30 border-sky-500/30"
                        : "bg-slate-950/40 border-white/5 opacity-70"
                    }`}
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-white">
                          {order.orderNumber}
                        </span>
                        <Badge
                          variant={
                            isDelivered
                              ? "success"
                              : isOrderActive
                              ? "info"
                              : isCancelled
                              ? "destructive"
                              : "default"
                          }
                          className="text-[10px] py-0 px-1.5"
                        >
                          {isDelivered
                            ? "Entregado"
                            : isOrderActive
                            ? "En Ruta"
                            : isCancelled
                            ? "Cancelado"
                            : order.status}
                        </Badge>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {orderDate}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-300 truncate">
                        <span className="text-slate-500">De:</span> {order.merchant.businessName}
                        <span className="mx-1 text-slate-600">➔</span>
                        <span className="text-slate-500">A:</span> {order.dropoffAddress}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-white/5">
                      <div className="text-right">
                        <span className="text-xs font-black font-mono text-emerald-400 block">
                          +${feeEarned}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {order.distanceKm} km
                        </span>
                      </div>

                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-slate-900 border border-white/10 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
                        title="Ver destino en Google Maps"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-950/40 border border-white/5 text-center text-xs text-slate-500 space-y-1.5">
              <PackageCheck className="w-6 h-6 text-slate-600 mx-auto" />
              <p className="font-semibold text-slate-400">
                Sin despachos registrados en el historial
              </p>
              <p className="text-[11px] text-slate-500">
                Las órdenes asignadas y completadas por este repartidor se reflejarán aquí.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
