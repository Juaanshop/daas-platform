import assert from "node:assert";
import { GoogleMapsDistanceService } from "../src/services/distance";
import { PricingService } from "../src/services/pricing";

console.log("\n🧪 Iniciando Tests del Distance Engine (Google Maps & Fallback Haversine)...");

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

export async function runDistanceTests() {
  // Puntos de prueba: El Viñedo (Valencia) -> C.C. Sambil (Naguanagua)
  const origin: [number, number] = [10.2135, -68.0062];
  const destination: [number, number] = [10.245, -68.001];

  // Test 1: Fallback a Haversine cuando no hay clave o en modo local
  await test("Retorna fallback Haversine cuando la clave es vacía", async () => {
    const result = await GoogleMapsDistanceService.calculateRouteDistance(origin, destination);
    assert.ok(result.distanceKm > 0, "La distancia debe ser mayor a 0");
    assert.strictEqual(typeof result.distanceKm, "number");
    assert.strictEqual(typeof result.durationMinutes, "number");
    assert.ok(result.durationMinutes >= 8, "La duración mínima debe ser al menos 8 minutos");
    // Al no haber clave en el entorno de pruebas, debe indicar provider 'osrm' o 'haversine'
    if (!process.env.GOOGLE_MAPS_SERVER_KEY && !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      assert.ok(["osrm", "haversine"].includes(result.provider), `Provider debe ser osrm o haversine (obtenido: ${result.provider})`);
    }
  });

  // Test 2: PricingService.calculateQuoteAsync retorna cotización completa
  await test("PricingService.calculateQuoteAsync genera cotización válida con metadatos de proveedor", async () => {
    const quote = await PricingService.calculateQuoteAsync({
      origin,
      destination,
      baseFee: 2.5,
    });

    assert.ok(quote.distanceKm > 0, "Distancia calculada");
    assert.strictEqual(quote.baseFee, 2.5, "Tarifa base respetada");
    assert.ok(quote.totalCost >= 2.5, "Costo total consistente");
    assert.strictEqual(quote.isCovered, true, "Trayecto en zona conurbada");
    assert.strictEqual(quote.isIntermunicipal, true, "Detectado intermunicipal");
    assert.ok(["google_maps", "osrm", "haversine"].includes(quote.distanceProvider || ""));
  });

  // Test 3: Distancia punto a punto idéntico es 0
  await test("Distancia a sí mismo resulta en 0 km", async () => {
    const result = await GoogleMapsDistanceService.calculateRouteDistance(origin, origin);
    assert.strictEqual(result.distanceKm, 0);
  });

  console.log(`\n📊 Resumen Distance Tests: ${passed} pasados, ${failed} fallidos.`);
  if (failed > 0) {
    throw new Error(`${failed} pruebas de Distance Engine fallaron.`);
  }
}

if (require.main === module) {
  runDistanceTests();
}
