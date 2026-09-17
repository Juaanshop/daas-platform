import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { updateOrderStatusSchema, isValidTransition } from "@/lib/validators";
import { eventHub } from "@/lib/events";
import { WhatsAppService } from "@/services/whatsapp";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const validation = updateOrderStatusSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Datos de actualización inválidos",
          issues: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const { status: targetStatus, riderId } = validation.data;

    // Buscar la orden actual
    const currentOrder = await prisma.order.findUnique({
      where: { id },
      include: { rider: true, merchant: true },
    });

    if (!currentOrder) {
      return NextResponse.json(
        { ok: false, error: "Orden no encontrada" },
        { status: 404 }
      );
    }

    // Validar transición legal de estados
    if (!isValidTransition(currentOrder.status, targetStatus)) {
      return NextResponse.json(
        {
          ok: false,
          error: `Transición de estado inválida: no se puede pasar de ${currentOrder.status} a ${targetStatus}`,
        },
        { status: 422 }
      );
    }

    // Lógica específica por estado objetivo
    const updateData: any = {
      status: targetStatus,
    };

    let whatsappNotification: any = null;

    if (targetStatus === "ASSIGNED") {
      const assignedRiderId = riderId || currentOrder.riderId;
      if (!assignedRiderId) {
        return NextResponse.json(
          {
            ok: false,
            error: "Se requiere un riderId para asignar el despacho a un repartidor",
          },
          { status: 400 }
        );
      }

      // Validar repartidor
      const rider = await prisma.rider.findUnique({
        where: { id: assignedRiderId },
        include: { user: true },
      });

      if (!rider) {
        return NextResponse.json(
          { ok: false, error: "Repartidor no encontrado" },
          { status: 404 }
        );
      }

      updateData.riderId = assignedRiderId;

      // Marcar repartidor como ocupado
      await prisma.rider.update({
        where: { id: assignedRiderId },
        data: { status: "BUSY" },
      });

      // Generar notificación completa de WhatsApp con datos del negocio, cliente y links a Google Maps
      whatsappNotification = WhatsAppService.generateDispatchNotification({
        orderNumber: currentOrder.orderNumber,
        totalCost: currentOrder.totalCost,
        pickupAddress: currentOrder.pickupAddress,
        pickupLat: currentOrder.pickupLat,
        pickupLng: currentOrder.pickupLng,
        dropoffAddress: currentOrder.dropoffAddress,
        dropoffLat: currentOrder.dropoffLat,
        dropoffLng: currentOrder.dropoffLng,
        recipientName: currentOrder.recipientName,
        recipientPhone: currentOrder.recipientPhone,
        packageNotes: currentOrder.packageNotes,
        merchantName: currentOrder.merchant.businessName,
        merchantPhone: currentOrder.merchant.phone,
        riderName: rider.user.name,
        riderPhone: rider.phone,
      });
    }

    if (targetStatus === "IN_TRANSIT" && !currentOrder.pickedUpAt) {
      updateData.pickedUpAt = new Date();
    }

    if (targetStatus === "DELIVERED") {
      updateData.deliveredAt = new Date();

      // Liberar al repartidor a IDLE
      const assignedRiderId = currentOrder.riderId || riderId;
      if (assignedRiderId) {
        await prisma.rider.update({
          where: { id: assignedRiderId },
          data: { status: "IDLE" },
        });
      }
    }

    if (targetStatus === "CANCELLED") {
      // Si tenía rider asignado, liberarlo a IDLE
      if (currentOrder.riderId) {
        await prisma.rider.update({
          where: { id: currentOrder.riderId },
          data: { status: "IDLE" },
        });
      }
    }

    // Actualizar orden
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        merchant: true,
        rider: {
          include: {
            user: true,
          },
        },
      },
    });

    // Notificar en tiempo real con datos de la orden y payload de WhatsApp
    eventHub.broadcast("order:status_updated", {
      ...updatedOrder,
      whatsappNotification,
    });

    return NextResponse.json({
      ok: true,
      order: updatedOrder,
      whatsappNotification,
    });
  } catch (error: any) {
    console.error("Error al actualizar estado de orden:", error);
    return NextResponse.json(
      { ok: false, error: "Error interno del servidor", details: error.message },
      { status: 500 }
    );
  }
}
