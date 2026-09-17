"use client";

import React, { useState, useEffect, useCallback } from "react";
import { OrderForm } from "@/components/merchant/OrderForm";
import { ActiveOrders } from "@/components/merchant/ActiveOrders";
import {
  Store,
  TrendingUp,
  ShieldCheck,
  Zap,
  MapPin,
  CheckCircle2,
  Phone,
  ArrowUpRight,
} from "lucide-react";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export default function MerchantPage() {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>("");
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar comercios iniciales
  const loadMerchants = useCallback(async () => {
    try {
      const res = await fetch("/api/merchants");
      const data = await res.json();
      if (data.ok && data.merchants) {
        setMerchants(data.merchants);
        setSelectedMerchantId((prev) => {
          if (prev && data.merchants.some((m: any) => m.id === prev)) {
            return prev;
          }
          return data.merchants[0]?.id || "";
        });
      }
    } catch (err) {
      console.error("Error al cargar comercios:", err);
    }
  }, []);

  useEffect(() => {
    loadMerchants();
  }, [loadMerchants]);

  // Cargar órdenes del comercio seleccionado
  const fetchOrders = useCallback(async () => {
    if (!selectedMerchantId) return;
    try {
      setIsLoading(true);
      const res = await fetch(
        `/api/orders?merchantId=${selectedMerchantId}&active=true`
      );
      const data = await res.json();
      if (data.ok) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error("Error al cargar órdenes:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMerchantId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Suscripción SSE en tiempo real
  useEffect(() => {
    const es = new EventSource("/api/events");

    es.addEventListener("order:created", () => {
      fetchOrders();
    });

    es.addEventListener("order:status_updated", () => {
      fetchOrders();
    });

    es.addEventListener("merchant:created", () => {
      loadMerchants();
    });

    es.addEventListener("merchant:updated", () => {
      loadMerchants();
    });

    es.addEventListener("merchant:deleted", () => {
      loadMerchants();
    });

    return () => {
      es.close();
    };
  }, [fetchOrders, loadMerchants]);

  const selectedMerchant = merchants.find((m) => m.id === selectedMerchantId);

  return (
    <div className="space-y-8">
      {/* Banner de Bienvenida del Comercio */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-cyan-950/40 border border-emerald-500/20 shadow-2xl overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
              <Zap className="w-3.5 h-3.5" /> Portal de Comercios Gastronómicos
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {selectedMerchant
                ? selectedMerchant.businessName
                : "Portal de Despacho B2B"}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Coordina envíos on-demand con tarifa instantánea por enlace de Google Maps y acceso a datos de tus clientes.
            </p>
          </div>

          {selectedMerchant && (
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 text-right">
                <span className="text-xs text-slate-400 block">Saldo en Cuenta</span>
                <span className="text-xl font-black text-emerald-400">
                  ${selectedMerchant.balance.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selector de Comercios por Cards Clickeables */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-400" />
              Comercios Gastronómicos Asociados
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Haz clic en cualquier tarjeta para acceder a su panel de despacho y gestionar sus clientes.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono bg-slate-900 px-2.5 py-1 rounded-lg border border-white/5">
            {merchants.length} locales registrados
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {merchants.map((m) => {
            const isSelected = m.id === selectedMerchantId;
            const isBanaven = m.businessName.toLowerCase().includes("rico");
            const isNapoli = m.businessName.toLowerCase().includes("napoli");

            return (
              <motion.button
                key={m.id}
                type="button"
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedMerchantId(m.id)}
                className={`text-left p-5 rounded-3xl border transition-all relative overflow-hidden group flex flex-col justify-between space-y-4 cursor-pointer shadow-lg ${
                  isSelected
                    ? "bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-emerald-950/40 border-emerald-400 shadow-xl shadow-emerald-500/15 ring-2 ring-emerald-400/40"
                    : "bg-slate-900/50 border-white/10 hover:border-white/20 hover:bg-slate-900/80"
                }`}
              >
                {/* Header de la Card */}
                <div className="flex items-start justify-between gap-2 w-full">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-lg shadow-inner ${
                        isBanaven
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : isNapoli
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      }`}
                    >
                      {isBanaven ? "🍔" : isNapoli ? "🍕" : "🍟"}
                    </div>
                    <div>
                      <div className="font-extrabold text-white text-base group-hover:text-emerald-300 transition-colors">
                        {m.businessName}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{m.phone}</span>
                      </div>
                    </div>
                  </div>

                  {isSelected ? (
                    <Badge variant="success" pulse>
                      Panel Activo
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="opacity-70 group-hover:opacity-100">
                      Entrar
                    </Badge>
                  )}
                </div>

                {/* Dirección y Ubicación */}
                <div className="text-xs text-slate-300 space-y-1 w-full bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
                  <div className="flex items-start gap-1.5 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{m.address}</span>
                  </div>
                </div>

                {/* Footer de la Card: Saldo + Botón Clickeable */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10 w-full text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">
                      Saldo en Cuenta
                    </span>
                    <span className="text-base font-black text-emerald-400">
                      ${m.balance.toFixed(2)}
                    </span>
                  </div>

                  <div
                    className={`flex items-center gap-1 font-bold text-xs py-1.5 px-3 rounded-xl transition-all ${
                      isSelected
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "text-slate-400 group-hover:text-cyan-300 group-hover:bg-cyan-500/10"
                    }`}
                  >
                    <span>{isSelected ? "Gestionando" : "Acceder al Panel"}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </motion.button>
            );
          })}

        </div>
      </div>

      {/* Grid: Formulario de Nueva Orden + Monitor de Activos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6">
          <OrderForm
            merchants={merchants}
            selectedMerchantId={selectedMerchantId}
            onMerchantChange={(id) => setSelectedMerchantId(id)}
            onOrderCreated={fetchOrders}
          />
        </div>

        <div className="lg:col-span-6">
          <ActiveOrders
            orders={orders}
            onOrderCancelled={fetchOrders}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
