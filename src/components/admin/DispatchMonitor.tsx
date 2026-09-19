"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StatusBadge } from "../shared/StatusBadge";
import {
  ShieldAlert,
  Bike,
  Clock,
  MapPin,
  UserCheck,
  CheckCircle2,
  Sparkles,
  Search,
  Filter,
  ExternalLink,
  MessageCircle,
  Copy,
  Check,
  X,
} from "lucide-react";
import { getGoogleMapsSearchUrl } from "@/lib/maps";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

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
  packageNotes?: string;
  distanceKm: number;
  totalCost: number;
  status: string;
  createdAt: string;
  merchant: {
    businessName: string;
    address: string;
    phone: string;
  };
  rider?: {
    id: string;
    vehiclePlate: string;
    phone: string;
    user: {
      name: string;
    };
  } | null;
}

interface Rider {
  id: string;
  phone: string;
  vehiclePlate: string;
  status: string;
  user: {
    name: string;
  };
}

interface DispatchMonitorProps {
  orders: Order[];
  riders: Rider[];
  onAssignRider: (orderId: string, riderId: string) => Promise<any>;
  isLoading: boolean;
}

interface WhatsAppModalState {
  orderNumber: string;
  riderName: string;
  riderPhone: string;
  whatsappUrl: string;
  message: string;
}

export function DispatchMonitor({
  orders,
  riders,
  onAssignRider,
  isLoading,
}: DispatchMonitorProps) {
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRiders, setSelectedRiders] = useState<Record<string, string>>({});
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [whatsAppModal, setWhatsAppModal] = useState<WhatsAppModalState | null>(null);
  const [copied, setCopied] = useState(false);

  const availableRiders = riders.filter((r) => r.status === "IDLE");

  // Filtros
  const filteredOrders = orders.filter((o) => {
    if (filterStatus === "PENDING" && o.status !== "PENDING") return false;
    if (
      filterStatus === "ACTIVE" &&
      !["ASSIGNED", "PICKING_UP", "IN_TRANSIT"].includes(o.status)
    )
      return false;
    if (filterStatus === "DELIVERED" && o.status !== "DELIVERED") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.merchant.businessName.toLowerCase().includes(q) ||
        o.recipientName.toLowerCase().includes(q) ||
        o.dropoffAddress.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // KPIs
  const totalCount = orders.length;
  const pendingCount = orders.filter((o) => o.status === "PENDING").length;
  const inTransitCount = orders.filter((o) =>
    ["ASSIGNED", "PICKING_UP", "IN_TRANSIT"].includes(o.status)
  ).length;
  const deliveredCount = orders.filter((o) => o.status === "DELIVERED").length;

  const handleAssign = async (orderId: string) => {
    const riderId = selectedRiders[orderId] || availableRiders[0]?.id;
    if (!riderId) {
      alert("No hay repartidores disponibles para asignar.");
      return;
    }
    try {
      setAssigningId(orderId);
      const res = await onAssignRider(orderId, riderId);
      if (res && res.whatsappNotification) {
        setWhatsAppModal({
          orderNumber: res.order.orderNumber,
          riderName: res.order.rider?.user?.name || "Repartidor",
          riderPhone: res.whatsappNotification.phone,
          whatsappUrl: res.whatsappNotification.whatsappUrl,
          message: res.whatsappNotification.message,
        });
      }
    } finally {
      setAssigningId(null);
    }
  };

  const handleAutoAssign = async (orderId: string) => {
    if (availableRiders.length === 0) {
      alert("No hay ningún repartidor en estado LIBRE.");
      return;
    }
    const bestRider = availableRiders[0];
    try {
      setAssigningId(orderId);
      const res = await onAssignRider(orderId, bestRider.id);
      if (res && res.whatsappNotification) {
        setWhatsAppModal({
          orderNumber: res.order.orderNumber,
          riderName: res.order.rider?.user?.name || "Repartidor",
          riderPhone: res.whatsappNotification.phone,
          whatsappUrl: res.whatsappNotification.whatsappUrl,
          message: res.whatsappNotification.message,
        });
      }
    } finally {
      setAssigningId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="surface-card p-5 rounded-2xl border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-slate-700" />
          <span className="text-xs font-semibold text-slate-400">
            Total Órdenes
          </span>
          <div className="text-3xl font-black text-white mt-1 tabular-nums">
            {totalCount}
          </div>
          <span className="text-[11px] text-slate-500">Registradas hoy</span>
        </div>

        <div className="surface-card p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-amber-400" />
          <span className="text-xs font-semibold text-amber-400 flex items-center justify-between">
            <span>Por Asignar</span>
            {pendingCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </span>
          <div className="text-3xl font-black text-amber-300 mt-1 tabular-nums">
            {pendingCount}
          </div>
          <span className="text-[11px] text-amber-400/80">Requieren despacho</span>
        </div>

        <div className="surface-card p-5 rounded-2xl border border-sky-500/30 bg-sky-500/5 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-sky-400" />
          <span className="text-xs font-semibold text-sky-400">
            En Tránsito
          </span>
          <div className="text-3xl font-black text-sky-300 mt-1 tabular-nums">
            {inTransitCount}
          </div>
          <span className="text-[11px] text-sky-400/80">Riders en calle</span>
        </div>

        <div className="surface-card p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-emerald-400" />
          <span className="text-xs font-semibold text-emerald-400">
            Entregas Exitosas
          </span>
          <div className="text-3xl font-black text-emerald-300 mt-1 tabular-nums">
            {deliveredCount}
          </div>
          <span className="text-[11px] text-emerald-400/80">Completadas hoy</span>
        </div>
      </div>

      {/* Modal / Alerta de Notificación por WhatsApp con Framer Motion */}
      <AnimatePresence>
        {whatsAppModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="surface-card max-w-lg w-full rounded-3xl p-6 sm:p-7 border border-emerald-500/40 shadow-2xl space-y-4 relative"
            >
              <button
                onClick={() => setWhatsAppModal(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
                  <MessageCircle className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <Badge variant="success" pulse className="mb-1">
                    WhatsApp Automático
                  </Badge>
                  <h3 className="text-lg font-bold text-white">
                    Despacho {whatsAppModal.orderNumber} Asignado
                  </h3>
                  <p className="text-xs text-slate-400">
                    Notifica a <b>{whatsAppModal.riderName}</b> ({whatsAppModal.riderPhone}) con los datos del comercio, cliente y enlaces a Google Maps.
                  </p>
                </div>
              </div>

              {/* Vista previa del mensaje */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 text-xs font-mono text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                {whatsAppModal.message}
              </div>

              {/* Acciones */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(whatsAppModal.message)}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copiado al portapapeles</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copiar Texto</span>
                    </>
                  )}
                </Button>

                <a
                  href={whatsAppModal.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setWhatsAppModal(null)}
                >
                  <Button variant="primary" size="sm">
                    <MessageCircle className="w-4 h-4 fill-current" />
                    <span>Enviar WhatsApp a {whatsAppModal.riderName}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Monitor de Despacho Table */}
      <div className="surface-card rounded-3xl p-6 sm:p-7 border border-white/10 shadow-2xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-400" />
              Matriz Operativa de Despacho
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Control centralizado, enlaces a Google Maps y notificación automática por WhatsApp.
            </p>
          </div>

          {/* Filtros de estado con Framer Motion Sliding Indicator */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-950/80 border border-white/[0.08]">
            {[
              { key: "ALL", label: "Todas" },
              { key: "PENDING", label: `Pendientes (${pendingCount})` },
              { key: "ACTIVE", label: `En Curso (${inTransitCount})` },
              { key: "DELIVERED", label: `Entregadas (${deliveredCount})` },
            ].map((tab) => {
              const isActive = filterStatus === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilterStatus(tab.key)}
                  className={`relative px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors duration-200 cursor-pointer ${
                    isActive ? "text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="admin-active-tab-indicator"
                      className="absolute inset-0 bg-indigo-600 rounded-xl shadow-md shadow-indigo-500/25"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Buscador */}
        <div className="relative">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por número de orden, comercio, cliente o dirección..."
            icon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        {/* Tabla de Órdenes */}
        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-left text-xs min-w-[760px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                <th className="py-3 pl-3 whitespace-nowrap">Orden</th>
                <th className="py-3 whitespace-nowrap">Comercio (Retiro)</th>
                <th className="py-3 whitespace-nowrap">Destino (Google Maps)</th>
                <th className="py-3 whitespace-nowrap">Distancia / Tarifa</th>
                <th className="py-3 whitespace-nowrap">Estado</th>
                <th className="py-3 pr-3 text-right whitespace-nowrap">Repartidor & WhatsApp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Cargando despachos...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-slate-400">
                    No se encontraron órdenes para este filtro.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isPending = order.status === "PENDING";
                  const selectedRiderId =
                    selectedRiders[order.id] || availableRiders[0]?.id || "";

                  const dropoffMapsUrl = getGoogleMapsSearchUrl(
                    order.dropoffLat,
                    order.dropoffLng,
                    order.dropoffAddress
                  );
                  const pickupMapsUrl = getGoogleMapsSearchUrl(
                    order.pickupLat,
                    order.pickupLng,
                    order.pickupAddress
                  );

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="py-3.5 pl-2 font-mono font-bold text-emerald-400">
                        {order.orderNumber}
                      </td>

                      <td className="py-3.5">
                        <div className="font-semibold text-white">
                          {order.merchant.businessName}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px] flex items-center gap-1">
                          <a
                            href={pickupMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-emerald-400 hover:underline flex items-center gap-1"
                            title="Ver comercio en Google Maps"
                          >
                            <span className="truncate">{order.merchant.address}</span>
                            <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                          </a>
                        </div>
                      </td>

                      <td className="py-3.5">
                        <div className="font-medium text-slate-200">
                          {order.recipientName} ({order.recipientPhone})
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[200px] flex items-center gap-1">
                          <a
                            href={dropoffMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 hover:underline font-semibold flex items-center gap-1 transition-colors"
                            title="Abrir destino en Google Maps"
                          >
                            <MapPin className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                            <span className="truncate">{order.dropoffAddress}</span>
                            <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                          </a>
                        </div>
                      </td>

                      <td className="py-3.5">
                        <div className="font-bold text-white tabular-nums">
                          ${order.totalCost.toFixed(2)}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {order.distanceKm} km
                        </div>
                      </td>

                      <td className="py-3.5">
                        <StatusBadge status={order.status} />
                      </td>

                      <td className="py-3.5 pr-2 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-2">
                            <select
                              value={selectedRiderId}
                              onChange={(e) =>
                                setSelectedRiders({
                                  ...selectedRiders,
                                  [order.id]: e.target.value,
                                })
                              }
                              className="bg-slate-900 border border-white/15 text-white text-xs rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-400 focus:outline-none max-w-[150px] cursor-pointer"
                            >
                              {availableRiders.length === 0 ? (
                                <option value="">Sin riders libres</option>
                              ) : (
                                availableRiders.map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.user.name} ({r.vehiclePlate})
                                  </option>
                                ))
                              )}
                            </select>

                            <button
                              id={`btn-assign-${order.id}`}
                              onClick={() => handleAssign(order.id)}
                              disabled={
                                availableRiders.length === 0 ||
                                assigningId === order.id
                              }
                              className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              {assigningId === order.id
                                ? "Asignando..."
                                : "Asignar"}
                            </button>

                            <button
                              title="Auto-asignar rider libre"
                              onClick={() => handleAutoAssign(order.id)}
                              disabled={
                                availableRiders.length === 0 ||
                                assigningId === order.id
                              }
                              className="p-1.5 rounded-xl text-amber-400 hover:bg-amber-500/10 border border-amber-500/20 disabled:opacity-40 cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : order.rider ? (
                          <div className="flex items-center justify-end gap-2">
                            <div className="text-right">
                              <div className="font-semibold text-white flex items-center justify-end gap-1.5">
                                <span>{order.rider.user.name}</span>
                              </div>
                              <div className="text-[11px] font-mono text-slate-400">
                                {order.rider.phone} • {order.rider.vehiclePlate}
                              </div>
                            </div>

                            <a
                              href={`https://wa.me/${order.rider.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hola ${order.rider.user.name}, consulta operativa sobre despacho ${order.orderNumber}: Retiro en ${order.merchant.businessName}, Entrega en ${order.dropoffAddress} (${dropoffMapsUrl})`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-colors flex items-center gap-1"
                              title="Enviar mensaje por WhatsApp al Repartidor"
                            >
                              <MessageCircle className="w-4 h-4 fill-current" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">
                            Sin asignar
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
