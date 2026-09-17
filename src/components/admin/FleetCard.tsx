"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bike,
  Phone,
  PhoneCall,
  Mail,
  Power,
  Navigation,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  Filter,
  Search,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  MapPin,
  MessageSquare,
  Package,
  Route,
  Pencil,
  Sparkles,
  Award,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { GeofenceService } from "@/services/geofence";

export interface Rider {
  id: string;
  phone: string;
  vehiclePlate: string;
  status: string; // IDLE, BUSY, OFFLINE
  isActive?: boolean;
  currentLat?: number | null;
  currentLng?: number | null;
  user: {
    name: string;
    email: string;
  };
  orders?: {
    id: string;
    status: string;
    totalCost?: number;
    distanceKm?: number;
  }[];
}

interface FleetCardProps {
  riders: Rider[];
  onStatusChange: (riderId: string, newStatus: string) => void;
  onOpenCreateRiderModal?: () => void;
  onEditRider?: (rider: Rider) => void;
  onToggleActive?: (riderId: string, currentActive: boolean) => Promise<void>;
  onDeleteRider?: (riderId: string) => Promise<void>;
}

/** Formatea número venezolano a formato internacional sin símbolos para WhatsApp */
function getWhatsAppUrl(phone: string, riderName: string): string {
  const digits = phone.replace(/\D/g, "");
  let cleanNumber = digits;
  if (digits.startsWith("04")) {
    cleanNumber = "58" + digits.slice(1);
  } else if (digits.length === 10 && digits.startsWith("4")) {
    cleanNumber = "58" + digits;
  }
  const greeting = encodeURIComponent(
    `Hola ${riderName}, te contacto desde la Torre de Control de Despachos DaaS Carabobo.`
  );
  return `https://wa.me/${cleanNumber}?text=${greeting}`;
}

/** Extrae las iniciales del nombre para el avatar */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function FleetCard({
  riders,
  onStatusChange,
  onOpenCreateRiderModal,
  onEditRider,
  onToggleActive,
  onDeleteRider,
}: FleetCardProps) {
  const [showInactive, setShowInactive] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [riderToDelete, setRiderToDelete] = useState<Rider | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Copiar al portapapeles con animación
  const handleCopyPhone = (riderId: string, phone: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(phone);
      } else {
        const input = document.createElement("input");
        input.value = phone;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      setCopiedId(riderId);
      setTimeout(() => setCopiedId(null), 2200);
    } catch (e) {
      console.error("Error copying to clipboard", e);
    }
  };

  // Filtrado compuesto
  const filteredRiders = riders.filter((r) => {
    if (!showInactive && r.isActive === false) return false;

    if (statusFilter !== "ALL") {
      if (statusFilter === "IDLE" && r.status !== "IDLE") return false;
      if (statusFilter === "BUSY" && r.status !== "BUSY") return false;
      if (statusFilter === "OFFLINE" && r.status !== "OFFLINE") return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.user.name.toLowerCase().includes(q);
      const matchPlate = r.vehiclePlate.toLowerCase().includes(q);
      const matchPhone = r.phone.toLowerCase().includes(q);
      const matchEmail = r.user.email.toLowerCase().includes(q);
      return matchName || matchPlate || matchPhone || matchEmail;
    }

    return true;
  });

  // Métricas agregadas de la flota
  const activeRiders = riders.filter((r) => r.isActive !== false);
  const idleCount = activeRiders.filter((r) => r.status === "IDLE").length;
  const busyCount = activeRiders.filter((r) => r.status === "BUSY").length;
  const offlineCount = activeRiders.filter((r) => r.status === "OFFLINE").length;
  const inactiveCount = riders.filter((r) => r.isActive === false).length;

  const handleConfirmDelete = async () => {
    if (!riderToDelete || !onDeleteRider) return;
    try {
      setIsDeleting(true);
      await onDeleteRider(riderToDelete.id);
      setRiderToDelete(null);
    } catch (err: any) {
      alert(`Error al eliminar repartidor: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="surface-card rounded-3xl p-6 border border-white/10 shadow-2xl space-y-6">
      {/* Encabezado Principal y Barra de Acciones */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500/20 to-cyan-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Flota de Repartidores & Despachadores
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-medium border border-white/10">
                  {riders.length} Registrados
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Directorio operativo con canales de contacto directo (WhatsApp, Llamada, Email), geolocalización en vivo y métricas de desempeño.
              </p>
            </div>
          </div>
        </div>

        {/* Badges de Estado Rápido y Botón Alta */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Badge variant="success" pulse={idleCount > 0} className="text-xs px-2.5 py-1">
            {idleCount} Disponibles
          </Badge>

          {busyCount > 0 && (
            <Badge variant="info" pulse={true} className="text-xs px-2.5 py-1">
              {busyCount} En Ruta
            </Badge>
          )}

          <Badge variant="outline" className="text-slate-400 border-white/10 text-xs px-2.5 py-1">
            {offlineCount} Fuera de Turno
          </Badge>

          {inactiveCount > 0 && (
            <Badge variant="outline" className="text-amber-400 border-amber-500/30 text-xs px-2.5 py-1">
              {inactiveCount} Ocultos
            </Badge>
          )}

          {onOpenCreateRiderModal && (
            <button
              onClick={onOpenCreateRiderModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-sky-400 to-cyan-400 hover:brightness-110 shadow-lg shadow-sky-500/20 transition-all cursor-pointer ml-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Repartidor</span>
            </button>
          )}
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-2xl border border-white/5">
        {/* Input de Búsqueda */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, placa, teléfono o correo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50 transition-colors"
          />
        </div>

        {/* Filtros de Estado y Toggle Inactivos */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                statusFilter === "ALL"
                  ? "bg-sky-500/20 text-sky-300 font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("IDLE")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                statusFilter === "IDLE"
                  ? "bg-emerald-500/20 text-emerald-300 font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Disponibles
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("BUSY")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                statusFilter === "BUSY"
                  ? "bg-sky-500/20 text-sky-300 font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              En Ruta
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("OFFLINE")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                statusFilter === "OFFLINE"
                  ? "bg-slate-800 text-slate-200 font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Offline
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowInactive(!showInactive)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              showInactive
                ? "bg-slate-900 text-slate-200 border-white/20"
                : "bg-slate-950 text-slate-500 border-white/5 hover:text-slate-300"
            }`}
          >
            <Filter className="w-3 h-3 text-sky-400" />
            <span>{showInactive ? "Mostrando Ocultos" : "Solo Activos"}</span>
          </button>
        </div>
      </div>

      {/* Grid de Cards de Repartidores */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <AnimatePresence>
          {filteredRiders.map((rider) => {
            const isActive = rider.isActive !== false;
            const isIdle = rider.status === "IDLE" && isActive;
            const isBusy = rider.status === "BUSY" && isActive;
            const isOffline = rider.status === "OFFLINE" || !isActive;

            // Cálculos de métricas del repartidor
            const totalOrders = rider.orders?.length || 0;
            const completedOrders =
              rider.orders?.filter((o) => o.status === "DELIVERED").length || 0;
            const inProgressOrders =
              rider.orders?.filter((o) =>
                ["ASSIGNED", "PICKING_UP", "IN_TRANSIT"].includes(o.status)
              ).length || 0;
            const totalKm =
              rider.orders?.reduce((acc, o) => acc + (o.distanceKm || 0), 0) || 0;

            // Detección de sector y municipio en vivo
            let locationLabel = "Base Carabobo";
            let municipalityBadge = "Valencia / Naguanagua / San Diego";
            let mapsUrl: string | null = null;

            if (rider.currentLat && rider.currentLng) {
              const cov = GeofenceService.checkLocationCoverage(rider.currentLat, rider.currentLng);
              if (cov.nearestSector) {
                locationLabel = cov.nearestSector;
              }
              if (cov.municipality) {
                municipalityBadge = cov.municipality;
              }
              mapsUrl = `https://www.google.com/maps?q=${rider.currentLat},${rider.currentLng}`;
            }

            const waUrl = getWhatsAppUrl(rider.phone, rider.user.name);
            const initials = getInitials(rider.user.name);

            return (
              <motion.div
                key={rider.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`relative rounded-3xl p-5 border transition-all flex flex-col justify-between overflow-hidden ${
                  !isActive
                    ? "bg-slate-950/40 border-amber-500/20 opacity-75 shadow-inner"
                    : isIdle
                    ? "bg-gradient-to-b from-slate-950/80 to-slate-950/95 border-emerald-500/30 shadow-xl shadow-emerald-500/5 hover:border-emerald-500/50"
                    : isBusy
                    ? "bg-gradient-to-b from-slate-950/80 to-slate-950/95 border-sky-500/35 shadow-xl shadow-sky-500/5 hover:border-sky-500/50"
                    : "bg-gradient-to-b from-slate-950/70 to-slate-950/90 border-white/10 hover:border-white/20 shadow-lg"
                }`}
              >
                {/* Indicador de acento superior */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${
                    !isActive
                      ? "bg-amber-500/40"
                      : isIdle
                      ? "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500"
                      : isBusy
                      ? "bg-gradient-to-r from-sky-500 via-cyan-400 to-sky-500"
                      : "bg-slate-700/50"
                  }`}
                />

                <div className="space-y-4">
                  {/* SECCIÓN 1: Identidad del Repartidor */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar con Anillo de Estado */}
                      <div className="relative">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base shadow-lg transition-transform ${
                            !isActive
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              : isIdle
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 ring-4 ring-emerald-500/10"
                              : isBusy
                              ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 ring-4 ring-sky-500/10"
                              : "bg-slate-800 text-slate-300 border border-white/10"
                          }`}
                        >
                          <span>{initials}</span>
                        </div>
                        {/* Dot indicador flotante */}
                        <div
                          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-950 flex items-center justify-center ${
                            !isActive
                              ? "bg-amber-500"
                              : isIdle
                              ? "bg-emerald-400"
                              : isBusy
                              ? "bg-sky-400"
                              : "bg-slate-600"
                          }`}
                        >
                          <Bike className="w-2.5 h-2.5 text-slate-950" />
                        </div>
                      </div>

                      {/* Nombre y Matrícula Vehicular */}
                      <div>
                        <h4 className="text-base font-bold text-white flex items-center gap-1.5 leading-tight">
                          <span>{rider.user.name}</span>
                          {isActive && isIdle && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          )}
                          {!isActive && (
                            <span className="text-[10px] font-bold text-amber-400 font-mono px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                              Oculto
                            </span>
                          )}
                        </h4>

                        {/* Chapa Vehicular Estilizada */}
                        <div className="mt-1 flex items-center gap-2">
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700/80 shadow-inner">
                            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-300">
                              🏍️ {rider.vehiclePlate}
                            </span>
                          </div>

                          <span className="text-[11px] text-slate-400 truncate max-w-[130px]" title={rider.user.email}>
                            {rider.user.email}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Badge de Disponibilidad */}
                    <div className="flex flex-col items-end gap-1">
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
                        className="text-xs py-1 px-2.5"
                      >
                        {!isActive
                          ? "Inactivo"
                          : isIdle
                          ? "Disponible"
                          : isBusy
                          ? "En Viaje"
                          : "Fuera de Turno"}
                      </Badge>
                      {inProgressOrders > 0 && (
                        <span className="text-[10px] text-sky-400 font-semibold animate-pulse">
                          {inProgressOrders} despacho en curso
                        </span>
                      )}
                    </div>
                  </div>

                  {/* SECCIÓN 2: Formas de Contacto Directo (Lo pedido por el usuario) */}
                  <div className="bg-slate-900/90 rounded-2xl p-3 border border-white/[0.08] space-y-2.5 shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-sky-400" />
                        Canales de Contacto Directo
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 font-semibold">
                        {rider.phone}
                      </span>
                    </div>

                    {/* Botones de Acción Directa */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {/* WhatsApp Directo */}
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm shadow-emerald-500/5 cursor-pointer"
                        title="Abrir chat en WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                        <span>WhatsApp</span>
                      </a>

                      {/* Llamada Directa */}
                      <a
                        href={`tel:${rider.phone}`}
                        className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm shadow-sky-500/5 cursor-pointer"
                        title={`Llamar a ${rider.phone}`}
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-sky-400" />
                        <span>Llamar</span>
                      </a>

                      {/* Correo Directo */}
                      <a
                        href={`mailto:${rider.user.email}?subject=${encodeURIComponent(
                          "Torre de Control DaaS Carabobo - Despacho"
                        )}`}
                        className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm shadow-indigo-500/5 cursor-pointer"
                        title={`Enviar email a ${rider.user.email}`}
                      >
                        <Mail className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Email</span>
                      </a>

                      {/* Copiar Número */}
                      <button
                        type="button"
                        onClick={() => handleCopyPhone(rider.id, rider.phone)}
                        className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer border ${
                          copiedId === rider.id
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : "bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 border-white/10"
                        }`}
                        title="Copiar teléfono al portapapeles"
                      >
                        {copiedId === rider.id ? (
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

                  {/* SECCIÓN 3: Ubicación y Zona Operativa */}
                  <div className="flex items-center justify-between text-xs px-1 text-slate-400">
                    <div className="flex items-center gap-1.5 truncate max-w-[210px]">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span className="truncate text-slate-300 font-medium">
                        {locationLabel}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-white/5">
                        {municipalityBadge}
                      </span>
                    </div>

                    {mapsUrl ? (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
                        title="Ver en Google Maps en tiempo real"
                      >
                        <Navigation className="w-3 h-3 text-cyan-400" />
                        <span>Ver GPS</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-500">
                        GPS No Fijado
                      </span>
                    )}
                  </div>

                  {/* SECCIÓN 4: Métricas Operativas Clave */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-center">
                    <div className="bg-slate-950/40 rounded-xl p-2 border border-white/5">
                      <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                        Despachos
                      </span>
                      <span className="text-sm font-bold text-white font-mono">
                        {totalOrders}
                      </span>
                    </div>

                    <div className="bg-slate-950/40 rounded-xl p-2 border border-white/5">
                      <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                        Completados
                      </span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">
                        {completedOrders}
                      </span>
                    </div>

                    <div className="bg-slate-950/40 rounded-xl p-2 border border-white/5">
                      <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                        Km Ruta
                      </span>
                      <span className="text-sm font-bold text-sky-400 font-mono">
                        {totalKm.toFixed(1)} km
                      </span>
                    </div>
                  </div>
                </div>

                {/* SECCIÓN 5: Controles de Turno y Administración */}
                <div className="pt-3 mt-3 border-t border-white/[0.08] flex items-center justify-between gap-2">
                  {/* Botón de Conectar / Desconectar Turno */}
                  <div>
                    {isActive && !isBusy ? (
                      <button
                        onClick={() =>
                          onStatusChange(
                            rider.id,
                            isOffline ? "IDLE" : "OFFLINE"
                          )
                        }
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                          isOffline
                            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20"
                            : "text-slate-300 bg-slate-800/80 border-white/10 hover:bg-white/10 hover:text-white"
                        }`}
                        title={
                          isOffline
                            ? "Conectar a turno (Marcar como disponible)"
                            : "Cerrar turno (Marcar como offline)"
                        }
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{isOffline ? "Conectar Turno" : "Cerrar Turno"}</span>
                      </button>
                    ) : isBusy ? (
                      <span className="text-xs font-semibold text-sky-400 flex items-center gap-1.5">
                        <Route className="w-3.5 h-3.5 animate-spin" />
                        Despachando
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 italic">Desactivado</span>
                    )}
                  </div>

                  {/* Acciones Secundarias: Editar / Ocultar / Eliminar */}
                  <div className="flex items-center gap-1.5">
                    {/* Botón Editar Información */}
                    {onEditRider && (
                      <button
                        type="button"
                        onClick={() => onEditRider(rider)}
                        title="Editar información del repartidor"
                        className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 hover:bg-cyan-500/10 transition-all cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}

                    {/* Botón Ocultar / Reactivar */}
                    {onToggleActive && (
                      <button
                        type="button"
                        onClick={() => onToggleActive(rider.id, isActive)}
                        title={
                          isActive
                            ? "Ocultar repartidor de la flota activa"
                            : "Reactivar repartidor en la flota"
                        }
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                          isActive
                            ? "text-slate-400 border-white/10 hover:text-amber-300 hover:border-amber-500/40 hover:bg-amber-500/10"
                            : "text-amber-400 border-amber-500/30 bg-amber-500/10 hover:text-emerald-300 hover:border-emerald-500/40"
                        }`}
                      >
                        {isActive ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    )}

                    {/* Botón Eliminar */}
                    {onDeleteRider && (
                      <button
                        type="button"
                        onClick={() => setRiderToDelete(rider)}
                        title="Eliminar repartidor del sistema"
                        className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredRiders.length === 0 && (
          <div className="col-span-full py-12 text-center text-xs text-slate-500 surface-card rounded-2xl border border-white/5 space-y-2">
            <Bike className="w-8 h-8 text-slate-600 mx-auto opacity-50" />
            <p className="font-semibold text-slate-400">
              No se encontraron repartidores que coincidan con los filtros aplicados.
            </p>
            <p className="text-[11px] text-slate-500">
              Intenta cambiar los términos de búsqueda o activar la opción de &quot;Mostrando Ocultos&quot;.
            </p>
          </div>
        )}
      </div>

      {/* Modal de Confirmación de Eliminación */}
      <DeleteConfirmModal
        isOpen={Boolean(riderToDelete)}
        onClose={() => setRiderToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Repartidor"
        itemName={
          riderToDelete
            ? `${riderToDelete.user.name} (${riderToDelete.vehiclePlate})`
            : ""
        }
        itemType="repartidor"
        isLoading={isDeleting}
      />
    </div>
  );
}
