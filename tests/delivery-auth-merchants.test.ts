import { prisma } from "../src/lib/db";
import { hashPassword, verifyPassword, signToken, verifyToken } from "../src/lib/auth";
import { GeofenceService } from "../src/services/geofence";

export async function runDeliveryAuthAndMerchantsTests() {
  console.log("🛵 🏢 Iniciando Tests de Auth Delivery y Afiliación de Comercios (Bloque 1 / F1 & F2)...");
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

  // 1. Password Hashing & Verification
  const testPassword = "superSecretPassword123";
  const hashed = hashPassword(testPassword);
  assert(hashed.includes(":"), "Hash contiene salt y digest separados");
  assert(verifyPassword(testPassword, hashed), "Contraseña válida es verificada exitosamente");
  assert(!verifyPassword("wrongPassword", hashed), "Contraseña incorrecta es rechazada");

  // 2. Token Signing & Verification
  const payload = { userId: "del_123", email: "delivery@test.com", exp: Date.now() + 60000 };
  const token = signToken(payload);
  const verified = verifyToken(token);
  assert(verified !== null, "Token firmado es verificado correctamente");
  assert(verified?.userId === "del_123", "Token contiene el userId correcto");
  assert(verified?.email === "delivery@test.com", "Token contiene el email correcto");

  const expiredToken = signToken({ ...payload, exp: Date.now() - 1000 });
  assert(verifyToken(expiredToken) === null, "Token expirado es rechazado");

  // 3. Database DeliveryUser & Merchants
  const deliveryUser = await prisma.deliveryUser.findUnique({
    where: { email: "delivery@daas.com" },
    include: { merchants: true },
  });
  assert(deliveryUser !== null, "DeliveryUser del seed existe en base de datos");
  assert(
    deliveryUser ? verifyPassword("password123", deliveryUser.passwordHash) : false,
    "DeliveryUser se autentica con la contraseña por defecto 'password123'"
  );
  assert((deliveryUser?.merchants.length || 0) >= 2, "DeliveryUser tiene al menos 2 comercios afiliados");

  // 4. Public Token de Comercio
  const burgerMerchant = await prisma.merchant.findUnique({
    where: { publicToken: "burger-lab" },
    include: { deliveryUser: true },
  });
  assert(burgerMerchant !== null, "Comercio con token público 'burger-lab' es encontrado sin login");
  assert(burgerMerchant?.deliveryUser?.id === deliveryUser?.id, "Comercio está correctamente vinculado al DeliveryUser");
  assert(Boolean(burgerMerchant?.isActive), "Comercio afiliado está activo");

  // 5. Geofence en creación de comercio afiliado
  const validLocation = GeofenceService.checkLocationCoverage(10.2135, -68.0062);
  assert(validLocation.isCovered, "Comercio en El Viñedo está cubierto por geocerca");

  const invalidLocation = GeofenceService.checkLocationCoverage(10.4910, -66.8530);
  assert(!invalidLocation.isCovered, "Comercio en Caracas es rechazado por geocerca");

  console.log(`\n📊 Resumen Delivery Auth & Merchants Tests: ${passed} pasados, ${failed} fallidos.\n`);
  if (failed > 0) {
    throw new Error(`${failed} pruebas fallaron`);
  }
}
