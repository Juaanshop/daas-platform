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
    <div className="space-y-6 sm:space-y-8">
      {/* Header Banner Compacto */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-base sm:text-2xl font-black text-white tracking-tight">
              ¡Hola, {user!.name}! 🛵
            </h1>
            <p className="text-slate-400 mt-0.5 text-xs sm:text-sm">
              Panel operativo de despachos y comercios afiliados.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <Link
            href="/app/merchants"
            className="inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold px-3 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-xs active:scale-95 cursor-pointer truncate"
          >
            <PlusCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Afiliar Comercio</span>
          </Link>
          <Link
            href="/app/settlements"
            className="inline-flex items-center justify-center gap-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-bold px-3 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm transition-all border border-slate-700/80 active:scale-95 cursor-pointer truncate"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">Cierre Diario</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row (3 columnas compactas en móvil para ver todo de un vistazo) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-2.5 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">
              Comercios
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Store className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-white mt-1.5 font-mono">{merchants.length}</div>
          <p className="text-[9px] sm:text-xs text-slate-500 mt-0.5 truncate">Con links activos</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-2.5 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">
              Solicitudes
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
              <Package className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-400 mt-1.5 font-mono">{activeOrders.length}</div>
          <p className="text-[9px] sm:text-xs text-slate-500 mt-0.5 truncate">Pendientes o ruta</p>
        </div>

        {todaySettlement.pendingOrders > 0 ? (
          <div className="bg-slate-900/70 border border-amber-500/30 rounded-xl p-2.5 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold text-amber-400 uppercase tracking-wider truncate">
                Por Cobrar
              </span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-amber-400 mt-1.5 font-mono">
              ${todaySettlement.pendingVolume.toFixed(2)}
            </div>
            <p className="text-[9px] sm:text-xs text-slate-500 mt-0.5 truncate">
              {todaySettlement.pendingOrders} pend.
            </p>
          </div>
        ) : (
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-2.5 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-semibold text-emerald-400 uppercase tracking-wider truncate">
                Cobrado
              </span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 mt-1.5 font-mono">
              ${todaySettlement.totalVolume.toFixed(2)}
            </div>
            <p className="text-[9px] sm:text-xs text-slate-500 mt-0.5 truncate">
              {todaySettlement.totalOrders} completadas
            </p>
          </div>
        )}
      </div>

      {/* Quick Merchants Overview Compacto */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm sm:text-lg font-bold text-white">Comercios Afiliados</h2>
            <p className="text-[11px] sm:text-xs text-slate-400">Links activos para solicitar entregas</p>
          </div>
          <Link
            href="/app/merchants"
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 shrink-0"
          >
            <span>Ver todos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {merchants.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl">
            <Store className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Aún no has afiliado comercios.</p>
            <Link
              href="/app/merchants"
              className="inline-block mt-2 text-xs font-bold text-amber-400 hover:underline"
            >
              + Afiliar tu primer comercio ahora
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
            {merchants.slice(0, 3).map((m) => (
              <div
                key={m.id}
                className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3 flex flex-col justify-between gap-2"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-white text-xs sm:text-sm truncate">{m.businessName}</h3>
                    <span className="text-[9px] bg-amber-500/10 text-amber-400 font-bold px-1.5 py-0.5 rounded-full border border-amber-500/20 whitespace-nowrap shrink-0">
                      {m._count.orders} ped.
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">{m.address}</p>
                </div>

                <div className="pt-2 border-t border-slate-700/40 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-mono text-[10px] truncate">/m/{m.publicToken}</span>
                  <Link
                    href={`/m/${m.publicToken}`}
                    target="_blank"
                    className="text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1 text-[11px] shrink-0"
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
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm sm:text-lg font-bold text-white">Solicitudes de Envío Recientes</h2>
            <p className="text-[11px] sm:text-xs text-slate-400">Pedidos de tus comercios afiliados</p>
          </div>
          <Link
            href="/app/orders"
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 shrink-0"
          >
            <span>Gestionar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl">
            <Package className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Aún no hay pedidos registrados.</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Comparte el link de tus comercios para que comiencen a cotizar y solicitar despachos.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {orders.map((o) => {
              const statusConfig: Record<string, { label: string; badge: string }> = {
                DRAFT_SUBMITTED: {
                  label: "Solicitado",
                  badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                },
                CONFIRMED_PICKUP: {
                  label: "Por Retirar",
                  badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                },
                IN_TRANSIT: {
                  label: "En Camino",
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
                  className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3 sm:p-4 transition-all"
                >
                  {/* Top Row: Order Number + Status Badge + Merchant + Price */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-mono text-xs font-black text-amber-400 whitespace-nowrap shrink-0">
                        {o.orderNumber}
                      </span>
                      <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${statusInfo.badge}`}>
                        {statusInfo.label}
                      </span>
                      <span className="text-xs text-slate-400 truncate font-medium min-w-0">
                        &bull; {o.merchant?.businessName}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-sm font-black text-emerald-400 whitespace-nowrap">
                        ${o.totalCost.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Package Description */}
                  <div className="text-xs font-semibold text-white truncate mt-1">
                    {o.packageDescription || "Paquete"} {o.packageSize ? `(${o.packageSize})` : ""}
                  </div>

                  {/* Recipient & Destination in Clean Format */}
                  <div className="text-[11px] text-slate-400 mt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-2">
                    <div className="truncate">
                      <span className="text-slate-500">Para:</span>{" "}
                      <strong className="text-slate-300 font-medium">{o.recipientName}</strong>{" "}
                      <span className="text-slate-500 font-mono">({o.recipientPhone})</span>
                    </div>
                    <div className="truncate text-slate-400">
                      <span className="text-slate-500">Destino:</span> {o.dropoffAddress}
                    </div>
                    <div className="text-[10px] text-slate-500 shrink-0 font-mono">
                      {o.distanceKm.toFixed(1)} km &bull; 100% tuyo
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
