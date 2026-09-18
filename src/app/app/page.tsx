import { getCurrentDeliveryUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Store, Package, ArrowRight, Share2, PlusCircle, CheckCircle2, DollarSign, TrendingUp } from "lucide-react";
import { SettlementService } from "@/services/settlement";

export const dynamic = "force-dynamic";

export default async function AppDashboardPage() {
  const user = await getCurrentDeliveryUser();

  if (!user) {
    return null;
  }

  const merchants = await prisma.merchant.findMany({
    where: { deliveryUserId: user.id },
    include: {
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const orders = await prisma.order.findMany({
    where: { deliveryUserId: user.id },
    include: { merchant: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const activeOrders = orders.filter(
    (o) => o.status === "DRAFT_SUBMITTED" || o.status === "CONFIRMED_PICKUP" || o.status === "IN_TRANSIT"
  );

  const todaySettlement = await SettlementService.getDailySettlement({
    deliveryUserId: user.id,
  });

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950/60 border border-slate-800 rounded-2xl p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          ¡Hola, {user!.name}! 🛵
        </h1>
        <p className="text-slate-400 mt-2 text-sm sm:text-base max-w-2xl">
          Bienvenido a tu panel de operaciones. Aquí puedes afiliar comercios gastronómicos, generarles su enlace exclusivo para que soliciten despachos y gestionar las entregas.
        </p>

        <div className="flex flex-wrap gap-3 mt-6">
          <Link
            href="/app/merchants"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-orange-500/10"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Afiliar Comercio y Obtener Link</span>
          </Link>
          <Link
            href="/app/settlements"
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-2.5 rounded-xl text-sm transition-all border border-slate-700"
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Cierre Diario & Cobranzas</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Comercios Afiliados
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-3">{merchants.length}</div>
          <p className="text-xs text-slate-500 mt-1">Con links activos para pedir servicio</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Solicitudes Activas
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-3">{activeOrders.length}</div>
          <p className="text-xs text-slate-500 mt-1">Pedidos pendientes o en tránsito</p>
        </div>

        {/* Ganancia / Pendiente Hoy (Se oculta si ya se cobró todo lo de hoy) */}
        {todaySettlement.pendingOrders > 0 ? (
          <div className="bg-slate-900/60 border border-amber-500/30 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                Por Cobrar Hoy (100%)
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-amber-400 mt-3 font-mono">
              ${todaySettlement.pendingVolume.toFixed(2)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {todaySettlement.pendingOrders} {todaySettlement.pendingOrders === 1 ? "carrera pendiente" : "carreras pendientes"}
            </p>
          </div>
        ) : todaySettlement.totalOrders > 0 ? (
          <div className="bg-slate-900/60 border border-emerald-500/30 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Día Cobrado (100%)
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-emerald-400 mt-3 font-mono">
              ${todaySettlement.totalVolume.toFixed(2)}
            </div>
            <p className="text-xs text-emerald-500/80 mt-1">
              {todaySettlement.totalOrders} {todaySettlement.totalOrders === 1 ? "carrera cobrada" : "carreras cobradas"}
            </p>
          </div>
        ) : null}

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Tu WhatsApp Vinculado
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-white mt-3 truncate">{user!.phone}</div>
          <p className="text-xs text-slate-500 mt-1">Número receptor de alertas</p>
        </div>
      </div>

      {/* Quick Merchants Overview */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Tus Comercios Afiliados</h2>
            <p className="text-xs text-slate-400">Cada comercio tiene su link único para solicitar entregas</p>
          </div>
          <Link
            href="/app/merchants"
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            <span>Ver todos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {merchants.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
            <Store className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">Aún no has afiliado comercios.</p>
            <Link
              href="/app/merchants"
              className="inline-block mt-3 text-xs font-bold text-amber-400 hover:underline"
            >
              + Afiliar tu primer comercio ahora
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {merchants.slice(0, 3).map((m) => (
              <div
                key={m.id}
                className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-white text-sm">{m.businessName}</h3>
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
                      {m._count.orders} pedidos
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">{m.address}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-700/40 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-mono text-[11px]">/m/{m.publicToken}</span>
                  <Link
                    href={`/m/${m.publicToken}`}
                    target="_blank"
                    className="text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1"
                  >
                    <span>Abrir link</span>
                    <Share2 className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Solicitudes y Pedidos Recientes */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Solicitudes de Envío Recientes</h2>
            <p className="text-xs text-slate-400">Pedidos generados desde los links de tus comercios afiliados</p>
          </div>
          <Link
            href="/app/orders"
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            <span>Gestionar todos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
            <Package className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">Aún no hay pedidos registrados.</p>
            <p className="text-xs text-slate-500 mt-1">
              Comparte el link de tus comercios para que comiencen a cotizar y solicitar despachos.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => {
              const statusConfig: Record<string, { label: string; badge: string }> = {
                DRAFT_SUBMITTED: {
                  label: "Solicitado (Pendiente)",
                  badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                },
                CONFIRMED_PICKUP: {
                  label: "Confirmado (Buscando)",
                  badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                },
                IN_TRANSIT: {
                  label: "En camino",
                  badge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
                },
                DELIVERED: {
                  label: "Entregado",
                  badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                },
                CANCELLED: {
                  label: "Cancelado",
                  badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
                },
                PENDING: {
                  label: "Pendiente",
                  badge: "bg-slate-800 text-slate-300 border-slate-700",
                },
              };

              const statusInfo = statusConfig[o.status] || {
                label: o.status,
                badge: "bg-slate-800 text-slate-300 border-slate-700",
              };

              return (
                <div
                  key={o.id}
                  className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-400">{o.orderNumber}</span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${statusInfo.badge}`}>
                        {statusInfo.label}
                      </span>
                      <span className="text-xs text-slate-400">· {o.merchant?.businessName}</span>
                    </div>

                    <div className="text-sm font-semibold text-white">
                      {o.packageDescription || "Paquete"} {o.packageSize ? `(${o.packageSize})` : ""}
                    </div>

                    <div className="text-xs text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                      <span>Destinatario: <strong className="text-slate-300">{o.recipientName}</strong> ({o.recipientPhone})</span>
                      <span>Destino: <strong className="text-slate-300">{o.dropoffAddress}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 sm:border-l sm:border-slate-700/60 sm:pl-6">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Tarifa (100%)</div>
                      <div className="text-sm font-bold text-white font-mono">
                        ${o.totalCost.toFixed(2)}{" "}
                        <span className="text-emerald-400 text-xs font-normal">
                          (100% para ti)
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">{o.distanceKm.toFixed(2)} km</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
