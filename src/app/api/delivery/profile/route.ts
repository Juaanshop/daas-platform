import { NextResponse } from "next/server";
import { getCurrentDeliveryUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { WhatsAppService } from "@/services/whatsapp";

export async function GET() {
  const user = await getCurrentDeliveryUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const deliveryUser = await prisma.deliveryUser.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, email: true, phone: true },
  });

  if (!deliveryUser) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ user: deliveryUser });
}

export async function PATCH(request: Request) {
  const user = await getCurrentDeliveryUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { phone, name } = body;

    if (!phone || typeof phone !== "string" || !phone.trim()) {
      return NextResponse.json(
        { error: "Se requiere un número de teléfono válido para WhatsApp" },
        { status: 400 }
      );
    }

    const cleanDigits = WhatsAppService.cleanPhoneNumber(phone);
    if (cleanDigits.length < 10) {
      return NextResponse.json(
        { error: "El número debe incluir código de país y al menos 10 dígitos (ej. +584141234567)" },
        { status: 400 }
      );
    }

    const formattedPhone = phone.startsWith("+") ? phone.trim() : `+${cleanDigits}`;

    const updated = await prisma.deliveryUser.update({
      where: { id: user.id },
      data: {
        phone: formattedPhone,
        ...(name && typeof name === "string" && name.trim() ? { name: name.trim() } : {}),
      },
      select: { id: true, name: true, email: true, phone: true },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    console.error("Error al actualizar perfil de delivery:", error);
    return NextResponse.json(
      { error: "Error interno al actualizar el perfil" },
      { status: 500 }
    );
  }
}
