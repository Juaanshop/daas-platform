import { createMerchantSchema, createRiderSchema } from "../src/lib/validators";
import { prisma } from "../src/lib/db";

export async function runMerchantsAndRidersTests() {
  console.log("🏢 🛵 Ejecutando Tests de Registro de Clientes (Merchants) y Repartidores (Riders)...");

  // 1. Test: Validación de comercio en zona válida (Valencia - El Viñedo)
  const validValenciaMerchant = createMerchantSchema.safeParse({
    businessName: "Café Gourmet El Viñedo",
    name: "Alejandra Silva",
    email: "test.valencia.merchant@daas.local",
    phone: "+58 414 111-2233",
    address: "Calle de los Cafés, El Viñedo, Valencia, Edo. Carabobo",
    latitude: 10.2135,
    longitude: -68.0062,
    balance: 50.0,
  });

  if (!validValenciaMerchant.success) {
    throw new Error(`Comercio en Valencia debería ser válido: ${JSON.stringify(validValenciaMerchant.error.issues)}`);
  }
  console.log("  ✅ Validación Zod aceptó exitosamente comercio en Valencia (El Viñedo)");

  // 2. Test: Validación de comercio en zona válida (Naguanagua - La Granja)
  const validNaguanaguaMerchant = createMerchantSchema.safeParse({
    businessName: "Farmacia Express Naguanagua",
    name: "Roberto Rojas",
    email: "test.naguanagua.merchant@daas.local",
    phone: "+58 412 444-5566",
    address: "Av. Universidad c/c Salvador Feo La Cruz, Naguanagua, Edo. Carabobo",
    latitude: 10.2485,
    longitude: -68.0105,
    balance: 0,
  });

  if (!validNaguanaguaMerchant.success) {
    throw new Error(`Comercio en Naguanagua debería ser válido: ${JSON.stringify(validNaguanaguaMerchant.error.issues)}`);
  }
  console.log("  ✅ Validación Zod aceptó exitosamente comercio en Naguanagua (La Granja)");

  // 3. Test: Rechazo estricto de comercio fuera de cobertura (Caracas)
  const invalidCaracasMerchant = createMerchantSchema.safeParse({
    businessName: "Comercio Fuera de Rango Caracas",
    name: "Persona No Autorizada",
    email: "caracas@comercio.local",
    phone: "+58 212 999-0000",
    address: "Las Mercedes, Caracas",
    latitude: 10.4800,
    longitude: -66.8600,
    balance: 0,
  });

  if (invalidCaracasMerchant.success) {
    throw new Error("createMerchantSchema debió rechazar comercio con coordenadas en Caracas");
  }
  console.log("  🛡️ Geocerca rechazó correctamente comercio fuera de Valencia/Naguanagua (Caracas)");

  // 4. Test: Validación de Repartidor (Rider)
  const validRider = createRiderSchema.safeParse({
    name: "Fernando Mendoza",
    email: "fernando.rider@daas.local",
    phone: "+58 424 777-8899",
    vehiclePlate: "ae5k89y",
    status: "IDLE",
    currentLat: 10.2135,
    currentLng: -68.0062,
  });

  if (!validRider.success) {
    throw new Error(`Rider válido fue rechazado: ${JSON.stringify(validRider.error.issues)}`);
  }
  if (validRider.data.vehiclePlate !== "AE5K89Y") {
    throw new Error(`La placa debió ser transformada a mayúsculas: recibida ${validRider.data.vehiclePlate}`);
  }
  console.log("  ✅ Validación Zod aceptó repartidor y formateó placa a mayúsculas (AE5K89Y)");

  // 5. Test: Rechazo de Rider con datos inválidos
  const invalidRider = createRiderSchema.safeParse({
    name: "A", // Demasiado corto
    email: "correo-invalido",
    phone: "123", // Demasiado corto
    vehiclePlate: "A", // Demasiado corto
  });

  if (invalidRider.success) {
    throw new Error("createRiderSchema debió rechazar repartidor con datos incompletos");
  }
  console.log("  🛡️ createRiderSchema rechazó repartidor con datos inválidos");

  // 6. Test de Integración en Base de Datos: Crear y Verificar Merchant
  const testEmailMerchant = `test.merchant.${Date.now()}@daas.local`;
  const createdMerchantUser = await prisma.user.create({
    data: {
      name: "Encargado Prueba Integración",
      email: testEmailMerchant,
      role: "MERCHANT",
      merchant: {
        create: {
          businessName: "Comercio de Integración DB",
          address: "Av. Bolívar Norte, Valencia, Edo. Carabobo",
          latitude: 10.2100,
          longitude: -68.0050,
          phone: "+58 414 000-1122",
          balance: 75.0,
        },
      },
    },
    include: { merchant: true },
  });

  if (!createdMerchantUser.merchant || createdMerchantUser.merchant.balance !== 75.0) {
    throw new Error("Fallo al persistir merchant en base de datos con balance inicial");
  }
  console.log(`  🏢 Merchant creado en DB con ID: ${createdMerchantUser.merchant.id}`);

  // 7. Test de Integración en Base de Datos: Crear y Verificar Rider
  const testEmailRider = `test.rider.${Date.now()}@daas.local`;
  const createdRiderUser = await prisma.user.create({
    data: {
      name: "Repartidor Prueba Integración",
      email: testEmailRider,
      role: "RIDER",
      rider: {
        create: {
          phone: "+58 412 999-3344",
          vehiclePlate: `AB${Date.now().toString().slice(-4)}CD`,
          status: "IDLE",
          currentLat: 10.2200,
          currentLng: -68.0000,
        },
      },
    },
    include: { rider: true },
  });

  if (!createdRiderUser.rider || createdRiderUser.rider.status !== "IDLE") {
    throw new Error("Fallo al persistir rider en base de datos");
  }
  console.log(`  🛵 Rider creado en DB con ID: ${createdRiderUser.rider.id}`);

  // Limpieza de datos de prueba
  await prisma.merchant.delete({ where: { id: createdMerchantUser.merchant.id } });
  await prisma.user.delete({ where: { id: createdMerchantUser.id } });
  await prisma.rider.delete({ where: { id: createdRiderUser.rider.id } });
  await prisma.user.delete({ where: { id: createdRiderUser.id } });
  console.log("  🧹 Entidades de prueba eliminadas correctamente tras la verificación\n");
}
