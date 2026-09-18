import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PricingService } from "@/services/pricing";
import { GeofenceService } from "@/services/geofence";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { dropoffLat, dropoffLng, pickupLat, pickupLng } = body;

    const merchant = await prisma.merchant.findUnique({
      where: { publicToken: token },
    });

    if (!merchant || !merchant.isActive) {
      return NextResponse.json(
        { error: "Comercio no encontrado o inactivo" },
        { status: 404 }
      );
    }

    const originLat = pickupLat !== undefined ? parseFloat(pickupLat) : merchant.latitude;
    const originLng = pickupLng !== undefined ? parseFloat(pickupLng) : merchant.longitude;
    const destLat = parseFloat(dropoffLat);
    const destLng = parseFloat(dropoffLng);

    if (isNaN(destLat) || isNaN(destLng)) {
      return NextResponse.json(
        { error: "Coordenadas de destino requeridas e inválidas" },
        { status: 400 }
      );
    }

    // Validar Geocerca
    const coverage = GeofenceService.validateDispatchCoverage(
      [originLat, originLng],
      [destLat, destLng]
    );

    if (!coverage.isValid) {
      return NextResponse.json({
        isCovered: false,
        error:
          coverage.error ||
          "El trayecto está fuera de la zona de cobertura autorizada (Valencia, Naguanagua y San Diego).",
      });
    }

    // Calcular cotización vial real
    const quote = await PricingService.calculateQuoteAsync({
      origin: [originLat, originLng],
      destination: [destLat, destLng],
    });

    const riderEarnings = Number((quote.totalCost * 0.8).toFixed(2));

    return NextResponse.json({
      isCovered: true,
      quote: {
        ...quote,
        riderEarnings,
      },
    });
  } catch (error: any) {
    console.error("Error en cotización de comercio:", error);
    return NextResponse.json(
      { error: "Error al calcular la cotización" },
      { status: 500 }
    );
  }
}
