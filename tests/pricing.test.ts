import {
  PricingService,
  calculateHaversineDistance,
  MIN_BASE_FEE,
  DEFAULT_LOCAL_BASE_FEE,
  INTERMUNICIPAL_BASE_FEE,
} from "../src/services/pricing";

export function runPricingTests() {
  console.log("🧪 Iniciando Tests del Pricing Engine con Tarifa Base Variable ($2.00+)...");
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

  // Test 1: Distancia corta (<= 2 km) en Valencia (El Viñedo a Prebo)
  // El Viñedo (10.2135, -68.0062) a Prebo (10.2170, -68.0120) ~ 0.75 km
  const quoteShort = PricingService.calculateQuote({
    origin: [10.2135, -68.0062],
    destination: [10.2170, -68.0120],
  });

  assert(
    quoteShort.distanceKm < 2.0,
    `Distancia corta calculada (${quoteShort.distanceKm} km < 2 km)`
  );
  assert(quoteShort.baseFee === DEFAULT_LOCAL_BASE_FEE, "Tarifa base local por defecto es $2.00");
  assert(quoteShort.baseFee >= MIN_BASE_FEE, "Tarifa base cumple con ser de $2.00 en adelante");
  const expectedShortTimeFee = Math.round((quoteShort.estimatedMinutes / 3) * 0.50 * 100) / 100;
  assert(
    quoteShort.totalCost === Math.round((2.0 + expectedShortTimeFee) * 100) / 100,
    `Costo total calcula base $2.00 + $0.50 por cada 3 min (obtenido: $${quoteShort.totalCost})`
  );
  assert(quoteShort.estimatedMinutes >= 1, `Tiempo estimado es válido (${quoteShort.estimatedMinutes} mins)`);
  assert(quoteShort.isCovered === true, "Cotización dentro de Valencia está cubierta");
  assert(quoteShort.originZone === "Valencia", "Origen identificado como Valencia");
  assert(quoteShort.destinationZone === "Valencia", "Destino identificado como Valencia");
  assert(quoteShort.isIntermunicipal === false, "No es intermunicipal (dentro de Valencia)");

  // Test 2: Distancia larga (> 2 km) intermunicipal Valencia -> Naguanagua
  // El Viñedo (10.2135, -68.0062) a C.C. Sambil Mañongo (10.2450, -68.0010) ~ 3.55 km
  const quoteLong = PricingService.calculateQuote({
    origin: [10.2135, -68.0062],
    destination: [10.2450, -68.0010],
  });

  assert(quoteLong.distanceKm > 2.0, `Distancia calculada es mayor a 2 km (${quoteLong.distanceKm} km)`);
  assert(quoteLong.isIntermunicipal === true, "Detectado correctamente como intermunicipal Valencia -> Naguanagua");
  assert(
    quoteLong.baseFee === INTERMUNICIPAL_BASE_FEE,
    `Tarifa base varía automáticamente a $2.50 para trayectos intermunicipales (obtenido: $${quoteLong.baseFee})`
  );
  const expectedLongTimeFee = Math.round((quoteLong.estimatedMinutes / 3) * 0.50 * 100) / 100;
  const expectedTotal = Math.round((2.5 + expectedLongTimeFee) * 100) / 100;

  assert(
    Math.abs(quoteLong.totalCost - expectedTotal) < 0.01,
    `Cálculo de tarifa intermunicipal exacto: $2.50 + $0.50 por cada 3 min (${quoteLong.estimatedMinutes} min = $${expectedLongTimeFee}) = $${quoteLong.totalCost}`
  );
  assert(quoteLong.isCovered === true, "Trayecto Valencia -> Naguanagua está cubierto");
  assert(quoteLong.destinationZone === "Naguanagua", "Destino identificado como Naguanagua");

  // Test 3: Tarifa base personalizada (ej. $3.00 para servicio prioritario)
  const quoteCustom = PricingService.calculateQuote({
    origin: [10.2135, -68.0062],
    destination: [10.2170, -68.0120],
    baseFee: 3.0,
  });
  assert(quoteCustom.baseFee === 3.0, "Tarifa base personalizada de $3.00 aplicada correctamente");
  assert(quoteCustom.totalCost >= 3.0, `Costo total refleja la tarifa base personalizada de $3.00 + tiempo ($${quoteCustom.totalCost})`);

  // Test 4: Piso mínimo estricto (no se permite menos de $2.00)
  const quoteBelowMin = PricingService.calculateQuote({
    origin: [10.2135, -68.0062],
    destination: [10.2170, -68.0120],
    baseFee: 1.25, // Intento de fijar menos de $2.00
  });
  assert(
    quoteBelowMin.baseFee === MIN_BASE_FEE,
    `Tarifa base menor a $2.00 es ajustada automáticamente al piso mínimo de $2.00 (obtenido: $${quoteBelowMin.baseFee})`
  );
  assert(quoteBelowMin.totalCost >= 2.0, "Costo total respeta el piso mínimo de $2.00");

  // Test 5: Cotización a punto fuera de zona (ej. Caracas)
  const quoteOutOfZone = PricingService.calculateQuote({
    origin: [10.2135, -68.0062], // Valencia
    destination: [10.4910, -66.8530], // Caracas
  });
  assert(quoteOutOfZone.isCovered === false, "Cotización fuera de rango indica isCovered: false");
  assert(Boolean(quoteOutOfZone.coverageError), "Contiene mensaje descriptivo de fuera de cobertura");

  // Test 6: Haversine cálculo idéntico a distancia 0
  const zeroDist = calculateHaversineDistance(10.2135, -68.0062, 10.2135, -68.0062);
  assert(zeroDist === 0, "Distancia de un punto a sí mismo es 0 km");

  console.log(`\n📊 Resumen Pricing Tests: ${passed} pasados, ${failed} fallidos.\n`);
  if (failed > 0) {
    throw new Error(`${failed} pruebas fallaron`);
  }
}
