import { updateMerchantSchema, updateRiderSchema } from "../src/lib/validators";
import { prisma } from "../src/lib/db";

export async function runEditMerchantsAndRidersTests() {
  console.log("✏️  Ejecutando Tests de Edición y Actualización de Comercios y Repartidores...");

  // 1. Test: Validación de actualización de comercio con datos válidos
  const validMerchantUpdate = updateMerchantSchema.safeParse({
    merchantId: "cmtest123",
    businessName: "Panadería Los Andes Actualizada",
    name: "Carlos Delgado Modificado",
    email: "carlos.updated@panaderia.local",
    phone: "+58 414 999-8877",
    address: "Av. Don Julio Centeno, San Diego, Edo. Carabobo",
    latitude: 10.2520,
    longitude: -67.9540,
    balance: 125.5,
    isActive: true,
  });

  if (!validMerchantUpdate.success) {
    throw new Error(`updateMerchantSchema debería ser válido: ${JSON.stringify(validMerchantUpdate.error.issues)}`);
  }
  console.log("  ✅ Validación Zod aceptó exitosamente actualización de comercio (San Diego)");

  // 2. Test: Rechazo de actualización de comercio fuera de cobertura
  const invalidMerchantUpdate = updateMerchantSchema.safeParse({
    merchantId: "cmtest123",
    businessName: "Comercio Mudado a Barquisimeto",
    latitude: 10.0678,
    longitude: -69.3474,
  });

  if (invalidMerchantUpdate.success) {
    throw new Error("updateMerchantSchema debió rechazar coordenadas fuera de Carabobo");
  }
  console.log("  🛡️ Geocerca rechazó correctamente actualización de comercio fuera de zona");

  // 3. Test: Validación de actualización de repartidor
  const validRiderUpdate = updateRiderSchema.safeParse({
    riderId: "rdtest123",
    name: "Luis Gómez Actualizado",
    email: "luis.updated@rider.local",
    phone: "0412-555-1234",
    vehiclePlate: "ab1c23d", // Minúsculas que deben formatearse a AB1C23D
    status: "IDLE",
    currentLat: 10.2485,
    currentLng: -68.0105,
    isActive: true,
  });

  if (!validRiderUpdate.success) {
    throw new Error(`updateRiderSchema debería ser válido: ${JSON.stringify(validRiderUpdate.error.issues)}`);
  }
  if (validRiderUpdate.data.vehiclePlate !== "AB1C23D") {
    throw new Error(`La placa debió convertirse a mayúsculas: obtenido ${validRiderUpdate.data.vehiclePlate}`);
  }
  console.log("  ✅ Validación Zod aceptó actualización de repartidor y formateó placa a mayúsculas (AB1C23D)");

  // 4. Test en Base de Datos: Crear, editar y comprobar persistencia de Comercio
  const testUser = await prisma.user.create({
    data: {
      email: `test.edit.merchant.${Date.now()}@daas.local`,
      name: "Comercio Original Para Editar",
      role: "MERCHANT",
    },
  });

  const testMerchant = await prisma.merchant.create({
    data: {
      userId: testUser.id,
      businessName: "Pizzería Original",
      phone: "+58 414 123-0000",
      address: "El Viñedo, Valencia",
      latitude: 10.2135,
      longitude: -68.0062,
      balance: 10.0,
      isActive: true,
    },
  });

  // Ejecutar actualización
  await prisma.user.update({
    where: { id: testUser.id },
    data: {
      name: "Comercio Contacto Editado",
      email: `test.edit.merchant.updated.${Date.now()}@daas.local`,
    },
  });

  const updatedMerchant = await prisma.merchant.update({
    where: { id: testMerchant.id },
    data: {
      businessName: "Pizzería Nápoles VIP",
      phone: "+58 424 999-7777",
      address: "Av. Don Julio Centeno, C.C. Fin de Siglo, San Diego",
      latitude: 10.2520,
      longitude: -67.9540,
      balance: 85.0,
    },
    include: { user: true },
  });

  if (
    updatedMerchant.businessName !== "Pizzería Nápoles VIP" ||
    updatedMerchant.balance !== 85.0 ||
    updatedMerchant.user?.name !== "Comercio Contacto Editado"
  ) {
    throw new Error("Los datos del comercio no se actualizaron correctamente en DB");
  }
  console.log("  🏢 Comercio y Usuario vinculados actualizados y verificados en DB");

  // 5. Test en Base de Datos: Crear, editar y comprobar persistencia de Repartidor
  const testRiderUser = await prisma.user.create({
    data: {
      email: `test.edit.rider.${Date.now()}@daas.local`,
      name: "Rider Inicial",
      role: "RIDER",
    },
  });

  const testRider = await prisma.rider.create({
    data: {
      userId: testRiderUser.id,
      phone: "+58 412 111-2222",
      vehiclePlate: "INI-123",
      status: "OFFLINE",
      currentLat: 10.2135,
      currentLng: -68.0062,
      isActive: true,
    },
  });

  // Ejecutar actualización del rider
  await prisma.user.update({
    where: { id: testRiderUser.id },
    data: { name: "Rider Capitán Flota" },
  });

  const updatedRider = await prisma.rider.update({
    where: { id: testRider.id },
    data: {
      phone: "+58 412 999-8888",
      vehiclePlate: "MOD-999",
      status: "IDLE",
      currentLat: 10.2485,
      currentLng: -68.0105,
    },
    include: { user: true },
  });

  if (
    updatedRider.vehiclePlate !== "MOD-999" ||
    updatedRider.status !== "IDLE" ||
    updatedRider.user.name !== "Rider Capitán Flota"
  ) {
    throw new Error("Los datos del repartidor no se actualizaron correctamente en DB");
  }
  console.log("  🛵 Repartidor y credenciales actualizados y verificados en DB");

  // Limpieza
  await prisma.merchant.delete({ where: { id: testMerchant.id } });
  await prisma.user.delete({ where: { id: testUser.id } });
  await prisma.rider.delete({ where: { id: testRider.id } });
  await prisma.user.delete({ where: { id: testRiderUser.id } });
  console.log("  🧹 Registros de prueba de edición eliminados con éxito\n");
}
