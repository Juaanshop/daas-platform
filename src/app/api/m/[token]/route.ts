import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: "Token no proporcionado" }, { status: 400 });
    }

    const merchant = await prisma.merchant.findUnique({
      where: { publicToken: token },
      select: {
        id: true,
        businessName: true,
        address: true,
        latitude: true,
        longitude: true,
        phone: true,
        isActive: true,
        deliveryUser: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!merchant || !merchant.isActive) {
      return NextResponse.json(
        { error: "Comercio no encontrado o inactivo" },
        { status: 404 }
      );
    }

    return NextResponse.json({ merchant });
  } catch (error) {
    console.error("Error al consultar comercio por token:", error);
    return NextResponse.json(
      { error: "Error al consultar los datos del comercio" },
      { status: 500 }
    );
  }
}
