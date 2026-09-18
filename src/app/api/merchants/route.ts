import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createMerchantSchema, updateMerchantSchema } from "@/lib/validators";
import { eventHub } from "@/lib/events";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    const where: any = {};
    if (!includeInactive) {
      where.isActive = true;
    }

    const merchants = await prisma.merchant.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        orders: {
          select: {
            id: true,
          },
        },
      },
    });

    return NextResponse.json({ ok: true, merchants });
  } catch (error: any) {
    console.error("Error al obtener comercios:", error);
    return NextResponse.json(
      { ok: false, error: "Error al listar comercios", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = createMerchantSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Datos de comercio inválidos";
      return NextResponse.json(
        { ok: false, error: firstError, issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { name, email, businessName, address, latitude, longitude, phone, balance } = parsed.data;

    // Verificar si el correo ya está registrado
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { ok: false, error: "Ya existe un usuario o comercio registrado con este correo electrónico" },
        { status: 409 }
      );
    }

    // Crear User (rol MERCHANT) y Merchant vinculado de forma atómica
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        role: "MERCHANT",
        merchant: {
          create: {
            businessName,
            address,
            latitude,
            longitude,
            phone,
            balance: balance ?? 0.0,
            isActive: true,
          },
        },
      },
      include: {
        merchant: true,
      },
    });

    const createdMerchant = {
      ...user.merchant!,
      user: {
        name: user.name,
        email: user.email,
      },
      orders: [],
    };

    // Emitir evento SSE
    eventHub.broadcast("merchant:created", createdMerchant);

    return NextResponse.json({ ok: true, merchant: createdMerchant }, { status: 201 });
  } catch (error: any) {
    console.error("Error al registrar comercio:", error);
    return NextResponse.json(
      { ok: false, error: "Error al registrar nuevo comercio", details: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/merchants (actualizar información o visibilidad del comercio)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = updateMerchantSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Datos del comercio inválidos";
      return NextResponse.json({ ok: false, error: firstError, issues: parsed.error.issues }, { status: 400 });
    }

    const { merchantId, name, email, businessName, address, latitude, longitude, phone, balance, isActive } = parsed.data;

    // Buscar comercio existente
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      include: { user: true },
    });

    if (!merchant) {
      return NextResponse.json(
        { ok: false, error: "Comercio no encontrado" },
        { status: 404 }
      );
    }

    // Si se modifica el email, validar que no pertenezca a otro usuario
    if (email && merchant.user && email.toLowerCase() !== merchant.user.email.toLowerCase()) {
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (existingUser && existingUser.id !== merchant.userId) {
        return NextResponse.json(
          { ok: false, error: "Ya existe otro usuario registrado con este correo electrónico" },
          { status: 409 }
        );
      }
    }

    // Actualizar User si vino name o email y existe userId
    if ((name || email) && merchant.userId) {
      await prisma.user.update({
        where: { id: merchant.userId },
        data: {
          ...(name ? { name } : {}),
          ...(email ? { email: email.toLowerCase() } : {}),
        },
      });
    }

    // Actualizar Merchant
    const dataToUpdate: any = {};
    if (businessName !== undefined) dataToUpdate.businessName = businessName;
    if (address !== undefined) dataToUpdate.address = address;
    if (latitude !== undefined) dataToUpdate.latitude = latitude;
    if (longitude !== undefined) dataToUpdate.longitude = longitude;
    if (phone !== undefined) dataToUpdate.phone = phone;
    if (balance !== undefined) dataToUpdate.balance = balance;
    if (isActive !== undefined) dataToUpdate.isActive = Boolean(isActive);

    const updated = await prisma.merchant.update({
      where: { id: merchantId },
      data: dataToUpdate,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        orders: {
          select: {
            id: true,
          },
        },
      },
    });

    eventHub.broadcast("merchant:updated", updated);

    return NextResponse.json({ ok: true, merchant: updated });
  } catch (error: any) {
    console.error("Error al actualizar comercio:", error);
    return NextResponse.json(
      { ok: false, error: "Error al actualizar información del comercio", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/merchants (eliminar o soft-delete si tiene historial)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idFromQuery = searchParams.get("id");
    let idFromBody: string | undefined;

    try {
      const body = await req.json();
      idFromBody = body?.id || body?.merchantId;
    } catch {
      // Body opcional si se pasa por query
    }

    const merchantId = idFromQuery || idFromBody;
    if (!merchantId) {
      return NextResponse.json(
        { ok: false, error: "ID del comercio es requerido" },
        { status: 400 }
      );
    }

    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      include: {
        orders: {
          select: { id: true },
        },
      },
    });

    if (!merchant) {
      return NextResponse.json(
        { ok: false, error: "Comercio no encontrado" },
        { status: 404 }
      );
    }

    // Si tiene órdenes históricas, se oculta para proteger integridad
    if (merchant.orders.length > 0) {
      const softDeleted = await prisma.merchant.update({
        where: { id: merchantId },
        data: { isActive: false },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      });

      eventHub.broadcast("merchant:updated", softDeleted);

      return NextResponse.json({
        ok: true,
        softDeleted: true,
        message: `El comercio "${merchant.businessName}" tiene ${merchant.orders.length} orden(es) registradas. Ha sido ocultado/desactivado para proteger el historial contable.`,
        merchant: softDeleted,
      });
    }

    // Si no tiene órdenes, se elimina permanentemente junto con su User
    await prisma.merchant.delete({ where: { id: merchantId } });
    if (merchant.userId) {
      await prisma.user.delete({ where: { id: merchant.userId } }).catch(() => {});
    }

    eventHub.broadcast("merchant:deleted", { id: merchantId });

    return NextResponse.json({
      ok: true,
      softDeleted: false,
      message: `Comercio "${merchant.businessName}" eliminado permanentemente de la plataforma.`,
    });
  } catch (error: any) {
    console.error("Error al eliminar comercio:", error);
    return NextResponse.json(
      { ok: false, error: "Error al procesar la eliminación del comercio", details: error.message },
      { status: 500 }
    );
  }
}


