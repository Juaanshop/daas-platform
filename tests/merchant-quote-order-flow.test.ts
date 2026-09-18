import { prisma } from "../src/lib/db";
import { PricingService } from "../src/services/pricing";
import { GeofenceService } from "../src/services/geofence";
import { WhatsAppService } from "../src/services/whatsapp";

export async function runMerchantQuoteAndOrderFlowTests() {
  console.log("📦 📲 Iniciando Tests de Cotización y Envío de Pedidos del Comercio (Bloque 2 / F3 & F4)...");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Obtener comercio afiliado de prueba
  const merchant = await prisma.merchant.findUnique({
    where: { publicToken: "burger-lab" },
    include: { deliveryUser: true },
  });

  if (!merchant || !merchant.deliveryUser) {
    throw new Error("Comercio 'burger-lab' o DeliveryUser no encontrado en DB");
  }

  // 2. F3: Test de Cotización en zona (Valencia -> Naguanagua)
  const destLat = 10.245; // Mañongo, Naguanagua
  const destLng = -68.001;
  const coverage = GeofenceService.validateDispatchCoverage(
    [merchant.latitude, merchant.longitude],
    [destLat, destLng]
  );
  assert(coverage.isValid, "Trayecto Valencia -> Naguanagua está cubierto por la geocerca");

  const quote = PricingService.calculateQuote({
    origin: [merchant.latitude, merchant.longitude],
    destination: [destLat, destLng],
  });
  assert(quote.totalCost >= 2.0, "Tarifa total es de al menos $2.00");
  assert(quote.distanceKm > 0, "Distancia calculada es mayor a 0 km");
  assert(quote.estimatedMinutes > 0, "Tiempo estimado en minutos es positivo");

  // F3: Test de Rechazo fuera de zona (Caracas)
  const invalidCoverage = GeofenceService.validateDispatchCoverage(
    [merchant.latitude, merchant.longitude],
    [10.491, -66.853]
  );
  assert(!invalidCoverage.isValid, "Destino en Caracas es rechazado por cobertura");

  // 3. F4: Persistir orden en DRAFT_SUBMITTED
  const orderNumber = `#ORD-TEST-${Date.now().toString().slice(-4)}`;
  const riderEarnings = Number((quote.totalCost * 0.8).toFixed(2));

  const createdOrder = await prisma.order.create({
    data: {
      orderNumber,
      merchantId: merchant.id,
      deliveryUserId: merchant.deliveryUserId,
      pickupAddress: merchant.address,
      pickupLat: merchant.latitude,
      pickupLng: merchant.longitude,
      dropoffAddress: "C.C. Sambil Valencia, Entrada Las 4 Avenidas, Mañongo",
      dropoffLat: destLat,
      dropoffLng: destLng,
      recipientName: "Carlos Cliente",
      recipientPhone: "+58 412 888-9999",
      packageDescription: "2x Combos Burger Doble con Papas",
      packageSize: "MEDIUM",
      baseFee: quote.baseFee,
      distanceKm: quote.distanceKm,
      totalCost: quote.totalCost,
      riderEarnings,
      status: "DRAFT_SUBMITTED",
    },
  });

  assert(createdOrder.status === "DRAFT_SUBMITTED", "Orden creada con estado inicial DRAFT_SUBMITTED");
  assert(createdOrder.deliveryUserId === merchant.deliveryUserId, "Orden asociada al deliveryUserId del comercio");
  assert(createdOrder.riderEarnings === riderEarnings, "Ganancia estimada calculada al 80%");

  // 4. F4: Generar mensaje y URL de WhatsApp al delivery
  const waResult = WhatsAppService.generateNewRequestToDelivery({
    deliveryPhone: merchant.deliveryUser.phone,
    orderNumber: createdOrder.orderNumber,
    businessName: merchant.businessName,
    packageDescription: createdOrder.packageDescription!,
    packageSize: createdOrder.packageSize!,
    recipientName: createdOrder.recipientName,
    recipientPhone: createdOrder.recipientPhone,
    pickupAddress: createdOrder.pickupAddress,
    dropoffAddress: createdOrder.dropoffAddress,
    dropoffLat: createdOrder.dropoffLat,
    dropoffLng: createdOrder.dropoffLng,
    distanceKm: createdOrder.distanceKm,
    totalCost: createdOrder.totalCost,
    riderEarnings: createdOrder.riderEarnings!,
    appOrderUrl: "http://localhost:3000/app",
  });

  assert(waResult.whatsappUrl.startsWith("https://wa.me/"), "URL wa.me generada correctamente");
  assert(waResult.cleanPhone === "584141234567", "Teléfono del delivery limpio solo con dígitos");
  assert(waResult.message.includes(orderNumber), "Mensaje contiene el número de orden");
  assert(waResult.message.includes(merchant.businessName), "Mensaje contiene el nombre del comercio");
  assert(waResult.message.includes("2x Combos Burger Doble"), "Mensaje contiene la descripción del paquete");
  assert(waResult.message.includes("Carlos Cliente"), "Mensaje contiene el nombre del destinatario");
  assert(waResult.message.includes(`$${createdOrder.totalCost.toFixed(2)}`), "Mensaje contiene la tarifa total");
  assert(waResult.message.includes(`$${riderEarnings.toFixed(2)}`), "Mensaje contiene la ganancia del delivery");

  // 5. Limpieza de orden de prueba
  await prisma.order.delete({ where: { id: createdOrder.id } });
  console.log("  🧹 Orden de prueba limpiada exitosamente");

  console.log(`\n📊 Resumen Merchant Quote & Order Flow Tests: ${passed} pasados, ${failed} fallidos.\n`);
  if (failed > 0) {
    throw new Error(`${failed} pruebas fallaron`);
  }
}
