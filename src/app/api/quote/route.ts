import { NextRequest, NextResponse } from "next/server";
import { PricingService } from "@/services/pricing";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { origin, destination, baseFee } = body;

    if (
      !origin ||
      !Array.isArray(origin) ||
      origin.length !== 2 ||
      !destination ||
      !Array.isArray(destination) ||
      destination.length !== 2
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Origen y destino deben ser pares de coordenadas [lat, lng]",
        },
        { status: 400 }
      );
    }

    const quote = await PricingService.calculateQuoteAsync({
      origin: [Number(origin[0]), Number(origin[1])],
      destination: [Number(destination[0]), Number(destination[1])],
      baseFee: baseFee !== undefined ? Number(baseFee) : undefined,
    });

    return NextResponse.json({
      ok: true,
      quote,
    });
  } catch (error: any) {
    console.error("Error al cotizar despacho:", error);
    return NextResponse.json(
      { ok: false, error: "Error al calcular cotización", details: error.message },
      { status: 500 }
    );
  }
}
