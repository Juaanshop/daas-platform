"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DispatchMonitor } from "@/components/admin/DispatchMonitor";
import { FleetCard } from "@/components/admin/FleetCard";
import { AdminOrderModal } from "@/components/admin/AdminOrderModal";
import { CreateMerchantModal } from "@/components/admin/CreateMerchantModal";
import { CreateRiderModal } from "@/components/admin/CreateRiderModal";
import { EditMerchantModal } from "@/components/admin/EditMerchantModal";
import { EditRiderModal } from "@/components/admin/EditRiderModal";
import { MerchantsDirectoryCard } from "@/components/admin/MerchantsDirectoryCard";
import {
  ShieldAlert,
  RefreshCw,
  Plus,
  Store,
  Bike,
  Layers,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

export default function AdminBackofficePage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de los modales
  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false);
  const [isCreateMerchantModalOpen, setIsCreateMerchantModalOpen] = useState(false);
  const [isCreateRiderModalOpen, setIsCreateRiderModalOpen] = useState(false);
  const [merchantToEdit, setMerchantToEdit] = useState<any | null>(null);
  const [riderToEdit, setRiderToEdit] = useState<any | null>(null);

  // Tab activo de la torre de control
  const [activeTab, setActiveTab] = useState<"all" | "dispatch" | "merchants" | "riders">("all");

  // Cargar órdenes, flota y comercios (incluyendo inactivos para administración total)
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [resOrders, resRiders, resMerchants] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/riders?includeInactive=true"),
        fetch("/api/merchants?includeInactive=true"),
      ]);

      const dataOrders = await resOrders.json();
      const dataRiders = await resRiders.json();
      const dataMerchants = await resMerchants.json();

      if (dataOrders.ok) setOrders(dataOrders.orders);
      if (dataRiders.ok) setRiders(dataRiders.riders);
      if (dataMerchants.ok) setMerchants(dataMerchants.merchants);
    } catch (err) {
      console.error("Error al cargar datos del admin:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Suscripción SSE a eventos en vivo
  useEffect(() => {
    const es = new EventSource("/api/events");

    es.addEventListener("order:created", () => loadData());
    es.addEventListener("order:status_updated", () => loadData());
    es.addEventListener("rider:status_updated", () => loadData());
    es.addEventListener("rider:created", () => loadData());
    es.addEventListener("rider:updated", () => loadData());
    es.addEventListener("rider:deleted", () => loadData());
    es.addEventListener("merchant:created", () => loadData());
    es.addEventListener("merchant:updated", () => loadData());
    es.addEventListener("merchant:deleted", () => loadData());

    return () => {
      es.close();
    };
  }, [loadData]);

  // Asignar rider a una orden
  const handleAssignRider = async (orderId: string, riderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "ASSIGNED",
          riderId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo asignar el repartidor");
      }
      loadData();
      return data;
    } catch (err: any) {
      alert(`Error al asignar: ${err.message}`);
      return null;
    }
  };

  // Alternar estado del rider (IDLE vs OFFLINE)
  const handleStatusChange = async (riderId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/riders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riderId, status: newStatus }),
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error("Error al cambiar estado del repartidor:", err);
    }
  };

  // Ocultar o reactivar comercio
  const handleToggleMerchantActive = async (merchantId: string, currentActive: boolean) => {
    try {
      const res = await fetch("/api/merchants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchantId, isActive: !currentActive }),
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error("Error al actualizar visibilidad de comercio:", err);
    }
  };

  // Eliminar comercio
  const handleDeleteMerchant = async (merchantId: string) => {
    const res = await fetch(`/api/merchants?id=${merchantId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "No se pudo eliminar el comercio");
    }
    loadData();
    if (data.message) {
      alert(data.message);
    }
  };

  // Ocultar o reactivar repartidor
  const handleToggleRiderActive = async (riderId: string, currentActive: boolean) => {
    try {
      const res = await fetch("/api/riders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riderId, isActive: !currentActive }),
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error("Error al actualizar visibilidad de repartidor:", err);
    }
  };

  // Eliminar repartidor
  const handleDeleteRider = async (riderId: string) => {
    const res = await fetch(`/api/riders?id=${riderId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "No se pudo eliminar el repartidor");
    }
    loadData();
    if (data.message) {
      alert(data.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-indigo-950/50 via-slate-900/70 to-slate-900/60 border border-indigo-500/20 shadow-2xl overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3">
              <ShieldAlert className="w-3.5 h-3.5" /> Torre de Control DaaS Carabobo
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Backoffice & Despacho Central
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Monitoreo unificado de la demanda B2B, registro de clientes, gestión de flota de repartidores y asignación inteligente.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Botón para registrar nuevo cliente / comercio */}
            <button
              id="btn-admin-new-merchant"
              onClick={() => setIsCreateMerchantModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:brightness-110 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Store className="w-4 h-4" />
              <span>+ Nuevo Comercio</span>
            </button>

            {/* Botón para dar de alta nuevo repartidor */}
            <button
              id="btn-admin-new-rider"
              onClick={() => setIsCreateRiderModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-sky-400 to-cyan-400 hover:brightness-110 shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
            >
              <Bike className="w-4 h-4" />
              <span>+ Nuevo Repartidor</span>
            </button>

            {/* Botón para crear despacho ingresando link de Google Maps */}
            <button
              id="btn-admin-new-order"
              onClick={() => setIsCreateOrderModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-white/10 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Nueva Solicitud Google Maps</span>
            </button>

            <button
              onClick={loadData}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-white/10 transition-colors cursor-pointer"
              title="Refrescar datos"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Selector de Secciones */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-900/60 border border-white/[0.08] w-fit">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "all"
              ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Vista Integral</span>
        </button>

        <button
          onClick={() => setActiveTab("merchants")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "merchants"
              ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>Comercios ({merchants.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("riders")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "riders"
              ? "bg-gradient-to-r from-sky-500/20 to-cyan-500/20 text-sky-300 border border-sky-500/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Bike className="w-3.5 h-3.5" />
          <span>Flota Repartidores ({riders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("dispatch")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "dispatch"
              ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Matriz de Despacho ({orders.length})</span>
        </button>
      </div>

      {/* Contenido según la pestaña activa */}

      {/* 1. Flota de Repartidores (en pestaña 'all' o 'riders') */}
      {(activeTab === "all" || activeTab === "riders") && (
        <FleetCard
          riders={riders}
          onStatusChange={handleStatusChange}
          onOpenCreateRiderModal={() => setIsCreateRiderModalOpen(true)}
          onEditRider={(rider) => setRiderToEdit(rider)}
          onToggleActive={handleToggleRiderActive}
          onDeleteRider={handleDeleteRider}
        />
      )}

      {/* 2. Directorio de Comercios / Clientes B2B (en pestaña 'all' o 'merchants') */}
      {(activeTab === "all" || activeTab === "merchants") && (
        <MerchantsDirectoryCard
          merchants={merchants}
          onOpenCreateModal={() => setIsCreateMerchantModalOpen(true)}
          onEditMerchant={(merchant) => setMerchantToEdit(merchant)}
          onToggleActive={handleToggleMerchantActive}
          onDeleteMerchant={handleDeleteMerchant}
        />
      )}

      {/* 3. Matriz Operativa de Despacho (en pestaña 'all' o 'dispatch') */}
      {(activeTab === "all" || activeTab === "dispatch") && (
        <DispatchMonitor
          orders={orders}
          riders={riders}
          onAssignRider={handleAssignRider}
          isLoading={isLoading}
        />
      )}

      {/* Modal para Crear Solicitud de Despacho con Google Maps Link */}
      <AdminOrderModal
        isOpen={isCreateOrderModalOpen}
        onClose={() => setIsCreateOrderModalOpen(false)}
        merchants={merchants}
        riders={riders}
        onOrderCreated={loadData}
      />

      {/* Modal para Registrar Nuevo Comercio Cliente */}
      <CreateMerchantModal
        isOpen={isCreateMerchantModalOpen}
        onClose={() => setIsCreateMerchantModalOpen(false)}
        onMerchantCreated={loadData}
      />

      {/* Modal para Dar de Alta Nuevo Repartidor */}
      <CreateRiderModal
        isOpen={isCreateRiderModalOpen}
        onClose={() => setIsCreateRiderModalOpen(false)}
        onRiderCreated={loadData}
      />

      {/* Modal para Editar Comercio Cliente */}
      <EditMerchantModal
        isOpen={Boolean(merchantToEdit)}
        onClose={() => setMerchantToEdit(null)}
        merchant={merchantToEdit}
        onMerchantUpdated={loadData}
      />

      {/* Modal para Editar Repartidor */}
      <EditRiderModal
        isOpen={Boolean(riderToEdit)}
        onClose={() => setRiderToEdit(null)}
        rider={riderToEdit}
        onRiderUpdated={loadData}
      />
    </div>
  );
}

