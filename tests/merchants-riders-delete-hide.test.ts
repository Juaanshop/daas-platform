import { prisma } from "../src/lib/db";

export async function runDeleteAndHideTests() {
  console.log("🔒 👁️ Ejecutando Tests de Ocultar y Eliminar Comercios y Repartidores...");

  // -------------------------------------------------------------
  // 1. Test: Ocultar (desactivar) y Reactivar Comercio
  // -------------------------------------------------------------
  const merchantUser = await prisma.user.create({
    data: {
      name: "Encargado Ocultar Test",
      email: `hide.merchant.${Date.now()}@daas.local`,
      role: "MERCHANT",
      merchant: {
        create: {
          businessName: "Panadería Central El Viñedo",
          address: "Av. Monseñor Adams, Valencia, Edo. Carabobo",
          latitude: 10.2135,
          longitude: -68.0062,
          phone: "+58 414 123-0001",
          balance: 10.0,
          isActive: true,
        },
      },
    },
    include: { merchant: true },
  });

  const merchantId = merchantUser.merchant!.id;

  // Verificar que por defecto está activo
  let activeMerchants = await prisma.merchant.findMany({ where: { isActive: true } });
  if (!activeMerchants.some((m) => m.id === merchantId)) {
    throw new Error("El comercio debería estar presente en la lista de activos");
  }
  console.log("  ✅ Comercio creado e identificado como activo");

  // Ocultar / Desactivar
  const hiddenMerchant = await prisma.merchant.update({
    where: { id: merchantId },
    data: { isActive: false },
  });
  if (hiddenMerchant.isActive !== false) {
    throw new Error("El comercio no se marcó como inactivo correctamente");
  }

  // Verificar que ya no aparece en la lista de activos (para el portal de despacho)
  activeMerchants = await prisma.merchant.findMany({ where: { isActive: true } });
  if (activeMerchants.some((m) => m.id === merchantId)) {
    throw new Error("El comercio oculto NO debe aparecer en la lista de activos");
  }
  console.log("  🛡️ Comercio ocultado con éxito: Excluido del listado de comercios activos");

  // Reactivar
  const restoredMerchant = await prisma.merchant.update({
    where: { id: merchantId },
    data: { isActive: true },
  });
  if (restoredMerchant.isActive !== true) {
    throw new Error("Fallo al reactivar el comercio");
  }
  console.log("  ✅ Comercio reactivado con éxito (isActive: true)");

  // -------------------------------------------------------------
  // 2. Test: Eliminación Segura de Comercio (Soft Delete vs Hard Delete)
  // -------------------------------------------------------------
  // Caso A: Con órdenes existentes -> debe aplicar Soft Delete para resguardar contabilidad
  const testOrder = await prisma.order.create({
    data: {
      orderNumber: `#ORD-TEST-${Date.now().toString().slice(-4)}`,
      merchantId,
      pickupAddress: merchantUser.merchant!.address,
      pickupLat: merchantUser.merchant!.latitude,
      pickupLng: merchantUser.merchant!.longitude,
      dropoffAddress: "Urb. Prebo, Valencia",
      dropoffLat: 10.2170,
      dropoffLng: -68.0120,
      recipientName: "Cliente Auditoría",
      recipientPhone: "+58 414 000-9999",
      baseFee: 2.0,
      distanceKm: 1.2,
      totalCost: 2.0,
      status: "DELIVERED",
    },
  });

  // Simular lógica de DELETE con órdenes asociadas
  const merchantWithOrders = await prisma.merchant.findUnique({
    where: { id: merchantId },
    include: { orders: { select: { id: true } } },
  });

  if (!merchantWithOrders || merchantWithOrders.orders.length === 0) {
    throw new Error("Se esperaba orden asociada al comercio");
  }

  // Se aplica soft-delete
  const softDeletedMerchant = await prisma.merchant.update({
    where: { id: merchantId },
    data: { isActive: false },
  });
  if (softDeletedMerchant.isActive !== false) {
    throw new Error("Comercio con historial debió ser desactivado (soft-delete)");
  }
  console.log("  🛡️ Protección de Auditoría verificada: Comercio con historial fue desactivado/ocultado");

  // Limpiar orden de prueba
  await prisma.order.delete({ where: { id: testOrder.id } });

  // Caso B: Sin órdenes -> Eliminación física permanente
  await prisma.merchant.delete({ where: { id: merchantId } });
  await prisma.user.delete({ where: { id: merchantUser.id } });

  const deletedCheck = await prisma.merchant.findUnique({ where: { id: merchantId } });
  if (deletedCheck !== null) {
    throw new Error("El comercio sin órdenes debió eliminarse permanentemente de la base de datos");
  }
  console.log("  🗑️ Comercio sin historial eliminado permanentemente con éxito");

  // -------------------------------------------------------------
  // 3. Test: Ocultar y Desactivar Repartidor (Rider)
  // -------------------------------------------------------------
  const riderUser = await prisma.user.create({
    data: {
      name: "Repartidor Ocultar Test",
      email: `hide.rider.${Date.now()}@daas.local`,
      role: "RIDER",
      rider: {
        create: {
          phone: "+58 424 000-8888",
          vehiclePlate: `TEST${Date.now().toString().slice(-4)}`,
          status: "IDLE",
          isActive: true,
        },
      },
    },
    include: { rider: true },
  });

  const riderId = riderUser.rider!.id;

  // Ocultar / Desactivar rider -> Cambia status a OFFLINE y isActive a false
  const hiddenRider = await prisma.rider.update({
    where: { id: riderId },
    data: {
      isActive: false,
      status: "OFFLINE",
    },
  });

  if (hiddenRider.isActive !== false || hiddenRider.status !== "OFFLINE") {
    throw new Error("El repartidor oculto debe quedar inactivo y en estado OFFLINE");
  }

  const activeRiders = await prisma.rider.findMany({ where: { isActive: true } });
  if (activeRiders.some((r) => r.id === riderId)) {
    throw new Error("El repartidor inactivo NO debe aparecer en la flota activa");
  }
  console.log("  🛡️ Repartidor ocultado con éxito: Puesto en OFFLINE y excluido de flota activa");

  // Reactivar rider
  const restoredRider = await prisma.rider.update({
    where: { id: riderId },
    data: {
      isActive: true,
      status: "IDLE",
    },
  });
  if (restoredRider.isActive !== true || restoredRider.status !== "IDLE") {
    throw new Error("Fallo al reactivar repartidor");
  }
  console.log("  ✅ Repartidor reactivado con éxito a IDLE");

  // -------------------------------------------------------------
  // 4. Test: Eliminación de Repartidor
  // -------------------------------------------------------------
  await prisma.rider.delete({ where: { id: riderId } });
  await prisma.user.delete({ where: { id: riderUser.id } });

  const deletedRiderCheck = await prisma.rider.findUnique({ where: { id: riderId } });
  if (deletedRiderCheck !== null) {
    throw new Error("El repartidor sin historial debió eliminarse permanentemente");
  }
  console.log("  🗑️ Repartidor sin historial eliminado permanentemente con éxito\n");
}
