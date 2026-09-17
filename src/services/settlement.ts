import { prisma } from "../lib/db";

export interface CustomerRecord {
  recipientName: string;
  recipientPhone: string;
  totalOrders: number;
  totalSpent: number;
  avgTicket: number;
  lastAddress: string;
  lastDeliveredAt: string;
  ordersCount: number;
}

export interface RiderSettlementRecord {
  riderId: string;
  riderName: string;
  vehiclePlate: string;
  totalDeliveries: number;
  totalEarned: number; // 80% de totalCost
  totalKm: number;
  avgPerTrip: number;
}

export interface ItemizedDispatchRecord {
  id: string;
  orderNumber: string;
  merchantId: string;
  merchantName: string;
  riderId: string | null;
  riderName: string;
  riderPlate: string;
  recipientName: string;
  recipientPhone: string;
  dropoffAddress: string;
  distanceKm: number;
  totalCost: number;
  riderEarnings: number; // 80%
  platformFee: number; // 20%
  deliveredAt: string;
}

export interface SettlementSummary {
  date: string;
  isAllTime: boolean;
  totalOrders: number;
  totalVolume: number;
  totalRiderFees: number;
  totalPlatformMargin: number;
  totalKmDelivered: number;
  merchants: {
    merchantId: string;
    businessName: string;
    totalOrders: number;
    totalSpent: number;
  }[];
  riders: RiderSettlementRecord[];
  customers: CustomerRecord[];
  dispatches: ItemizedDispatchRecord[];
}

export interface SettlementOptions {
  date?: string | Date;
  isAllTime?: boolean;
}

export class SettlementService {
  /**
   * Obtiene o calcula el corte de caja para comercios, repartidores, clientes y libro mayor de despachos
   */
  static async getDailySettlement(options?: SettlementOptions | Date): Promise<SettlementSummary> {
    let isAllTime = false;
    let targetDateStr = new Date().toISOString().split("T")[0];
    let startOfDay: Date | undefined;
    let endOfDay: Date | undefined;

    if (options instanceof Date) {
      targetDateStr = options.toISOString().split("T")[0];
      const y = options.getFullYear();
      const m = options.getMonth();
      const d = options.getDate();
      startOfDay = new Date(y, m, d, 0, 0, 0, 0);
      endOfDay = new Date(y, m, d, 23, 59, 59, 999);
    } else if (options) {
      if (options.isAllTime) {
        isAllTime = true;
      } else if (options.date) {
        const raw = typeof options.date === "string" ? options.date : options.date.toISOString().split("T")[0];
        targetDateStr = raw;
        const [year, month, day] = raw.split("-").map(Number);
        startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
        endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
      } else {
        const now = new Date();
        startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      }
    } else {
      const now = new Date();
      startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    }

    const whereClause: any = {
      status: "DELIVERED",
    };

    if (!isAllTime && startOfDay && endOfDay) {
      whereClause.deliveredAt = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    // Obtener órdenes entregadas
    const deliveredOrders = await prisma.order.findMany({
      where: whereClause,
      orderBy: { deliveredAt: "desc" },
      include: {
        merchant: true,
        rider: {
          include: {
            user: true,
          },
        },
      },
    });

    // Mapeo por Comercio
    const merchantMap = new Map<
      string,
      { merchantId: string; businessName: string; totalOrders: number; totalSpent: number }
    >();

    // Mapeo por Repartidor
    const riderMap = new Map<
      string,
      {
        riderId: string;
        riderName: string;
        vehiclePlate: string;
        totalDeliveries: number;
        totalEarned: number;
        totalKm: number;
      }
    >();

    // Mapeo por Cliente (destinatario)
    const customerMap = new Map<
      string,
      {
        recipientName: string;
        recipientPhone: string;
        totalOrders: number;
        totalSpent: number;
        lastAddress: string;
        lastDeliveredAt: string;
      }
    >();

    const dispatches: ItemizedDispatchRecord[] = [];

    let totalVolume = 0;
    let totalKmDelivered = 0;

    for (const order of deliveredOrders) {
      const cost = Math.round(order.totalCost * 100) / 100;
      const riderEarnings = Math.round(cost * 0.8 * 100) / 100;
      const platformFee = Math.round((cost - riderEarnings) * 100) / 100;
      const km = order.distanceKm || 0;
      const deliveredDateStr = order.deliveredAt ? order.deliveredAt.toISOString() : order.createdAt.toISOString();

      totalVolume += cost;
      totalKmDelivered += km;

      // 1. Acumulador Comercio
      const mId = order.merchantId;
      const mExisting = merchantMap.get(mId) || {
        merchantId: mId,
        businessName: order.merchant.businessName,
        totalOrders: 0,
        totalSpent: 0,
      };
      mExisting.totalOrders += 1;
      mExisting.totalSpent = Math.round((mExisting.totalSpent + cost) * 100) / 100;
      merchantMap.set(mId, mExisting);

      // 2. Acumulador Repartidor
      const riderName = order.rider?.user?.name || "Sin Asignar";
      const riderPlate = order.rider?.vehiclePlate || "N/A";
      if (order.rider && order.riderId) {
        const rId = order.riderId;
        const rExisting = riderMap.get(rId) || {
          riderId: rId,
          riderName: order.rider.user.name,
          vehiclePlate: order.rider.vehiclePlate,
          totalDeliveries: 0,
          totalEarned: 0,
          totalKm: 0,
        };
        rExisting.totalDeliveries += 1;
        rExisting.totalEarned = Math.round((rExisting.totalEarned + riderEarnings) * 100) / 100;
        rExisting.totalKm = Math.round((rExisting.totalKm + km) * 100) / 100;
        riderMap.set(rId, rExisting);
      }

      // 3. Acumulador Cliente
      const clientKey = (order.recipientPhone || order.recipientName).trim().toLowerCase();
      const cExisting = customerMap.get(clientKey) || {
        recipientName: order.recipientName,
        recipientPhone: order.recipientPhone,
        totalOrders: 0,
        totalSpent: 0,
        lastAddress: order.dropoffAddress,
        lastDeliveredAt: deliveredDateStr,
      };
      cExisting.totalOrders += 1;
      cExisting.totalSpent = Math.round((cExisting.totalSpent + cost) * 100) / 100;
      if (new Date(deliveredDateStr) >= new Date(cExisting.lastDeliveredAt)) {
        cExisting.lastAddress = order.dropoffAddress;
        cExisting.lastDeliveredAt = deliveredDateStr;
        cExisting.recipientName = order.recipientName;
      }
      customerMap.set(clientKey, cExisting);

      // 4. Registro detallado de despacho (Itemized)
      dispatches.push({
        id: order.id,
        orderNumber: order.orderNumber,
        merchantId: order.merchantId,
        merchantName: order.merchant.businessName,
        riderId: order.riderId,
        riderName,
        riderPlate,
        recipientName: order.recipientName,
        recipientPhone: order.recipientPhone,
        dropoffAddress: order.dropoffAddress,
        distanceKm: km,
        totalCost: cost,
        riderEarnings,
        platformFee,
        deliveredAt: deliveredDateStr,
      });
    }

    // Calcular rankings
    const customers: CustomerRecord[] = Array.from(customerMap.values())
      .map((c) => ({
        ...c,
        ordersCount: c.totalOrders,
        avgTicket: c.totalOrders > 0 ? Math.round((c.totalSpent / c.totalOrders) * 100) / 100 : 0,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent);

    const riders: RiderSettlementRecord[] = Array.from(riderMap.values())
      .map((r) => ({
        ...r,
        avgPerTrip: r.totalDeliveries > 0 ? Math.round((r.totalEarned / r.totalDeliveries) * 100) / 100 : 0,
      }))
      .sort((a, b) => b.totalDeliveries - a.totalDeliveries);

    const merchants = Array.from(merchantMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);

    const totalRiderFees = riders.reduce((s, r) => s + r.totalEarned, 0);
    const totalPlatformMargin = Math.round((totalVolume - totalRiderFees) * 100) / 100;

    return {
      date: isAllTime ? "Histórico Acumulado" : targetDateStr,
      isAllTime,
      totalOrders: deliveredOrders.length,
      totalVolume: Math.round(totalVolume * 100) / 100,
      totalRiderFees: Math.round(totalRiderFees * 100) / 100,
      totalPlatformMargin: Math.max(0, totalPlatformMargin),
      totalKmDelivered: Math.round(totalKmDelivered * 100) / 100,
      merchants,
      riders,
      customers,
      dispatches,
    };
  }
}
