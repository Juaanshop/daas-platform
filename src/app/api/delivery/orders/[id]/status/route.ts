import { NextResponse } from "next/server";
import { getCurrentDeliveryUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isValidTransition } from "@/lib/validators";
import { WhatsAppService } from "@/services/whatsapp";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentDeliveryUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const { status: targetStatus } = body;

    if (!targetStatus) {
      return NextResponse.json(
        { error: "Se requiere el nuevo estado para la órden" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        merchant: true,
        deliveryUser: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Órden no encontrada" }, { status: 404 });
    }

    if (order.deliveryUserId !== user.id) {
      return NextResponse.json(
        { error: "No tienes permisos para modificar esta órden" },
        { status: 403 }
      );
    }

    if (!isValidTransition(order.status, targetStatus)) {
      return NextResponse.json(
        {
          error: `Transición inválida: no se puede pasar de ${order.status} a ${targetStatus}`,
        },
        { status: 422 }
      );
    }

    const now = new Date();
    const updateData: any = {
      status: targetStatus,
    };

    let whatsappNotification = null;

    if (targetStatus === "CONFIRMED_PICKUP") {
      updateData.confirmedAt = now;
    } else if (targetStatus === "IN_TRANSIT") {
      updateData.pickedUpAt = now;
      const estimatedMinutes = Math.max(
        5,
        Math.round((order.distanceKm / 35) * 60)
      );

      whatsappNotification = WhatsAppService.generateInTransitToRecipient({
        recipientPhone: order.recipientPhone,
        deliveryName: user.name,
        businessName: order.merchant.businessName,
        estimatedMinutes,
        dropoffAddress: order.dropoffAddress,
      });
    } else if (targetStatus === "DELIVERED") {
      updateData.deliveredAt = now;
      if (!order.riderEarnings) {
        updateData.riderEarnings = Math.round(order.totalCost * 0.8 * 100) / 100;
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        merchant: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        order: updatedOrder,
        whatsappNotification,
        whatsappUrl: whatsappNotification?.whatsappUrl || null,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error al actualizar estado de órden:", error);
    return NextResponse.json(
      { error: "Error al actualizar el estado de la órden" },
      { status: 500 }
    );
  }
}
