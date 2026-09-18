import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PricingService } from "@/services/pricing";
import { GeofenceService } from "@/services/geofence";
import { WhatsAppService } from "@/services/whatsapp";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();

    const {
      packageDescription,
      packageSize = "MEDIUM",
      recipientName,
      recipientPhone,
      dropoffAddress,
      dropoffLat,
      dropoffLng,
      dropoffMapUrl,
      pickupAddress,
      pickupLat,
      pickupLng,
      packageNotes,
    } = body;

    // 1. Validar que el comercio exista y tenga repartidor asignado
    const merchant = await prisma.merchant.findUnique({
      where: { publicToken: token },
      include: {
        deliveryUser: true,
      },
    });

    if (!merchant || !merchant.isActive) {
      return NextResponse.json(
        { error: "Comercio no encontrado o inactivo" },
        { status: 404 }
      );
    }

    if (!merchant.deliveryUserId || !merchant.deliveryUser) {
      return NextResponse.json(
        { error: "Este comercio no tiene un repartidor asignado actualmente" },
        { status: 400 }
      );
    }

    // 2. Validar campos requeridos
    if (!packageDescription || !recipientName || !recipientPhone || !dropoffAddress) {
      return NextResponse.json(
        { error: "Todos los campos principales del paquete y destinatario son requeridos" },
        { status: 400 }
      );
    }

    const oLat = pickupLat !== undefined ? parseFloat(pickupLat) : merchant.latitude;
    const oLng = pickupLng !== undefined ? parseFloat(pickupLng) : merchant.longitude;
    const pAddress = pickupAddress?.trim() || merchant.address;

    const dLat = parseFloat(dropoffLat);
    const dLng = parseFloat(dropoffLng);

    if (isNaN(dLat) || isNaN(dLng)) {
      return NextResponse.json(
        { error: "Ubicación de destino no especificada o coordenadas inválidas" },
        { status: 400 }
      );
    }

    // 3. Validar cobertura geográfica con GeofenceService
    const coverage = GeofenceService.validateDispatchCoverage(
      [oLat, oLng],
      [dLat, dLng]
    );

    if (!coverage.isValid) {
      return NextResponse.json(
        {
          error:
            coverage.error ||
            "El destino está fuera de la zona de cobertura autorizada (Valencia, Naguanagua y San Diego).",
        },
        { status: 400 }
      );
    }

    // 4. Calcular tarifas con PricingService
    const quote = PricingService.calculateQuote({
      origin: [oLat, oLng],
      destination: [dLat, dLng],
    });

    const riderEarnings = Number((quote.totalCost * 0.8).toFixed(2));
    const orderNumber = `#ORD-${Date.now().toString().slice(-4)}`;

    // 5. Persistir el pedido en base de datos en estado DRAFT_SUBMITTED
    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        merchantId: merchant.id,
        deliveryUserId: merchant.deliveryUserId,
        pickupAddress: pAddress,
        pickupLat: oLat,
        pickupLng: oLng,
        dropoffAddress: dropoffAddress.trim(),
        dropoffLat: dLat,
        dropoffLng: dLng,
        dropoffMapUrl: dropoffMapUrl || null,
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        packageDescription: packageDescription.trim(),
        packageSize,
        packageNotes: packageNotes?.trim() || null,
        baseFee: quote.baseFee,
        distanceKm: quote.distanceKm,
        totalCost: quote.totalCost,
        riderEarnings,
        status: "DRAFT_SUBMITTED",
      },
    });

    // 6. Generar el mensaje y enlace wa.me para notificar al repartidor
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const appOrderUrl = `${protocol}://${host}/app`;

    const waNotification = WhatsAppService.generateNewRequestToDelivery({
      deliveryPhone: merchant.deliveryUser.phone,
      orderNumber: newOrder.orderNumber,
      businessName: merchant.businessName,
      packageDescription: newOrder.packageDescription || "Paquete",
      packageSize: newOrder.packageSize || "MEDIUM",
      recipientName: newOrder.recipientName,
      recipientPhone: newOrder.recipientPhone,
      pickupAddress: newOrder.pickupAddress,
      dropoffAddress: newOrder.dropoffAddress,
      dropoffLat: newOrder.dropoffLat,
      dropoffLng: newOrder.dropoffLng,
      distanceKm: newOrder.distanceKm,
      totalCost: newOrder.totalCost,
      riderEarnings,
      appOrderUrl,
    });

    return NextResponse.json(
      {
        success: true,
        order: newOrder,
        whatsappUrl: waNotification.whatsappUrl,
        whatsappMessage: waNotification.message,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error al crear solicitud de orden:", error);
    return NextResponse.json(
      { error: "Error al procesar y registrar la solicitud de envío" },
      { status: 500 }
    );
  }
}
