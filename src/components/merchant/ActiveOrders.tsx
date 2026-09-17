"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StatusBadge } from "../shared/StatusBadge";
import {
  MapPin,
  Clock,
  Bike,
  Package,
  XCircle,
  ChevronRight,
  Phone,
  ExternalLink,
  User,
  MessageCircle,
} from "lucide-react";
import { getGoogleMapsSearchUrl } from "@/lib/maps";
import { WhatsAppService } from "@/services/whatsapp";
import {
  CustomerDetailModal,
  OrderDetail,
} from "./CustomerDetailModal";
import { Badge } from "@/components/ui/badge";

interface Order extends OrderDetail {}

interface ActiveOrdersProps {
  orders: Order[];
  onOrderCancelled: (orderId: string) => void;
  isLoading: boolean;
}

export function ActiveOrders({
  orders,
  onOrderCancelled,
  isLoading,
}: ActiveOrdersProps) {
  const [selectedOrderForModal, setSelectedOrderForModal] =
    useState<OrderDetail | null>(null);

  const cancelOrder = async (orderId: string) => {
    if (!confirm("¿Deseas cancelar esta orden pendiente?")) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (res.ok) {
        onOrderCancelled(orderId);
      }
    } catch (err) {
      console.error("Error al cancelar orden:", err);
    }
  };

  return (
    <div className="surface-card rounded-3xl p-6 sm:p-7 border border-white/10 shadow-2xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-cyan-400" />
            Despachos Activos del Día
          </h3>
          <p className="text-xs text-slate-400">
            Seguimiento de pedidos en curso para este local.
          </p>
        </div>
        <Badge variant="info" pulse={orders.length > 0}>
          {orders.length} activos
        </Badge>
      </div>

      {isLoading ? (
        <div className="py-14 text-center text-slate-400 text-sm space-y-2">
          <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Actualizando despachos en tiempo real...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-14 text-center text-slate-400 text-sm space-y-2">
          <Package className="w-12 h-12 text-slate-600 mx-auto stroke-1" />
          <p className="font-semibold text-slate-300">No hay despachos activos en este momento.</p>
          <p className="text-xs text-slate-500">
            Usa el formulario para solicitar tu primer repartidor on-demand.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {orders.map((order) => {
              const timeStr = new Date(order.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, x: -20 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => setSelectedOrderForModal(order as any)}
                  className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 hover:border-cyan-400/50 hover:bg-slate-900/80 transition-all space-y-3 cursor-pointer group shadow-md hover:shadow-cyan-500/10 hover:scale-[1.008] active:scale-[0.995]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-sm font-bold text-emerald-400">
                        {order.orderNumber}
                      </span>
                      <StatusBadge status={order.status} />
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {timeStr}
                      </span>
                      <span className="text-sm font-black text-white tabular-nums">
                        ${order.totalCost.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Destino y Datos del Cliente */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="space-y-1.5">
                      <div className="text-slate-400 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        <a
                          href={getGoogleMapsSearchUrl(
                            order.dropoffLat,
                            order.dropoffLng,
                            order.dropoffAddress
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium text-cyan-300 hover:text-cyan-200 hover:underline flex items-center gap-1 transition-colors truncate"
                          title="Abrir destino en Google Maps"
                        >
                          <span className="truncate">{order.dropoffAddress}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </div>

                      <div className="text-slate-300 flex items-center gap-1.5 pl-5 font-medium">
                        <User className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                        <span>{order.recipientName}</span>
                        <span className="text-slate-500 font-mono text-[11px]">
                          ({order.recipientPhone})
                        </span>
                        <a
                          href={WhatsAppService.getCustomerWhatsAppUrl(
                            order.recipientPhone,
                            order.recipientName,
                            order.orderNumber
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/15 transition-colors ml-1"
                          title="Escribir al cliente por WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {order.packageNotes && (
                        <div className="text-slate-400 bg-slate-900/60 p-1.5 rounded-lg border border-white/5 text-[11px] line-clamp-2">
                          📝 {order.packageNotes}
                        </div>
                      )}
                      <div className="text-slate-400 text-[11px] flex items-center justify-between">
                        <span>Distancia: {order.distanceKm} km</span>
                        <span className="text-cyan-400 font-semibold group-hover:underline flex items-center gap-0.5">
                          Ver Ficha Cliente
                          <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer con Repartidor Asignado o Botón de Cancelar */}
                  <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-xs">
                    {order.rider ? (
                      <div className="flex items-center gap-2 text-slate-300">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <Bike className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-semibold text-emerald-300">
                            {order.rider.user.name}
                          </span>{" "}
                          <span className="text-[11px] text-slate-400 font-mono">
                            ({order.rider.vehiclePlate})
                          </span>
                        </div>
                        <a
                          href={`tel:${order.rider.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-slate-400 hover:text-emerald-400 ml-1 p-1 rounded-md hover:bg-white/5"
                          title="Llamar al repartidor"
                        >
                          <Phone className="w-3 h-3" />
                        </a>
                      </div>
                    ) : (
                      <div className="text-slate-400 text-xs italic flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        Buscando repartidor disponible...
                      </div>
                    )}

                    {order.status === "PENDING" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelOrder(order.id);
                        }}
                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border border-rose-500/20 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Cancelar Despacho
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Modal Interactivo de Detalle y Datos del Cliente */}
      <CustomerDetailModal
        order={selectedOrderForModal}
        isOpen={Boolean(selectedOrderForModal)}
        onClose={() => setSelectedOrderForModal(null)}
        onCancelOrder={cancelOrder}
      />
    </div>
  );
}
