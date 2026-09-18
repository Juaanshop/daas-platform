import { NextRequest, NextResponse } from "next/server";
import { getCurrentDeliveryUser } from "@/lib/auth";
import { SettlementService } from "@/services/settlement";
import { WhatsAppService } from "@/services/whatsapp";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentDeliveryUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode"); // "daily" | "all"
    const dateParam = searchParams.get("date"); // YYYY-MM-DD

    const isAllTime = mode === "all";

    const settlement = await SettlementService.getDailySettlement({
      isAllTime,
      date: dateParam || undefined,
      deliveryUserId: user.id,
    });

    // Enriquecer la lista de comercios con el enlace de cobro de WhatsApp
    const merchantsWithWhatsApp = settlement.merchants.map((m) => {
      let whatsappUrl: string | null = null;
      let whatsappMessage: string | null = null;

      if (m.phone) {
        const notif = WhatsAppService.generateDailySettlementToMerchant({
          merchantName: m.businessName,
          merchantPhone: m.phone,
          deliveryName: user.name,
          date: settlement.date,
          ordersCount: m.totalOrders,
          totalAmount: m.totalSpent,
          orderNumbers: m.orderNumbers || [],
        });
        whatsappUrl = notif.whatsappUrl;
        whatsappMessage = notif.message;
      }

      return {
        ...m,
        whatsappUrl,
        whatsappMessage,
      };
    });

    return NextResponse.json({
      ok: true,
      settlement: {
        ...settlement,
        merchants: merchantsWithWhatsApp,
      },
    });
  } catch (error: any) {
    console.error("Error al obtener liquidación del delivery:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Error al procesar liquidación" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentDeliveryUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { date, merchantId, orderId } = body;

    const whereClause: any = {
      deliveryUserId: user.id,
      status: "DELIVERED",
      isSettled: false,
    };

    if (orderId) {
      whereClause.id = orderId;
    } else if (merchantId) {
      whereClause.merchantId = merchantId;
      if (date) {
        const [year, month, day] = date.split("-").map(Number);
        const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
        const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
        whereClause.deliveredAt = { gte: startOfDay, lte: endOfDay };
      }
    } else if (date) {
      const [year, month, day] = date.split("-").map(Number);
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
      whereClause.deliveredAt = { gte: startOfDay, lte: endOfDay };
    }

    const updateResult = await prisma.order.updateMany({
      where: whereClause,
      data: {
        isSettled: true,
        settledAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      settledCount: updateResult.count,
      message: `Se marcaron ${updateResult.count} despachos como cobrados.`,
    });
  } catch (error: any) {
    console.error("Error al marcar como cobrado:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Error al procesar cobro" },
      { status: 500 }
    );
  }
}

