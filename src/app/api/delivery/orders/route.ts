import { NextResponse } from "next/server";
import { getCurrentDeliveryUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentDeliveryUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status"); // all, pending, active, delivered, cancelled

  const whereClause: any = {
    deliveryUserId: user.id,
  };

  if (statusFilter === "pending") {
    whereClause.status = "DRAFT_SUBMITTED";
  } else if (statusFilter === "active") {
    whereClause.status = { in: ["DRAFT_SUBMITTED", "CONFIRMED_PICKUP", "IN_TRANSIT"] };
  } else if (statusFilter === "delivered") {
    whereClause.status = "DELIVERED";
  } else if (statusFilter === "cancelled") {
    whereClause.status = "CANCELLED";
  }

  try {
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        merchant: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedOrders = orders.map((o) => {
      const durationMin = Math.max(5, Math.round(((o.distanceKm || 1) / 35) * 60));
      return {
        ...o,
        fee: o.totalCost,
        description: o.packageDescription || "Paquete",
        durationMin,
      };
    });

    return NextResponse.json({ orders: formattedOrders });
  } catch (error: any) {
    console.error("Error al obtener órdenes del delivery:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
