"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  Store,
  Bike,
  Calendar,
  Download,
  CheckCircle,
  Clock,
  Printer,
  Sparkles,
  Layers,
  Users,
  Search,
  FileText,
  MapPin,
  Phone,
  ArrowUpRight,
  ShieldCheck,
  Compass,
  Package,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SettlementsPage() {
  const [settlement, setSettlement] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<"daily" | "all">("all");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [activeTab, setActiveTab] = useState<"dispatches" | "customers" | "riders" | "merchants">("dispatches");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSettlement() {
      try {
        setIsLoading(true);
        const url =
          viewMode === "all"
            ? `/api/settlements/daily?mode=all`
            : `/api/settlements/daily?date=${selectedDate}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.ok) {
          setSettlement(data.settlement);
        }
      } catch (err) {
        console.error("Error al cargar liquidación:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettlement();
  }, [viewMode, selectedDate]);

  const platformFee = settlement ? settlement.totalPlatformMargin.toFixed(2) : "0.00";
  const riderTotal = settlement ? settlement.totalRiderFees.toFixed(2) : "0.00";

  // Filtros reactivos para las tablas
  const filteredDispatches = useMemo(() => {
    if (!settlement?.dispatches) return [];
    if (!searchQuery.trim()) return settlement.dispatches;
    const q = searchQuery.toLowerCase();
    return settlement.dispatches.filter(
      (d: any) =>
        d.orderNumber.toLowerCase().includes(q) ||
        d.recipientName.toLowerCase().includes(q) ||
        d.recipientPhone.toLowerCase().includes(q) ||
        d.merchantName.toLowerCase().includes(q) ||
        d.riderName.toLowerCase().includes(q) ||
        d.dropoffAddress.toLowerCase().includes(q)
    );
  }, [settlement, searchQuery]);

  const filteredCustomers = useMemo(() => {
    if (!settlement?.customers) return [];
    if (!searchQuery.trim()) return settlement.customers;
    const q = searchQuery.toLowerCase();
    return settlement.customers.filter(
      (c: any) =>
        c.recipientName.toLowerCase().includes(q) ||
        c.recipientPhone.toLowerCase().includes(q) ||
        c.lastAddress.toLowerCase().includes(q)
    );
  }, [settlement, searchQuery]);

  const filteredRiders = useMemo(() => {
    if (!settlement?.riders) return [];
    if (!searchQuery.trim()) return settlement.riders;
    const q = searchQuery.toLowerCase();
    return settlement.riders.filter(
      (r: any) =>
        r.riderName.toLowerCase().includes(q) ||
        r.vehiclePlate.toLowerCase().includes(q)
    );
  }, [settlement, searchQuery]);

  const filteredMerchants = useMemo(() => {
    if (!settlement?.merchants) return [];
    if (!searchQuery.trim()) return settlement.merchants;
    const q = searchQuery.toLowerCase();
    return settlement.merchants.filter((m: any) =>
      m.businessName.toLowerCase().includes(q)
    );
  }, [settlement, searchQuery]);

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-teal-950/50 via-slate-900/90 to-emerald-950/50 border border-teal-500/25 shadow-2xl overflow-hidden"
      >
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/15 text-teal-300 border border-teal-500/30 mb-2">
              <DollarSign className="w-3.5 h-3.5" /> Módulo Financiero & Récord B2B
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Corte de Caja y Récord de Despachos
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Conciliación consolidada de facturación por comercio, dispersión para repartidores y récord detallado de clientes en Valencia, Naguanagua y San Diego.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Selector de Modo: Diario vs Histórico */}
            <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-white/10 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode("all")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "all"
                    ? "bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Histórico Acumulado
              </button>
              <button
                type="button"
                onClick={() => setViewMode("daily")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "daily"
                    ? "bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Corte Diario
              </button>
            </div>

            {/* Selector de fecha (visible si está en modo diario) */}
            {viewMode === "daily" && (
              <div className="flex items-center gap-2 bg-slate-900/90 border border-white/15 px-3 py-1.5 rounded-xl text-xs text-white shadow-inner">
                <Calendar className="w-4 h-4 text-teal-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-white focus:outline-none text-xs font-semibold cursor-pointer"
                />
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-2 text-xs h-9 px-3.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Volumen Total */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="p-5 border-t-2 border-t-slate-400/50 hover:border-slate-400/40 transition-all">
            <span className="text-xs font-semibold text-slate-400">
              Volumen Total Bruto
            </span>
            <div className="font-mono text-2xl sm:text-3xl font-black text-white mt-1 tabular-nums tracking-tight">
              ${settlement?.totalVolume.toFixed(2) || "0.00"}
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Facturado a comercios
            </span>
          </Card>
        </motion.div>

        {/* Honorarios Riders */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-5 border-t-2 border-t-emerald-500 bg-emerald-500/[0.03] border-emerald-500/25 hover:border-emerald-500/40 transition-all">
            <span className="text-xs font-semibold text-emerald-400">
              Dispersión a Riders (80%)
            </span>
            <div className="font-mono text-2xl sm:text-3xl font-black text-emerald-300 mt-1 tabular-nums tracking-tight">
              ${riderTotal}
            </div>
            <span className="text-[11px] text-emerald-400/80 block mt-0.5">
              Honorarios de repartidores
            </span>
          </Card>
        </motion.div>

        {/* Margen Plataforma */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="p-5 border-t-2 border-t-cyan-500 bg-cyan-500/[0.03] border-cyan-500/25 hover:border-cyan-500/40 transition-all">
            <span className="text-xs font-semibold text-cyan-400">
              Margen DaaS Plataforma (20%)
            </span>
            <div className="font-mono text-2xl sm:text-3xl font-black text-cyan-300 mt-1 tabular-nums tracking-tight">
              ${platformFee}
            </div>
            <span className="text-[11px] text-cyan-400/80 block mt-0.5">
              Comisión operativa neta
            </span>
          </Card>
        </motion.div>

        {/* Despachos Totales & Km */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-5 border-t-2 border-t-teal-500 bg-teal-500/[0.03] border-teal-500/25 hover:border-teal-500/40 transition-all">
            <span className="text-xs font-semibold text-teal-400">
              Despachos & Recorrido
            </span>
            <div className="font-mono text-2xl sm:text-3xl font-black text-teal-300 mt-1 tabular-nums tracking-tight">
              {settlement?.totalOrders || 0} <span className="text-base font-normal text-teal-400">viajes</span>
            </div>
            <span className="text-[11px] text-teal-400/80 block mt-0.5 font-mono">
              {settlement?.totalKmDelivered || 0} km recorridos
            </span>
          </Card>
        </motion.div>
      </div>

      {/* Barra de Navegación por Pestañas + Buscador */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-3">
        {/* Pestañas con Framer Motion layoutId */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            {
              id: "dispatches" as const,
              label: "Libro Mayor de Despachos",
              icon: FileText,
              count: settlement?.dispatches?.length || 0,
            },
            {
              id: "customers" as const,
              label: "Récord de Clientes",
              icon: Users,
              count: settlement?.customers?.length || 0,
            },
            {
              id: "riders" as const,
              label: "Récord de Repartidores",
              icon: Bike,
              count: settlement?.riders?.length || 0,
            },
            {
              id: "merchants" as const,
              label: "Corte por Comercio",
              icon: Store,
              count: settlement?.merchants?.length || 0,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
                  isActive ? "text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="settlement-tab-indicator"
                    className="absolute inset-0 bg-slate-800/90 border border-teal-500/40 shadow-md rounded-xl -z-10"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
                <Icon className={`w-4 h-4 ${isActive ? "text-teal-400" : "text-slate-400"}`} />
                <span>{tab.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900 border border-white/10 font-mono text-slate-300">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Buscador reactivo */}
        <div className="w-full sm:w-72">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar cliente, rider, #ORD..."
            icon={<Search className="w-3.5 h-3.5 text-teal-400" />}
            className="text-xs h-9"
          />
        </div>
      </div>

      {/* Contenido Dinámico de las Pestañas */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-16 text-center text-slate-400 text-xs"
          >
            <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Cargando conciliación de datos...
          </motion.div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* PESTAÑA 1: Libro Mayor de Despachos */}
            {activeTab === "dispatches" && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.08]">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-teal-400" />
                      Registro Detallado de Despachos Realizados
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Auditoría pedido a pedido con desglose de honorarios para repartidor (80%) y plataforma (20%).
                    </p>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {filteredDispatches.length} despachos
                  </Badge>
                </div>

                {filteredDispatches.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    No se encontraron despachos con los filtros actuales.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/[0.08] text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                          <th className="pb-3">Orden & Fecha</th>
                          <th className="pb-3">Comercio</th>
                          <th className="pb-3">Cliente / Destino</th>
                          <th className="pb-3">Repartidor</th>
                          <th className="pb-3 text-center">Distancia</th>
                          <th className="pb-3 text-right">Tarifa Total</th>
                          <th className="pb-3 text-right">Rider (80%)</th>
                          <th className="pb-3 text-right">DaaS (20%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredDispatches.map((d: any) => (
                          <tr key={d.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3.5">
                              <span className="font-mono font-bold text-teal-300 block">
                                {d.orderNumber}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {new Date(d.deliveredAt).toLocaleDateString([], {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </td>

                            <td className="py-3.5 font-semibold text-white">
                              {d.merchantName}
                            </td>

                            <td className="py-3.5">
                              <div className="font-semibold text-slate-200">{d.recipientName}</div>
                              <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                                {d.dropoffAddress}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">{d.recipientPhone}</div>
                            </td>

                            <td className="py-3.5">
                              <div className="font-semibold text-slate-200">{d.riderName}</div>
                              <div className="text-[10px] font-mono text-slate-400">{d.riderPlate}</div>
                            </td>

                            <td className="py-3.5 text-center font-mono text-slate-300 tabular-nums">
                              {d.distanceKm} km
                            </td>

                            <td className="py-3.5 text-right font-mono font-bold text-white tabular-nums text-sm">
                              ${d.totalCost.toFixed(2)}
                            </td>

                            <td className="py-3.5 text-right font-mono font-bold text-emerald-400 tabular-nums">
                              +${d.riderEarnings.toFixed(2)}
                            </td>

                            <td className="py-3.5 text-right font-mono font-semibold text-cyan-400 tabular-nums">
                              +${d.platformFee.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )}

            {/* PESTAÑA 2: Récord de Clientes */}
            {activeTab === "customers" && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.08]">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-teal-400" />
                      Récord y Ranking de Clientes (Destinatarios)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Frecuencia de pedidos recibidos, volumen económico generado y última ubicación de entrega.
                    </p>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {filteredCustomers.length} clientes registrados
                  </Badge>
                </div>

                {filteredCustomers.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    No se encontraron clientes registrados.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/[0.08] text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                          <th className="pb-3">Cliente</th>
                          <th className="pb-3">Teléfono</th>
                          <th className="pb-3">Última Dirección</th>
                          <th className="pb-3 text-center">Total Pedidos</th>
                          <th className="pb-3 text-right">Ticket Promedio</th>
                          <th className="pb-3 text-right">Gasto Total</th>
                          <th className="pb-3 text-right">Último Despacho</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredCustomers.map((c: any, idx: number) => (
                          <tr key={c.recipientPhone + idx} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3.5 font-semibold text-white flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center text-[10px] font-bold">
                                #{idx + 1}
                              </span>
                              <span>{c.recipientName}</span>
                            </td>

                            <td className="py-3.5 font-mono text-slate-300 text-xs">
                              {c.recipientPhone}
                            </td>

                            <td className="py-3.5 text-slate-400 text-xs max-w-[200px] truncate" title={c.lastAddress}>
                              {c.lastAddress}
                            </td>

                            <td className="py-3.5 text-center font-mono font-bold text-teal-300 tabular-nums">
                              {c.totalOrders}
                            </td>

                            <td className="py-3.5 text-right font-mono text-slate-300 tabular-nums">
                              ${c.avgTicket.toFixed(2)}
                            </td>

                            <td className="py-3.5 text-right font-mono font-bold text-emerald-400 tabular-nums text-sm">
                              ${c.totalSpent.toFixed(2)}
                            </td>

                            <td className="py-3.5 text-right text-[11px] text-slate-500 font-mono">
                              {new Date(c.lastDeliveredAt).toLocaleDateString([], {
                                day: "2-digit",
                                month: "short",
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )}

            {/* PESTAÑA 3: Récord de Repartidores */}
            {activeTab === "riders" && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.08]">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Bike className="w-5 h-5 text-cyan-400" />
                      Récord y Liquidación a Repartidores
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Desempeño operativo por rider, kilometraje recorrido y honorarios acumulados del 80%.
                    </p>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {filteredRiders.length} Riders
                  </Badge>
                </div>

                {filteredRiders.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    No se registraron repartos finalizados para liquidar.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/[0.08] text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                          <th className="pb-3">Repartidor</th>
                          <th className="pb-3">Patente / Vehículo</th>
                          <th className="pb-3 text-center">Viajes Entregados</th>
                          <th className="pb-3 text-center">Km Recorridos</th>
                          <th className="pb-3 text-right">Promedio / Viaje</th>
                          <th className="pb-3 text-right">Honorario Neto (80%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredRiders.map((r: any, idx: number) => (
                          <tr key={r.riderId} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3.5 font-semibold text-white flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px] font-bold">
                                #{idx + 1}
                              </span>
                              <span>{r.riderName}</span>
                            </td>

                            <td className="py-3.5 font-mono text-slate-400 text-xs">
                              {r.vehiclePlate}
                            </td>

                            <td className="py-3.5 text-center font-mono font-bold text-cyan-300 tabular-nums">
                              {r.totalDeliveries}
                            </td>

                            <td className="py-3.5 text-center font-mono text-slate-300 tabular-nums">
                              {r.totalKm} km
                            </td>

                            <td className="py-3.5 text-right font-mono text-slate-400 tabular-nums">
                              ${r.avgPerTrip.toFixed(2)}
                            </td>

                            <td className="py-3.5 text-right font-mono font-bold text-emerald-400 tabular-nums text-sm">
                              ${r.totalEarned.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )}

            {/* PESTAÑA 4: Corte por Comercio */}
            {activeTab === "merchants" && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.08]">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Store className="w-5 h-5 text-emerald-400" />
                      Corte y Facturación por Comercio
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Volumen bruto facturado a cada local gastronómico asociado.
                    </p>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    {filteredMerchants.length} Comercios
                  </Badge>
                </div>

                {filteredMerchants.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    No se registraron despachos para comercios en este período.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/[0.08] text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                          <th className="pb-3">Comercio</th>
                          <th className="pb-3 text-center">Entregas Despachadas</th>
                          <th className="pb-3 text-right">Total Facturado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredMerchants.map((m: any, idx: number) => (
                          <tr key={m.merchantId} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3.5 font-semibold text-white flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px] font-bold">
                                #{idx + 1}
                              </span>
                              <span>{m.businessName}</span>
                            </td>
                            <td className="py-3.5 text-center text-slate-300 font-mono tabular-nums">
                              {m.totalOrders}
                            </td>
                            <td className="py-3.5 text-right font-mono font-bold text-emerald-400 tabular-nums text-sm">
                              ${m.totalSpent.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
