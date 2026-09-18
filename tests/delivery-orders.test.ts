import { prisma } from "../src/lib/db";
import { isValidTransition } from "../src/lib/validators";
import { WhatsAppService } from "../src/services/whatsapp";

export async function runDeliveryOrdersTests() {
  console.log("");
  console.log("🚀 🚨 Iniciando Tests de Operativa de Despacho del Delivery (Bloque 3 / F5)...");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log("  ✅ PASS: " + testName);
      passed++;
    } else {
      console.error("  ❌ FAIL: " + testName);
      failed++;
    }
  }


  assert(isValidTransition("DRAFT_SUBMITTED", "CONFIRMED_PICKUP"), "DRAFT_SUBMITTED -> CONFIRMED_PICKUP es permitida");
  assert(isValidTransition("CONFIRMED_PICKUP", "IN_TRANSIT"), "CONFIRMED_PICKUP -> IN_TRANSIT es permitida");
  assert(isValidTransition("IN_TRANSIT", "DELIVERED"), "IN_TRANSIT -> DELIVERED es permitida");
  assert(isValidTransition("DRAFT_SUBMITTED", "CANCELLED"), "DRAFT_SUBMITTED -> CANCELLED es permitida");
  assert(!isValidTransition("DRAFT_SUBMITTED", "DELIVERED"), "DRAFT_SUBMITTED -> DELIVERED (salto ilegal) es denegada");
  assert(!isValidTransition("DELIVERED", "DRAFT_SUBMITTED"), "DELIVERED es estado terminal");


  const deliveryUser = await prisma.deliveryUser.findUnique({
    where: { email: "delivery@daas.com" },
  });
  assert(!!deliveryUser, "DeliveryUser de prueba existe en la BD");

  const merchant = await prisma.merchant.findFirst({
    where: { deliveryUserId: deliveryUser!.id },
  });
  assert(!!merchant, "Comercio afiliado existe para el DeliveryUser");

  const testOrderNumber = "#ORD-TEST-" + Date.now();
  const newOrder = await prisma.order.create({
    data: {
      orderNumber: testOrderNumber,
      merchantId: merchant!.id,
      deliveryUserId: deliveryUser!.id,
      pickupAddress: merchant!.address,
      pickupLat: merchant!.latitude,
      pickupLng: merchant!.longitude,
      dropoffAddress: "Av. Bolívar Norte, Valencia",
      dropoffLat: 10.2100,
      dropoffLng: -68.0050,
      recipientName: "Cliente de Prueba",
      recipientPhone: "+584141111111",
      packageDescription: "Paquete de prueba F5",
      packageSize: "MEDIUM",
      baseFee: 2.0,
      distanceKm: 3.5,
      totalCost: 3.50,
      riderEarnings: 2.80,
      status: "DRAFT_SUBMITTED",
    },
  });

  assert(newOrder.status === "DRAFT_SUBMITTED", "Órden inicia exitosamente en DRAFT_SUBMITTED");


  const step1Order = await prisma.order.update({
    where: { id: newOrder.id },
    data: {
      status: "CONFIRMED_PICKUP",
      confirmedAt: new Date(),
    },
  });
  assert(step1Order.status === "CONFIRMED_PICKUP", "Transición a CONFIRMED_PICKUP");
  assert(!!step1Order.confirmedAt, "confirmedAt registrado");


  const step2Order = await prisma.order.update({
    where: { id: newOrder.id },
    data: {
      status: "IN_TRANSIT",
      pickedUpAt: new Date(),
    },
  });
  assert(step2Order.status === "IN_TRANSIT", "Transición a IN_TRANSIT");
  assert(!!step2Order.pickedUpAt, "pickedUpAt registrado");


  const whatsapp = WhatsAppService.generateInTransitToRecipient({
    recipientPhone: step2Order.recipientPhone,
    deliveryName: deliveryUser!.name,
    businessName: merchant!.businessName,
    estimatedMinutes: 10,
    dropoffAddress: step2Order.dropoffAddress,
  });

  assert(whatsapp.whatsappUrl.startsWith("https://wa.me/584141111111?text="), "URL de WhatsApp al destinatario generada correctamente");
  assert(whatsapp.message.includes(deliveryUser!.name), "Mensaje incluye el nombre del repartidor");
  assert(whatsapp.message.includes(merchant!.businessName), "Mensaje incluye el nombre del comercio");
  assert(whatsapp.message.includes("10 min"), "Mensaje incluye el tiempo estimado");


  const step3Order = await prisma.order.update({
    where: { id: newOrder.id },
    data: {
      status: "DELIVERED",
      deliveredAt: new Date(),
      riderEarnings: Math.round(newOrder.totalCost * 0.8 * 100) / 100,
    },
  });
  assert(step3Order.status === "DELIVERED", "Transición a DELIVERED");
  assert(!!step3Order.deliveredAt, "deliveredAt registrado");
  assert(step3Order.riderEarnings === 2.8, "Ganancia del repartidor acreditada al 80% ($2.80)");


  await prisma.order.delete({ where: { id: newOrder.id } });
  console.log("  🤡 Órden de prueba F5 limpiada exitosamente");

  console.log("  Resumen Delivery Orders Tests: " + passed + " pasados, " + failed + " fallidos.");
  if (failed > 0) {
    throw new Error(failed + " pruebas fallaron");
  }
}
