import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Buscando usuarios en la base de datos...");

  const deliveryUsers = await prisma.deliveryUser.findMany();
  console.log(`Encontrados ${deliveryUsers.length} DeliveryUsers:`);
  deliveryUsers.forEach((u) => {
    console.log(`- ID: ${u.id}, Name: "${u.name}", Email: "${u.email}", Phone: "${u.phone}"`);
  });

  // Actualizar todos los DeliveryUser existentes a los datos reales de Juan Romero
  const updated = await prisma.deliveryUser.updateMany({
    data: {
      name: "Juan Romero",
      phone: "+584144171864",
    },
  });

  console.log(`✅ Actualizados ${updated.count} DeliveryUsers a "Juan Romero" (+584144171864)`);

  // También actualizar si existe algún User / Rider de prueba con Juan Pérez
  const legacyUsers = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: "Juan" } },
        { name: { contains: "Delivery" } },
      ],
    },
  });

  for (const lu of legacyUsers) {
    if (lu.role === "RIDER") {
      await prisma.user.update({
        where: { id: lu.id },
        data: { name: "Juan Romero" },
      });
      if (lu.id) {
        await prisma.rider.updateMany({
          where: { userId: lu.id },
          data: { phone: "+584144171864" },
        });
      }
      console.log(`✅ Actualizado Rider legacy ID: ${lu.id}`);
    }
  }

  // Verificar estado final
  const finalUsers = await prisma.deliveryUser.findMany();
  console.log("\n📋 Estado final en Base de Datos:");
  finalUsers.forEach((u) => {
    console.log(`✔️ DeliveryUser: "${u.name}" | Email: "${u.email}" | Teléfono: "${u.phone}"`);
  });
}

main()
  .catch((e) => {
    console.error("❌ Error actualizando usuario:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
