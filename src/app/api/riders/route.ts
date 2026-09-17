import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { eventHub } from "@/lib/events";
import { createRiderSchema, updateRiderSchema } from "@/lib/validators";

// GET /api/riders
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const includeInactive = searchParams.get("includeInactive") === "true";

    const where: any = {};
    if (status) where.status = status;
    if (!includeInactive) {
      where.isActive = true;
    }

    const riders = await prisma.rider.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        orders: {
          select: {
            id: true,
            status: true,
            totalCost: true,
            distanceKm: true,
          },
        },
      },
    });

    return NextResponse.json({ ok: true, riders });
  } catch (error: any) {
    console.error("Error al obtener riders:", error);
    return NextResponse.json(
      { ok: false, error: "Error al listar repartidores", details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/riders (dar de alta un nuevo repartidor)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = createRiderSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Datos del repartidor inválidos";
      return NextResponse.json(
        { ok: false, error: firstError, issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { name, email, phone, vehiclePlate, status, currentLat, currentLng } = parsed.data;

    // Verificar si el correo ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { ok: false, error: "Ya existe un usuario registrado con este correo electrónico" },
        { status: 409 }
      );
    }

    // Verificar si la placa vehicular ya está registrada
    const existingPlate = await prisma.rider.findFirst({
      where: { vehiclePlate: vehiclePlate.toUpperCase() },
    });

    if (existingPlate) {
      return NextResponse.json(
        { ok: false, error: `La matrícula/placa ${vehiclePlate.toUpperCase()} ya se encuentra registrada en la flota` },
        { status: 409 }
      );
    }

    // Crear User (rol RIDER) y Rider vinculado
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        role: "RIDER",
        rider: {
          create: {
            phone,
            vehiclePlate: vehiclePlate.toUpperCase(),
            status: status || "IDLE",
            isActive: true,
            currentLat: currentLat ?? 10.2135, // Default a zona central Valencia si no se especifica
            currentLng: currentLng ?? -68.0062,
          },
        },
      },
      include: {
        rider: true,
      },
    });

    const createdRider = {
      ...user.rider!,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      orders: [],
    };

    // Emitir evento SSE
    eventHub.broadcast("rider:created", createdRider);

    return NextResponse.json({ ok: true, rider: createdRider }, { status: 201 });
  } catch (error: any) {
    console.error("Error al registrar repartidor:", error);
    return NextResponse.json(
      { ok: false, error: "Error al dar de alta repartidor", details: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/riders (actualizar información, estado, ubicación o visibilidad)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = updateRiderSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Datos del repartidor inválidos";
      return NextResponse.json({ ok: false, error: firstError, issues: parsed.error.issues }, { status: 400 });
    }

    const { riderId, name, email, phone, vehiclePlate, status, currentLat, currentLng, isActive } = parsed.data;

    const rider = await prisma.rider.findUnique({
      where: { id: riderId },
      include: { user: true },
    });

    if (!rider) {
      return NextResponse.json(
        { ok: false, error: "Repartidor no encontrado" },
        { status: 404 }
      );
    }

    // Si se modifica el email, validar unicidad
    if (email && email.toLowerCase() !== rider.user.email.toLowerCase()) {
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (existingUser && existingUser.id !== rider.userId) {
        return NextResponse.json(
          { ok: false, error: "Ya existe otro usuario registrado con este correo electrónico" },
          { status: 409 }
        );
      }
    }

    // Actualizar User si vino name o email
    if (name || email) {
      await prisma.user.update({
        where: { id: rider.userId },
        data: {
          ...(name ? { name } : {}),
          ...(email ? { email: email.toLowerCase() } : {}),
        },
      });
    }

    const dataToUpdate: any = {};
    if (phone !== undefined) dataToUpdate.phone = phone;
    if (vehiclePlate !== undefined) dataToUpdate.vehiclePlate = vehiclePlate;
    if (status !== undefined) dataToUpdate.status = status;
    if (currentLat !== undefined) dataToUpdate.currentLat = currentLat;
    if (currentLng !== undefined) dataToUpdate.currentLng = currentLng;
    if (isActive !== undefined) {
      dataToUpdate.isActive = Boolean(isActive);
      // Si se desactiva/oculta, se pone automáticamente en OFFLINE
      if (!isActive) {
        dataToUpdate.status = "OFFLINE";
      }
    }

    const updatedRider = await prisma.rider.update({
      where: { id: riderId },
      data: dataToUpdate,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        orders: {
          select: {
            id: true,
            status: true,
            totalCost: true,
            distanceKm: true,
          },
        },
      },
    });

    eventHub.broadcast("rider:status_updated", updatedRider);
    eventHub.broadcast("rider:updated", updatedRider);

    return NextResponse.json({ ok: true, rider: updatedRider });
  } catch (error: any) {
    console.error("Error al actualizar rider:", error);
    return NextResponse.json(
      { ok: false, error: "Error al actualizar repartidor", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/riders (eliminar o soft-delete si tiene historial)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idFromQuery = searchParams.get("id");
    let idFromBody: string | undefined;

    try {
      const body = await req.json();
      idFromBody = body?.id || body?.riderId;
    } catch {
      // Body opcional si se pasa por query
    }

    const riderId = idFromQuery || idFromBody;
    if (!riderId) {
      return NextResponse.json(
        { ok: false, error: "ID del repartidor es requerido" },
        { status: 400 }
      );
    }

    const rider = await prisma.rider.findUnique({
      where: { id: riderId },
      include: {
        user: true,
        orders: {
          select: { id: true, status: true },
        },
      },
    });

    if (!rider) {
      return NextResponse.json(
        { ok: false, error: "Repartidor no encontrado" },
        { status: 404 }
      );
    }

    // Si tiene órdenes asociadas, se oculta para proteger integridad
    if (rider.orders.length > 0) {
      const softDeleted = await prisma.rider.update({
        where: { id: riderId },
        data: {
          isActive: false,
          status: "OFFLINE",
        },
        include: {
          user: true,
          orders: { select: { id: true, status: true } },
        },
      });

      eventHub.broadcast("rider:updated", softDeleted);

      return NextResponse.json({
        ok: true,
        softDeleted: true,
        message: `El repartidor "${rider.user.name}" tiene ${rider.orders.length} servicio(s) en su historial. Ha sido desactivado/ocultado para proteger los registros de liquidación.`,
        rider: softDeleted,
      });
    }

    // Si no tiene órdenes, se elimina permanentemente de la flota
    await prisma.rider.delete({ where: { id: riderId } });
    if (rider.userId) {
      await prisma.user.delete({ where: { id: rider.userId } }).catch(() => {});
    }

    eventHub.broadcast("rider:deleted", { id: riderId });

    return NextResponse.json({
      ok: true,
      softDeleted: false,
      message: `Repartidor "${rider.user.name}" (${rider.vehiclePlate}) eliminado permanentemente de la flota.`,
    });
  } catch (error: any) {
    console.error("Error al eliminar repartidor:", error);
    return NextResponse.json(
      { ok: false, error: "Error al procesar la eliminación del repartidor", details: error.message },
      { status: 500 }
    );
  }
}

