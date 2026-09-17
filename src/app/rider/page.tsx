"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiderRecordCard,
  RiderProfile,
  OrderItem,
} from "@/components/rider/RiderRecordCard";
import { Badge } from "@/components/ui/badge";
import {
  Bike,
  Search,
  Filter,
  PackageCheck,
  DollarSign,
  Route,
  Sparkles,
  Layers,
  RefreshCw,
} from "lucide-react";

export default function RiderPage() {
  const [riders, setRiders] = useState<RiderProfile[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [ordersFilter, setOrdersFilter] = useState<string>("ALL");

  // Cargar datos consolidados
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [ridersRes, ordersRes] = await Promise.all([
        fetch("/api/riders?includeInactive=true"),
        fetch("/api/orders"),
      ]);

      const ridersData = await ridersRes.json();
      const ordersData = await ordersRes.json();

      if (ridersData.ok && ridersData.riders) {
        setRiders(ridersData.riders);
      }
      if (ordersData.ok && ordersData.orders) {
        setOrders(ordersData.orders);
      }
    } catch (err) {
      console.error("Error al cargar datos de repartidores:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Suscripción SSE en tiempo real
  useEffect(() => {
    const es = new EventSource("/api/events");

    es.addEventListener("order:status_updated", () => loadData());
    es.addEventListener("order:assigned", () => loadData());
    es.addEventListener("order:created", () => loadData());
    es.addEventListener("rider:updated", () => loadData());
    es.addEventListener("rider:created", () => loadData());

    return () => {
      es.close();
    };
  }, [loadData]);

  // Actualizar estado de orden (1 clic)
  const handleUpdateOrderStatus = async (
    orderId: string,
    nextStatus: string
  ) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo actualizar el despacho");
      }

      await loadData();
    } catch (err: any) {
      alert(`Error al actualizar estado: ${err.message}`);
    }
  };

  // Alternar turno del repartidor (IDLE vs OFFLINE)
  const handleToggleStatus = async (
    riderId: string,
    currentStatus: string
  ) => {
    const newStatus = currentStatus === "OFFLINE" ? "IDLE" : "OFFLINE";
    try {
      const res = await fetch("/api/riders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riderId, status: newStatus }),
      });

      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error("Error al cambiar estado:", err);
    }
  };

  // Métricas agregadas de la flota
  const activeRiders = riders.filter((r) => r.isActive !== false);
  const idleRiders = activeRiders.filter((r) => r.status === "IDLE");
  const busyRiders = activeRiders.filter((r) => r.status === "BUSY");
  const offlineRiders = activeRiders.filter((r) => r.status === "OFFLINE");
  const deliveredOrders = orders.filter((o) => o.status === "DELIVERED");
  const totalFleetEarnings = deliveredOrders.reduce(
    (acc, o) => acc + o.totalCost * 0.8,
    0
  );

  // Filtrado de repartidores
  const filteredRiders = riders.filter((rider) => {
    // Filtro de estado
    if (statusFilter !== "ALL") {
      if (statusFilter === "IDLE" && (rider.status !== "IDLE" || rider.isActive === false)) return false;
      if (statusFilter === "BUSY" && (rider.status !== "BUSY" || rider.isActive === false)) return false;
      if (statusFilter === "OFFLINE" && (rider.status !== "OFFLINE" || rider.isActive === false)) return false;
      if (statusFilter === "INACTIVE" && rider.isActive !== false) return false;
    }

    const riderOrders = orders.filter((o) => o.riderId === rider.id);

    // Filtro por órdenes
    if (ordersFilter === "ACTIVE") {
      const hasActive = riderOrders.some((o) =>
        ["ASSIGNED", "PICKING_UP", "IN_TRANSIT"].includes(o.status)
      );
      if (!hasActive) return false;
    } else if (ordersFilter === "WITH_ORDERS") {
      if (riderOrders.length === 0) return false;
    }

    // Filtro por texto
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = rider.user.name.toLowerCase().includes(q);
      const matchPlate = rider.vehiclePlate.toLowerCase().includes(q);
      const matchPhone = rider.phone.toLowerCase().includes(q);
      const matchOrder = riderOrders.some(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.dropoffAddress.toLowerCase().includes(q) ||
          o.merchant.businessName.toLowerCase().includes(q)
      );
      return matchName || matchPlate || matchPhone || matchOrder;
    }

    return true;
  });

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                Panel Exclusivo de Repartidores
                <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 text-xs font-mono">
                  {riders.length} Despachadores
                </Badge>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Cards individuales con información de contacto directa (WhatsApp, llamadas), geolocalización y récord cronológico de despachos.
              </p>
            </div>
          </div>
        </div>

        {/* Botón de recarga manual */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 border border-white/10 hover:text-white hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-emerald-400" : ""}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* KPI Banner: Métricas Generales de la Flota */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Repartidores */}
        <motion.div
          whileHover={{ y: -2 }}
          className="surface-card rounded-2xl p-4 border border-white/10 flex items-center gap-3 shadow-lg"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-300 flex-shrink-0">
            <Bike className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Flota Total
            </span>
            <span className="text-lg font-black text-white font-mono">
              {riders.length}
            </span>
          </div>
        </motion.div>

        {/* Disponibles */}
        <motion.div
          whileHover={{ y: -2 }}
          className="surface-card rounded-2xl p-4 border border-emerald-500/30 flex items-center gap-3 shadow-lg shadow-emerald-500/5"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Disponibles
            </span>
            <span className="text-lg font-black text-emerald-400 font-mono">
              {idleRiders.length}
            </span>
          </div>
        </motion.div>

        {/* En Servicio */}
        <motion.div
          whileHover={{ y: -2 }}
          className="surface-card rounded-2xl p-4 border border-sky-500/30 flex items-center gap-3 shadow-lg shadow-sky-500/5"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 flex-shrink-0">
            <Route className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              En Servicio
            </span>
            <span className="text-lg font-black text-sky-400 font-mono">
              {busyRiders.length}
            </span>
          </div>
        </motion.div>

        {/* Total Entregas */}
        <motion.div
          whileHover={{ y: -2 }}
          className="surface-card rounded-2xl p-4 border border-white/10 flex items-center gap-3 shadow-lg"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-300 flex-shrink-0">
            <PackageCheck className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Entregas Hechas
            </span>
            <span className="text-lg font-black text-indigo-300 font-mono">
              {deliveredOrders.length}
            </span>
          </div>
        </motion.div>

        {/* Ganancias Acumuladas Flota */}
        <motion.div
          whileHover={{ y: -2 }}
          className="surface-card rounded-2xl p-4 border border-emerald-500/25 flex items-center gap-3 shadow-lg col-span-2 sm:col-span-1"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Ganancia Flota (80%)
            </span>
            <span className="text-lg font-black text-emerald-400 font-mono">
              ${totalFleetEarnings.toFixed(2)}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-950/70 p-3.5 rounded-2xl border border-white/[0.08]">
        {/* Buscador */}
        <div className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, placa, teléfono o # de orden..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>

        {/* Filtros de Disponibilidad y Órdenes */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro por estado del rider */}
          <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                statusFilter === "ALL"
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter("IDLE")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                statusFilter === "IDLE"
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Disponibles ({idleRiders.length})
            </button>
            <button
              onClick={() => setStatusFilter("BUSY")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                statusFilter === "BUSY"
                  ? "bg-sky-500/20 text-sky-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              En Viaje ({busyRiders.length})
            </button>
            <button
              onClick={() => setStatusFilter("OFFLINE")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                statusFilter === "OFFLINE"
                  ? "bg-slate-800 text-slate-200"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Offline ({offlineRiders.length})
            </button>
          </div>

          {/* Filtro por historial */}
          <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setOrdersFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                ordersFilter === "ALL"
                  ? "bg-indigo-500/20 text-indigo-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Todo Récord
            </button>
            <button
              onClick={() => setOrdersFilter("ACTIVE")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                ordersFilter === "ACTIVE"
                  ? "bg-indigo-500/20 text-indigo-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Con Orden Activa
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Cards de Repartidores con su Récord */}
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredRiders.map((rider) => {
            const riderOrders = orders.filter((o) => o.riderId === rider.id);
            return (
              <RiderRecordCard
                key={rider.id}
                rider={rider}
                orders={riderOrders}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onToggleStatus={handleToggleStatus}
              />
            );
          })}
        </AnimatePresence>

        {filteredRiders.length === 0 && (
          <div className="col-span-full py-16 text-center text-xs text-slate-500 surface-card rounded-3xl border border-white/5 space-y-3">
            <Bike className="w-10 h-10 text-slate-600 mx-auto opacity-60" />
            <h3 className="text-sm font-bold text-slate-300">
              No se encontraron repartidores con los filtros activos
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Intenta limpiar los términos de búsqueda o cambiar los filtros de disponibilidad para visualizar más repartidores.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
