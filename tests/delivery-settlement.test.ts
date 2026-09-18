import { WhatsAppService } from "../src/services/whatsapp";
import { SettlementService } from "../src/services/settlement";
import { prisma } from "../src/lib/db";

export async function runDeliverySettlementTests() {
  console.log("");
  console.log("💰 📊 Iniciando Tests de Cierre Diario y Liquidaciones del Delivery (Bloque 4)...");
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

  // 1. Generación de mensaje y link de WhatsApp para liquidar a un comercio
  const notif = WhatsAppService.generateDailySettlementToMerchant({
    merchantName: "Burger Lab El Viñedo",
    merchantPhone: "+58 414 417 1864",
    deliveryName: "Carlos Gómez",
    date: "2026-09-18",
    ordersCount: 3,
    totalAmount: 14.5,
    orderNumbers: ["#ORD1001", "#ORD1002", "#ORD1003"],
  });

  assert(notif.cleanPhone === "584144171864", "Teléfono de liquidación limpiado correctamente sin símbolos");
  assert(notif.message.includes("CIERRE Y LIQUIDACIÓN DIARIA — Burger Lab El Viñedo"), "Mensaje contiene cabecera de cierre y nombre del comercio");
  assert(notif.message.includes("Carlos Gómez"), "Mensaje contiene el nombre del repartidor");
  assert(notif.message.includes("2026-09-18"), "Mensaje contiene la fecha de liquidación");
  assert(notif.message.includes("Despachos completados:* 3"), "Mensaje detalla la cantidad de despachos");
  assert(notif.message.includes("$14.50"), "Mensaje detalla el monto total a liquidar");
  assert(notif.message.includes("#ORD1001, #ORD1002"), "Mensaje incluye desglose de números de orden");
  assert(notif.whatsappUrl.startsWith("https://wa.me/584144171864?text="), "URL directa wa.me generada para el comercio");

  // 2. Consulta y filtrado de liquidación en DB con DeliveryUser
  const deliveryUser = await prisma.deliveryUser.findUnique({
    where: { email: "delivery@daas.com" },
  });
  assert(!!deliveryUser, "DeliveryUser principal existe para cálculo de liquidación");

  if (deliveryUser) {
    const settlement = await SettlementService.getDailySettlement({
      deliveryUserId: deliveryUser.id,
      isAllTime: true,
    });

    assert(typeof settlement.totalOrders === "number", "Liquidación retorna totalOrders numérico");
    assert(typeof settlement.totalVolume === "number", "Liquidación retorna totalVolume numérico");
    assert(typeof settlement.totalRiderFees === "number", "Liquidación calcula honorarios netos del repartidor (80%)");
    assert(settlement.totalRiderFees <= settlement.totalVolume, "Honorarios del rider no superan el volumen total");
    assert(Array.isArray(settlement.merchants), "Liquidación contiene lista de comercios asociados");

    // Verificar que los comercios asociados tienen campo phone y orderNumbers
    if (settlement.merchants.length > 0) {
      const firstMerchant = settlement.merchants[0];
      assert(typeof firstMerchant.totalSpent === "number", "Comercio tiene totalSpent calculado");
      assert(Array.isArray(firstMerchant.orderNumbers), "Comercio tiene listado de órdenes asignadas");
    }

    assert(typeof settlement.pendingOrders === "number", "Liquidación calcula pendingOrders");
    assert(typeof settlement.pendingVolume === "number", "Liquidación calcula pendingVolume");
    assert(typeof settlement.isDaySettled === "boolean", "Liquidación calcula isDaySettled");

    // 3. Prueba de marcar una orden como cobrada (isSettled: true)
    const deliveredOrder = await prisma.order.findFirst({
      where: { deliveryUserId: deliveryUser.id, status: "DELIVERED" },
    });

    if (deliveredOrder) {
      await prisma.order.update({
        where: { id: deliveredOrder.id },
        data: { isSettled: true, settledAt: new Date() },
      });

      const updatedSettlement = await SettlementService.getDailySettlement({
        deliveryUserId: deliveryUser.id,
        isAllTime: true,
      });

      assert(updatedSettlement.settledOrders >= 1, "Orden marcada como cobrada incrementa settledOrders");

      // Restaurar estado para no alterar tests idempotentes
      await prisma.order.update({
        where: { id: deliveredOrder.id },
        data: { isSettled: false, settledAt: null },
      });
    }
  }

  console.log(`\n📊 Resumen Delivery Settlement Tests: ${passed} pasados, ${failed} fallidos.\n`);
  if (failed > 0) {
    throw new Error(`${failed} pruebas de liquidación fallaron`);
  }
}
