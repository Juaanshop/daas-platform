import { NextResponse } from "next/server";
import { getCurrentDeliveryUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GeofenceService } from "@/services/geofence";

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
    const merchant = await prisma.merchant.findUnique({
      where: { id },
    });

    if (!merchant) {
      return NextResponse.json({ error: "Comercio no encontrado" }, { status: 404 });
    }

    if (merchant.deliveryUserId !== user.id) {
      return NextResponse.json(
        { error: "No tienes permisos para modificar este comercio" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { businessName, address, latitude, longitude, phone, isActive } = body;

    const updateData: any = {};

    if (businessName !== undefined) {
      if (!businessName.trim()) {
        return NextResponse.json({ error: "El nombre del comercio no puede estar vacío" }, { status: 400 });
      }
      updateData.businessName = businessName.trim();
    }

    if (address !== undefined) {
      if (!address.trim()) {
        return NextResponse.json({ error: "La dirección no puede estar vacía" }, { status: 400 });
      }
      updateData.address = address.trim();
    }

    if (phone !== undefined) {
      if (!phone.trim()) {
        return NextResponse.json({ error: "El teléfono no puede estar vacío" }, { status: 400 });
      }
      updateData.phone = phone.trim();
    }

    if (latitude !== undefined && longitude !== undefined) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (isNaN(lat) || isNaN(lng)) {
        return NextResponse.json({ error: "Coordenadas inválidas" }, { status: 400 });
      }

      const coverage = GeofenceService.checkLocationCoverage(lat, lng);
      if (!coverage.isCovered) {
        return NextResponse.json(
          {
            error:
              coverage.error ||
              "La ubicación del comercio está fuera de la zona autorizada (Valencia, Naguanagua y San Diego)",
          },
          { status: 400 }
        );
      }

      updateData.latitude = lat;
      updateData.longitude = lng;
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    const updatedMerchant = await prisma.merchant.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, merchant: updatedMerchant });
  } catch (error) {
    console.error("Error al actualizar comercio:", error);
    return NextResponse.json(
      { error: "Error al procesar la actualización del comercio" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentDeliveryUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const merchant = await prisma.merchant.findUnique({
      where: { id },
      include: {
        orders: {
          select: { id: true },
        },
      },
    });

    if (!merchant) {
      return NextResponse.json({ error: "Comercio no encontrado" }, { status: 404 });
    }

    if (merchant.deliveryUserId !== user.id) {
      return NextResponse.json(
        { error: "No tienes permisos para eliminar este comercio" },
        { status: 403 }
      );
    }

    // Si tiene órdenes históricas, desactivar (soft-delete) para proteger el historial
    if (merchant.orders.length > 0) {
      const updated = await prisma.merchant.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        success: true,
        softDeleted: true,
        message: `El comercio tiene ${merchant.orders.length} orden(es) registradas. Ha sido desactivado para proteger el historial contable.`,
        merchant: updated,
      });
    }

    // Si no tiene órdenes, eliminar permanentemente
    await prisma.merchant.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      softDeleted: false,
      message: "Comercio eliminado permanentemente.",
    });
  } catch (error) {
    console.error("Error al eliminar comercio:", error);
    return NextResponse.json(
      { error: "Error al procesar la eliminación del comercio" },
      { status: 500 }
    );
  }
}
