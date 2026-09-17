import { ALLOWED_TRANSITIONS, isValidTransition } from "../src/lib/validators";

export function runOrderFlowTests() {
  console.log("🧪 Iniciando Tests de Máquina de Estados de Órdenes...");
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

  // 1. Transiciones válidas esperadas
  assert(isValidTransition("PENDING", "ASSIGNED"), "PENDING -> ASSIGNED es permitida");
  assert(isValidTransition("PENDING", "CANCELLED"), "PENDING -> CANCELLED es permitida");
  assert(isValidTransition("ASSIGNED", "PICKING_UP"), "ASSIGNED -> PICKING_UP es permitida");
  assert(isValidTransition("PICKING_UP", "IN_TRANSIT"), "PICKING_UP -> IN_TRANSIT es permitida");
  assert(isValidTransition("IN_TRANSIT", "DELIVERED"), "IN_TRANSIT -> DELIVERED es permitida");

  // 2. Transiciones inválidas (saltarse pasos o volver atrás)
  assert(!isValidTransition("PENDING", "DELIVERED"), "PENDING -> DELIVERED (salto) es denegada");
  assert(!isValidTransition("PENDING", "IN_TRANSIT"), "PENDING -> IN_TRANSIT (salto) es denegada");
  assert(!isValidTransition("DELIVERED", "PENDING"), "DELIVERED -> PENDING (estado terminal) es denegada");
  assert(!isValidTransition("CANCELLED", "ASSIGNED"), "CANCELLED -> ASSIGNED (estado terminal) es denegada");
  assert(!isValidTransition("DELIVERED", "CANCELLED"), "DELIVERED -> CANCELLED (ya entregado) es denegada");

  console.log(`\n📊 Resumen Order Flow Tests: ${passed} pasados, ${failed} fallidos.\n`);
  if (failed > 0) {
    throw new Error(`${failed} pruebas fallaron`);
  }
}
