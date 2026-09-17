import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createOrderSchema } from "@/lib/validators";
import { PricingService } from "@/services/pricing";
import { eventHub } from "@/lib/events";
import { getGoogleMapsSearchUrl } from "@/lib/maps";

// GET /api/orders
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const merchantId = searchParams.get("merchantId");
    const riderId = searchParams.get("riderId");
    const status = searchParams.get("status");
    const active = searchParams.get("active");

    const where: any = {};

    if (merchantId) where.merchantId = merchantId;
    if (riderId) where.riderId = riderId;
    if (status) where.status = status;

    if (active === "true") {
      where.status = {
        in: ["PENDING", "ASSIGNED", "PICKING_UP", "IN_TRANSIT"],
      };
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        merchant: true,
        rider: {
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json({ ok: true, orders });
  } catch (error: any) {
    console.error("Error al obtener órdenes:", error);
    return NextResponse.json(
      { ok: false, error: "Error al listar órdenes", details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/orders
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = createOrderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Datos de orden inválidos",
          issues: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verificar existencia del comercio
    const merchant = await prisma.merchant.findUnique({
      where: { id: data.merchantId },
    });

    if (!merchant) {
      return NextResponse.json(
        { ok: false, error: "Comercio no encontrado" },
        { status: 404 }
      );
    }

    // Calcular tarifa automáticamente mediante PricingService (con tarifa base variable y ruteo vial Google Maps)
    const quote = await PricingService.calculateQuoteAsync({
      origin: [data.pickupLat, data.pickupLng],
      destination: [data.dropoffLat, data.dropoffLng],
      baseFee: data.baseFee,
    });

    if (!quote.isCovered) {
      return NextResponse.json(
        {
          ok: false,
          error:
            quote.coverageError ||
            "Punto de despacho fuera de la zona autorizada de Valencia, Naguanagua y San Diego (Carabobo, Venezuela)",
        },
        { status: 400 }
      );
    }

    // Generar correlativo #ORD-XXXX
    const totalOrdersCount = await prisma.order.count();
    const orderNumber = `#ORD-${1001 + totalOrdersCount}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        merchantId: data.merchantId,
        pickupAddress: data.pickupAddress,
        pickupLat: data.pickupLat,
        pickupLng: data.pickupLng,
        dropoffAddress: data.dropoffAddress,
        dropoffLat: data.dropoffLat,
        dropoffLng: data.dropoffLng,
        dropoffMapUrl:
          data.dropoffMapUrl ||
          getGoogleMapsSearchUrl(
            data.dropoffLat,
            data.dropoffLng,
            data.dropoffAddress
          ),
        recipientName: data.recipientName,
        recipientPhone: data.recipientPhone,
        packageNotes: data.packageNotes || null,
        baseFee: quote.baseFee,
        distanceKm: quote.distanceKm,
        totalCost: quote.totalCost,
        status: "PENDING",
      },
      include: {
        merchant: true,
      },
    });

    // Notificar por SSE en tiempo real
    eventHub.broadcast("order:created", order);

    return NextResponse.json({ ok: true, order, quote }, { status: 201 });
  } catch (error: any) {
    console.error("Error al crear orden:", error);
    return NextResponse.json(
      { ok: false, error: "Error al crear la orden", details: error.message },
      { status: 500 }
    );
  }
}
