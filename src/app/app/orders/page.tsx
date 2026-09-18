"use client";

import { useState, useEffect } from "react";
import { DeliveryOrderCard } from "@/components/delivery/DeliveryOrderCard";
import { Package, RefreshCw, Search, Bike } from "lucide-react";

export default function DeliveryOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const url = filter === "all" ? "/api/delivery/orders" : `/api/delivery/orders?status=${filter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error("Error al cargar órdenes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const filteredOrders = orders.filter((o) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.recipientName.toLowerCase().includes(q) ||
      (o.merchant?.businessName && o.merchant.businessName.toLowerCase().includes(q)) ||
      o.dropoffAddress.toLowerCase().includes(q)
    );
  });

  const totalEarnings = orders
    .filter((o) => o.status === "DELIVERED")
    .reduce((sum, o) => sum + (o.riderEarnings || o.totalCost || 0), 0);

  const filterButtons = [
    { key: "all", label: "Todas" },
    { key: "pending", label: "Solicitadas" },
    { key: "active", label: "En Curso" },
    { key: "delivered", label: "Entregadas" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Bike className="w-6 h-6 text-amber-400" />
            <span>Gestión de Despachos</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Confirma retiros, avisa al cliente por WhatsApp y completa tus entregas.
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <div className="bg-slate-800/80 border border-slate-700 px-3.5 py-2 rounded-xl">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Ganancias (100%)
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-emerald-400 font-mono">
              ${totalEarnings.toFixed(2)}
            </span>
          </div>
          <button
            onClick={fetchOrders}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer active:scale-95"
            title="Actualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Horizontal scrollable filter pills for mobile */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 p-1 rounded-xl overflow-x-auto scrollbar-none touch-pan-x">
          {filterButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={() => setFilter(btn.key)}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer active:scale-95 text-center ${
                filter === btn.key ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20" : "text-slate-400 hover:text-white"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por orden, cliente o zona..."
            className="w-full bg-slate-900/80 border border-slate-800 text-base sm:text-xs text-white pl-9 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl">
          <RefreshCw className="w-8 h-8 text-amber-400/60 animate-spin mx-auto mb-2" />
          <p className="text-sm text-slate-400">Cargando órdenes...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-300">No se encontraron órdenes</p>
          <p className="text-xs text-slate-500 mt-1">
            {searchTerm
              ? "No hay resultados para tu búsqueda."
              : "Cuando tus comercios afiliados soliciten carreras, aparecerán aquí para gestionarlas."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOrders.map((order) => (
            <DeliveryOrderCard
              key={order.id}
              order={order}
              onStatusUpdated={fetchOrders}
            />
          ))}
        </div>
      )}
    </div>
  );
}
