import assert from "node:assert";
import { SettlementService } from "../src/services/settlement";

console.log("\n🧪 Iniciando Tests de Settlement & Récord de Clientes y Riders...");

let passed = 0;
let failed = 0;

function test(description: string, fn: () => void | Promise<void>) {
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result
        .then(() => {
          console.log(`  ✅ PASS: ${description}`);
          passed++;
        })
        .catch((err) => {
          console.error(`  ❌ FAIL: ${description}`);
          console.error(`     ${err.message}`);
          failed++;
        });
    } else {
      console.log(`  ✅ PASS: ${description}`);
      passed++;
    }
  } catch (err: any) {
    console.error(`  ❌ FAIL: ${description}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

export async function runSettlementTests() {
  await test("getDailySettlement en modo histórico retorna resumen consolidado", async () => {
    const summary = await SettlementService.getDailySettlement({ isAllTime: true });

    assert.ok(summary.totalOrders > 0, "Debe haber órdenes entregadas en la BD");
    assert.ok(summary.totalVolume > 0, "El volumen total debe ser mayor a 0");
    assert.strictEqual(summary.isAllTime, true);
    assert.strictEqual(summary.date, "Histórico Acumulado");

    // Integridad financiera 80% riders / 20% plataforma
    const sumParts = Math.round((summary.totalRiderFees + summary.totalPlatformMargin) * 100) / 100;
    assert.strictEqual(summary.totalVolume, sumParts, "La suma de honorarios y margen debe igualar el volumen total");
  });

  await test("Agrupación de Récord de Clientes (Destinatarios)", async () => {
    const summary = await SettlementService.getDailySettlement({ isAllTime: true });

    assert.ok(Array.isArray(summary.customers), "Debe incluir array de clientes");
    assert.ok(summary.customers.length > 0, "Debe haber clientes agrupados");

    const topCustomer = summary.customers[0];
    assert.ok(topCustomer.recipientName, "El cliente tiene nombre");
    assert.ok(topCustomer.totalOrders >= 1, "El cliente tiene al menos 1 orden");
    assert.ok(topCustomer.totalSpent > 0, "El cliente tiene gasto total acumulado");
    assert.ok(topCustomer.avgTicket > 0, "El cliente tiene ticket promedio calculado");
    assert.ok(topCustomer.lastAddress, "El cliente tiene última dirección registrada");
  });

  await test("Agrupación de Récord de Repartidores (80% fee y Km)", async () => {
    const summary = await SettlementService.getDailySettlement({ isAllTime: true });

    assert.ok(Array.isArray(summary.riders), "Debe incluir array de riders");
    assert.ok(summary.riders.length > 0, "Debe haber repartidores con entregas");

    const rider = summary.riders[0];
    assert.ok(rider.riderName, "El rider tiene nombre");
    assert.ok(rider.vehiclePlate, "El rider tiene patente");
    assert.ok(rider.totalDeliveries >= 1, "Tiene viajes completados");
    assert.ok(rider.totalEarned > 0, "Tiene honorarios ganados");
    assert.ok(rider.totalKm >= 0, "Tiene kilometraje total");
  });

  await test("Libro Mayor de Despachos (Itemized Dispatches)", async () => {
    const summary = await SettlementService.getDailySettlement({ isAllTime: true });

    assert.ok(Array.isArray(summary.dispatches), "Debe incluir libro mayor");
    assert.strictEqual(summary.dispatches.length, summary.totalOrders, "Cada orden entregada está en el libro mayor");

    const dispatch = summary.dispatches[0];
    assert.ok(dispatch.orderNumber.startsWith("#ORD-"), "Formato de orden válido");
    assert.ok(dispatch.merchantName, "Tiene comercio emisor");
    assert.ok(dispatch.recipientName, "Tiene destinatario");
    assert.ok(dispatch.totalCost > 0, "Tiene tarifa total");
    assert.strictEqual(
      Math.round((dispatch.riderEarnings + dispatch.platformFee) * 100) / 100,
      dispatch.totalCost,
      "Desglose 80/20 coincide con tarifa total"
    );
  });

  console.log(`\n📊 Resumen Settlement Tests: ${passed} pasados, ${failed} fallidos.`);
  if (failed > 0) {
    throw new Error(`${failed} pruebas de Settlement fallaron.`);
  }
}

if (require.main === module) {
  runSettlementTests();
}
