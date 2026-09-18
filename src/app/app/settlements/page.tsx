"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  DollarSign,
  TrendingUp,
  Store,
  Calendar,
  Layers,
  Search,
  MessageSquare,
  Bike,
  Route,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DeliverySettlementsPage() {
  const [settlement, setSettlement] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<"daily" | "all">("daily");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSettlement() {
      try {
        setIsLoading(true);
        const url =
          viewMode === "all"
            ? `/api/delivery/settlement?mode=all`
            : `/api/delivery/settlement?date=${selectedDate}`;
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

  const [isSettling, setIsSettling] = useState(false);

  async function handleMarkAsSettled(target?: { merchantId?: string; date?: string }) {
    try {
      setIsSettling(true);
      const res = await fetch("/api/delivery/settlement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: target?.date || (viewMode === "daily" ? selectedDate : undefined),
          merchantId: target?.merchantId,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        // Recargar liquidación actualizada
        const url =
          viewMode === "all"
            ? `/api/delivery/settlement?mode=all`
            : `/api/delivery/settlement?date=${selectedDate}`;
        const refetch = await fetch(url);
        const refetchData = await refetch.json();
        if (refetchData.ok) {
          setSettlement(refetchData.settlement);
        }
      } else {
        alert(data.error || "No se pudo marcar como cobrado");
      }
    } catch (err) {
      console.error("Error al marcar cobrado:", err);
      alert("Error de conexión al marcar como cobrado");
    } finally {
      setIsSettling(false);
    }
  }

  const filteredMerchants = useMemo(() => {
    if (!settlement?.merchants) return [];
    if (!searchQuery.trim()) return settlement.merchants;
    const q = searchQuery.toLowerCase();
    return settlement.merchants.filter((m: any) =>
      m.businessName.toLowerCase().includes(q)
    );
  }, [settlement, searchQuery]);

  const filteredDispatches = useMemo(() => {
    if (!settlement?.dispatches) return [];
    if (!searchQuery.trim()) return settlement.dispatches;
    const q = searchQuery.toLowerCase();
    return settlement.dispatches.filter(
      (d: any) =>
        d.orderNumber.toLowerCase().includes(q) ||
        d.merchantName.toLowerCase().includes(q) ||
        d.recipientName.toLowerCase().includes(q)
    );
  }, [settlement, searchQuery]);

  // Si todo lo del período ya fue cobrado o no hay pendientes por cobrar
  const hasPendingSettlement = (settlement?.pendingOrders || 0) > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <DollarSign className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Cierre Diario & Liquidación
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Control de carreras completadas, cobranzas por WhatsApp y confirmación de cobro
              </p>
            </div>
          </div>
        </div>

        {/* Date / Period Controls & Confirm Global Action */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex items-center gap-1 text-xs">
            <button
              onClick={() => setViewMode("daily")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === "daily"
                  ? "bg-amber-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Día Específico
            </button>
            <button
              onClick={() => setViewMode("all")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === "all"
                  ? "bg-amber-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Histórico
            </button>
          </div>

          {viewMode === "daily" && (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl">
              <Calendar className="w-4 h-4 text-amber-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs text-white outline-none cursor-pointer"
              />
            </div>
          )}

          {/* Botón para confirmar que cobró lo del día */}
          {hasPendingSettlement && (
            <Button
              onClick={() => handleMarkAsSettled()}
              disabled={isSettling}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSettling ? "Guardando..." : "Confirmar Cobro del Día"}</span>
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-slate-500">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold uppercase tracking-wider">Calculando corte y liquidación...</p>
        </div>
      ) : (
        <>
          {/* Banner de Cobro Completado (si ya no hay pendientes) */}
          {!hasPendingSettlement && (settlement?.totalOrders || 0) > 0 && (
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between gap-3 text-emerald-300">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">¡Todo el corte del día está cobrado!</h3>
                  <p className="text-xs text-emerald-400/90 mt-0.5">
                    Has confirmado la recepción de todos los despachos entregados en este período.
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold bg-emerald-500/20 px-3 py-1 rounded-lg border border-emerald-500/30">
                100% Cobrado
              </span>
            </div>
          )}

          {/* KPI Metrics */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${hasPendingSettlement ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-4`}>
            {/* Total Facturado */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <span>Total Recaudado</span>
                <DollarSign className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-extrabold text-white mt-3 font-mono">
                ${settlement?.totalVolume?.toFixed(2) || "0.00"}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Total bruto (100% para ti como repartidor y dueño)
              </p>
            </div>

            {/* Ganancia Pendiente Delivery (Se oculta cuando se marca como cobrado) */}
            {hasPendingSettlement && (
              <div className="bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-500/30 rounded-2xl p-5 relative overflow-hidden">
                <div className="flex items-center justify-between text-amber-400 text-xs font-semibold uppercase tracking-wider">
                  <span>Pendiente por Cobrar</span>
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-3xl font-extrabold text-amber-400 mt-3 font-mono">
                  ${settlement?.pendingVolume?.toFixed(2) || "0.00"}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[11px] text-amber-500/80">
                    {settlement?.pendingOrders} {settlement?.pendingOrders === 1 ? "carrera por liquidar" : "carreras por liquidar"}
                  </p>
                  <button
                    onClick={() => handleMarkAsSettled()}
                    disabled={isSettling}
                    className="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2 py-0.5 rounded transition-all"
                  >
                    Marcar Cobrado
                  </button>
                </div>
              </div>
            )}

            {/* Carreras Completadas */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <span>Carreras Realizadas</span>
                <Bike className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-3xl font-extrabold text-white mt-3 font-mono">
                {settlement?.totalOrders || 0}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Despachos completados
              </p>
            </div>

            {/* Distancia Total */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <span>Distancia Rodada</span>
                <Route className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-3xl font-extrabold text-white mt-3 font-mono">
                {settlement?.totalKmDelivered?.toFixed(1) || "0.0"} <span className="text-lg">km</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Kilómetros en ruta
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar comercio u orden..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Section: Liquidación y Cobro por Comercio (se oculta cuando todo está cobrado) */}
          {hasPendingSettlement && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Store className="w-5 h-5 text-amber-400" />
                  Liquidación por Comercio Asociado
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Haz clic en &quot;Cobrar por WhatsApp&quot; para enviar automáticamente el desglose de cierre diario a cada local.
                </p>
              </div>
              <span className="text-xs bg-slate-800 text-slate-300 font-bold px-3 py-1 rounded-full border border-slate-700 w-fit">
                {filteredMerchants.length} Comercio{filteredMerchants.length === 1 ? "" : "s"}
              </span>
            </div>

            {filteredMerchants.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Store className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No hay despachos registrados para liquidar en este período.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMerchants.map((m: any) => (
                  <div
                    key={m.merchantId}
                    className="bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-white text-base tracking-tight">{m.businessName}</h3>
                          {m.phone && (
                            <p className="text-xs font-mono text-slate-400 mt-0.5">{m.phone}</p>
                          )}
                        </div>
                        <span className="text-xs font-bold bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-lg border border-amber-500/20">
                          {m.totalOrders} {m.totalOrders === 1 ? "carrera" : "carreras"}
                        </span>
                      </div>

                      {/* Financial info */}
                      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 my-4">
                        <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                          <span>Total Recaudado (100%):</span>
                          <span className="font-mono text-base font-bold text-emerald-400">
                            ${m.totalSpent.toFixed(2)}
                          </span>
                        </div>
                        {m.orderNumbers && m.orderNumbers.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-500">
                            <span className="font-medium text-slate-400">Órdenes: </span>
                            {m.orderNumbers.join(", ")}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions: WhatsApp + Mark Merchant Settled */}
                    <div className="flex flex-col gap-2">
                      {m.whatsappUrl && (
                        <a
                          href={m.whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20"
                        >
                          <MessageSquare className="w-4 h-4 fill-white" />
                          <span>Cobrar por WhatsApp</span>
                        </a>
                      )}
                      <Button
                        onClick={() => handleMarkAsSettled({ merchantId: m.merchantId })}
                        disabled={isSettling}
                        variant="outline"
                        className="w-full border-slate-700 hover:border-emerald-500 hover:bg-emerald-500/10 text-slate-300 hover:text-emerald-400 font-medium py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Marcar Comercio Cobrado</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}

          {/* Section: Libro de Carreras Detalladas */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  Detalle de Despachos Entregados
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Registro individual de cada carrera entregada con su estado de cobro
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {filteredDispatches.length} registros
              </span>
            </div>

            {filteredDispatches.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                No hay carreras finalizadas que coincidan con la búsqueda.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                      <th className="pb-3">Orden</th>
                      <th className="pb-3">Comercio</th>
                      <th className="pb-3">Destinatario</th>
                      <th className="pb-3 text-center">Distancia</th>
                      <th className="pb-3 text-right">Monto (100%)</th>
                      <th className="pb-3 text-right">Estado Cobro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredDispatches.map((d: any) => (
                      <tr key={d.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 font-mono font-bold text-amber-400">
                          {d.orderNumber}
                        </td>
                        <td className="py-3 font-semibold text-white">
                          {d.merchantName}
                        </td>
                        <td className="py-3 text-slate-300">
                          <div>{d.recipientName}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[200px]">
                            {d.dropoffAddress}
                          </div>
                        </td>
                        <td className="py-3 text-center font-mono text-slate-300">
                          {d.distanceKm} km
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-white text-sm">
                          ${d.totalCost.toFixed(2)}
                        </td>
                        <td className="py-3 text-right">
                          {d.isSettled ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> Cobrado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                              <Clock className="w-3 h-3" /> Pendiente
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
