import { NextResponse } from "next/server";
import { getCurrentDeliveryUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GeofenceService } from "@/services/geofence";
import crypto from "crypto";

export async function GET() {
  const user = await getCurrentDeliveryUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const merchants = await prisma.merchant.findMany({
    where: { deliveryUserId: user.id },
    include: {
      _count: {
        select: { orders: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ merchants });
}

export async function POST(request: Request) {
  const user = await getCurrentDeliveryUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { businessName, address, latitude, longitude, phone } = body;

    if (!businessName || !address || latitude === undefined || longitude === undefined || !phone) {
      return NextResponse.json(
        { error: "Todos los campos son obligatorios (nombre, dirección, coordenadas y teléfono)" },
        { status: 400 }
      );
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: "Coordenadas geográficas inválidas" },
        { status: 400 }
      );
    }

    // Validar Geocerca Carabobo (Valencia, Naguanagua, San Diego)
    const coverage = GeofenceService.checkLocationCoverage(lat, lng);
    if (!coverage.isCovered) {
      return NextResponse.json(
        {
          error:
            coverage.error ||
            "La ubicación del comercio está fuera de la zona de cobertura autorizada (Valencia, Naguanagua y San Diego)",
        },
        { status: 400 }
      );
    }

    // Generar publicToken único
    const baseSlug = businessName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    const randomSuffix = crypto.randomBytes(3).toString("hex");
    const publicToken = `${baseSlug || "comercio"}-${randomSuffix}`;

    const merchant = await prisma.merchant.create({
      data: {
        deliveryUserId: user.id,
        publicToken,
        businessName: businessName.trim(),
        address: address.trim(),
        latitude: lat,
        longitude: lng,
        phone: phone.trim(),
        balance: 0.0,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, merchant }, { status: 201 });
  } catch (error) {
    console.error("Error al crear comercio afiliado:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al afiliar el comercio" },
      { status: 500 }
    );
  }
}
