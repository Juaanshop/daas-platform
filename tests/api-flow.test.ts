import { prisma } from "../src/lib/db";
import { PricingService } from "../src/services/pricing";
import { SettlementService } from "../src/services/settlement";
import { isValidTransition, createOrderSchema } from "../src/lib/validators";

async function testApiFlow() {
  console.log("🧪 Iniciando Test de Flujo de Base de Datos y Servicios (Valencia & Naguanagua)...");

  // 1. Verificar comercios existentes del seed
  const merchants = await prisma.merchant.findMany();
  console.log(`  🏢 Comercios encontrados: ${merchants.length}`);
  if (merchants.length < 2) throw new Error("Seed falló: se esperaban al menos 2 comercios");

  // 2. Verificar repartidores
  const riders = await prisma.rider.findMany({ include: { user: true } });
  console.log(`  🛵 Repartidores encontrados: ${riders.length}`);
  if (riders.length < 3) throw new Error("Seed falló: se esperaban 3 repartidores");

  // 3. Probar validación Zod de rechazo para destino fuera de zona (Caracas)
  const invalidOrderValidation = createOrderSchema.safeParse({
    merchantId: merchants[0].id,
    pickupAddress: merchants[0].address,
    pickupLat: merchants[0].latitude,
    pickupLng: merchants[0].longitude,
    dropoffAddress: "Av. Francisco de Miranda, Caracas",
    dropoffLat: 10.4910,
    dropoffLng: -66.8530,
    recipientName: "Prueba Fuera de Rango",
    recipientPhone: "+58 412 000-0000",
  });

  if (invalidOrderValidation.success) {
    throw new Error("createOrderSchema debió rechazar el destino en Caracas por estar fuera de Valencia/Naguanagua");
  }
  console.log("  🛡️ createOrderSchema rechazó con éxito destino fuera de cobertura (Caracas)");

  // 4. Crear una nueva orden válida mediante el servicio y pricing en Valencia -> Naguanagua
  const originLat = merchants[0].latitude;
  const originLng = merchants[0].longitude;
  const destLat = 10.2450; // Mañongo, Naguanagua
  const destLng = -68.0010;

  const quote = PricingService.calculateQuote({
    origin: [originLat, originLng],
    destination: [destLat, destLng],
  });

  console.log(
    `  🏷️ Cotización calculada: Distancia=${quote.distanceKm}km, Total=$${quote.totalCost}, Minutos=${quote.estimatedMinutes}, Cobertura=${quote.isCovered} (${quote.originZone} -> ${quote.destinationZone})`
  );
  if (quote.totalCost <= 0 || !quote.isCovered) {
    throw new Error("Tarifa calculada inválida o fuera de cobertura para orden válida en Valencia/Naguanagua");
  }

  const newOrder = await prisma.order.create({
    data: {
      orderNumber: `#ORD-${Date.now().toString().slice(-4)}`,
      merchantId: merchants[0].id,
      pickupAddress: merchants[0].address,
      pickupLat: originLat,
      pickupLng: originLng,
      dropoffAddress: "C.C. Sambil Valencia, Mañongo, Naguanagua",
      dropoffLat: destLat,
      dropoffLng: destLng,
      recipientName: "Test Integración Valencia-Naguanagua",
      recipientPhone: "+58 414 999-8888",
      baseFee: quote.baseFee,
      distanceKm: quote.distanceKm,
      totalCost: quote.totalCost,
      status: "PENDING",
    },
  });

  console.log(`  📦 Nueva orden creada: ${newOrder.orderNumber} con estado ${newOrder.status}`);

  // 5. Asignar rider disponible
  const idleRider = riders.find((r) => r.status === "IDLE");
  if (!idleRider) throw new Error("No hay rider disponible para test");

  if (!isValidTransition(newOrder.status, "ASSIGNED")) {
    throw new Error("Transición PENDING -> ASSIGNED debería ser válida");
  }

  const assignedOrder = await prisma.order.update({
    where: { id: newOrder.id },
    data: { status: "ASSIGNED", riderId: idleRider.id },
  });
  await prisma.rider.update({
    where: { id: idleRider.id },
    data: { status: "BUSY" },
  });
  console.log(`  👤 Orden asignada a ${idleRider.user.name} (Rider status: BUSY)`);

  // 6. Transición a PICKING_UP -> IN_TRANSIT -> DELIVERED
  await prisma.order.update({
    where: { id: newOrder.id },
    data: { status: "PICKING_UP" },
  });

  await prisma.order.update({
    where: { id: newOrder.id },
    data: { status: "IN_TRANSIT", pickedUpAt: new Date() },
  });

  const deliveredOrder = await prisma.order.update({
    where: { id: newOrder.id },
    data: { status: "DELIVERED", deliveredAt: new Date() },
  });
  await prisma.rider.update({
    where: { id: idleRider.id },
    data: { status: "IDLE" },
  });
  console.log(`  🏁 Orden finalizada exitosamente: ${deliveredOrder.status} (Rider liberado a IDLE)`);

  // 7. Test de Liquidación diaria
  const settlement = await SettlementService.getDailySettlement(new Date());
  console.log(`  💰 Resumen del corte de hoy:`);
  console.log(`     Total órdenes entregadas: ${settlement.totalOrders}`);
  console.log(`     Volumen total transaccionado: $${settlement.totalVolume}`);
  console.log(`     Comercios con despachos: ${settlement.merchants.length}`);
  console.log(`     Repartidores liquidados: ${settlement.riders.length}`);

  if (settlement.totalOrders < 1 || settlement.totalVolume <= 0) {
    throw new Error("Liquidación diaria arrojó valores nulos o inconsistentes");
  }

  console.log("\n✅ Test de Integración de Flujo de Datos completado con ÉXITO!\n");
  await prisma.$disconnect();
}

testApiFlow().catch((err) => {
  console.error("❌ Error en test de flujo:", err);
  process.exit(1);
});
