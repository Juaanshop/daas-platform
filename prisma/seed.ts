import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";

const prisma = new PrismaClient();

async function main() {
  const existingDelivery = await prisma.deliveryUser.findUnique({
    where: { email: "delivery@daas.com" },
  });

  if (existingDelivery) {
    console.log("ℹ️ DeliveryUser ya existe en la base de datos. Omitiendo seed para proteger datos de producción.");
    return;
  }

  console.log("🌱 Inicializando base de datos nueva...");

  console.log("🛵 Creando DeliveryUser principal (MVP Delivery-Centric)...");
  const deliveryUser = await prisma.deliveryUser.create({
    data: {
      name: "Juan Romero",
      email: "delivery@daas.com",
      passwordHash: hashPassword("password123"),
      phone: "+584144171864",
    },
  });

  console.log("👤 Creando Admin...");
  await prisma.user.create({
    data: {
      name: "Carlos Méndez (Admin Central Valencia)",
      email: "admin@daas.local",
      role: "ADMIN",
    },
  });

  console.log("🏪 Creando Comercios en Valencia y Naguanagua (Carabobo)...");
  const merchantUser1 = await prisma.user.create({
    data: {
      name: "Laura Gómez (Burger Lab El Viñedo)",
      email: "pedidos@burgerlabvalencia.com",
      role: "MERCHANT",
      merchant: {
        create: {
          deliveryUserId: deliveryUser.id,
          publicToken: "burger-lab",
          businessName: "Burger Lab El Viñedo",
          address: "Calle 139 c/c Av. Monseñor Adams, El Viñedo, Valencia, Edo. Carabobo",
          latitude: 10.2135,
          longitude: -68.0062,
          phone: "+58 241 823-4567",
          balance: 240.0,
        },
      },
    },
    include: { merchant: true },
  });

  const merchantUser2 = await prisma.user.create({
    data: {
      name: "Marcos Rossi (Pizzería Napoli La Granja)",
      email: "contacto@napolilagranja.com",
      role: "MERCHANT",
      merchant: {
        create: {
          deliveryUserId: deliveryUser.id,
          publicToken: "pizzeria-napoli",
          businessName: "Pizzería Napoli La Granja",
          address: "Av. Universidad c/c Av. Salvador Feo La Cruz, C.C. La Granja, Naguanagua, Edo. Carabobo",
          latitude: 10.2485,
          longitude: -68.0105,
          phone: "+58 241 867-1122",
          balance: 135.5,
        },
      },
    },
    include: { merchant: true },
  });

  // Nuevo Comercio: El Rico Ricon en Torre Banaven
  const merchantUser3 = await prisma.user.create({
    data: {
      name: "Administración (El Rico Ricon)",
      email: "pedidos@elricoricon.com",
      role: "MERCHANT",
      merchant: {
        create: {
          deliveryUserId: deliveryUser.id,
          publicToken: "rico-ricon",
          businessName: "El Rico Ricon",
          address: "Torre Banaven, PB, Av. Bolívar Norte c/c Calle 137, Urb. San José de Tarbes, Valencia, Edo. Carabobo",
          latitude: 10.2035672,
          longitude: -68.0071639,
          phone: "+58 414 432-1980",
          balance: 180.0,
        },
      },
    },
    include: { merchant: true },
  });

  console.log("🛵 Creando 3 Repartidores en Valencia y Naguanagua...");
  // Rider 1: IDLE (Disponible en El Viñedo / Valencia)
  const riderUser1 = await prisma.user.create({
    data: {
      name: "Lucas Torres",
      email: "lucas.rider@daas.local",
      role: "RIDER",
      rider: {
        create: {
          phone: "+58 414 412-8899",
          vehiclePlate: "AA123BB",
          status: "IDLE",
          currentLat: 10.2150,
          currentLng: -68.0050,
        },
      },
    },
    include: { rider: true },
  });

  // Rider 2: BUSY (En viaje en Mañongo / Naguanagua)
  const riderUser2 = await prisma.user.create({
    data: {
      name: "Mateo Silva",
      email: "mateo.rider@daas.local",
      role: "RIDER",
      rider: {
        create: {
          phone: "+58 424 456-7890",
          vehiclePlate: "AB456CD",
          status: "BUSY",
          currentLat: 10.2460,
          currentLng: -68.0020,
        },
      },
    },
    include: { rider: true },
  });

  // Rider 3: OFFLINE (Desconectado en Prebo / Valencia)
  const riderUser3 = await prisma.user.create({
    data: {
      name: "Sofía Vega",
      email: "sofia.rider@daas.local",
      role: "RIDER",
      rider: {
        create: {
          phone: "+58 412 789-0123",
          vehiclePlate: "AC789EF",
          status: "OFFLINE",
          currentLat: 10.2170,
          currentLng: -68.0120,
        },
      },
    },
    include: { rider: true },
  });

  console.log("📦 Creando órdenes iniciales en Valencia y Naguanagua...");
  // Orden 1: DELIVERED (Naguanagua -> Naguanagua: La Granja a Tazajal)
  await prisma.order.create({
    data: {
      orderNumber: "#ORD-1001",
      merchantId: merchantUser2.merchant!.id,
      riderId: riderUser1.rider!.id,
      pickupAddress: merchantUser2.merchant!.address,
      pickupLat: merchantUser2.merchant!.latitude,
      pickupLng: merchantUser2.merchant!.longitude,
      dropoffAddress: "Urb. Tazajal, Calle 3, Res. Los Samanes, Naguanagua",
      dropoffLat: 10.2660,
      dropoffLng: -68.0090,
      recipientName: "Esteban Morales",
      recipientPhone: "+58 412 332-1100",
      packageNotes: "2x Pizza Margarita + Bebida 1.5L. Entregar en garita.",
      baseFee: 1.5,
      distanceKm: 1.95,
      totalCost: 1.5,
      status: "DELIVERED",
      createdAt: new Date(Date.now() - 7200000),
      pickedUpAt: new Date(Date.now() - 5400000),
      deliveredAt: new Date(Date.now() - 3600000),
    },
  });

  // Orden 2: IN_TRANSIT (Valencia -> Valencia: El Viñedo a La Trigaleña)
  await prisma.order.create({
    data: {
      orderNumber: "#ORD-1002",
      merchantId: merchantUser1.merchant!.id,
      riderId: riderUser2.rider!.id,
      pickupAddress: merchantUser1.merchant!.address,
      pickupLat: merchantUser1.merchant!.latitude,
      pickupLng: merchantUser1.merchant!.longitude,
      dropoffAddress: "Urb. La Trigaleña, Calle 130, Valencia",
      dropoffLat: 10.2220,
      dropoffLng: -67.9940,
      recipientName: "Camila Díaz",
      recipientPhone: "+58 424 654-9876",
      packageNotes: "Combo Doble Burger con Papas Trufadas. Apto 3B.",
      baseFee: 1.5,
      distanceKm: 1.62,
      totalCost: 1.5,
      status: "IN_TRANSIT",
      createdAt: new Date(Date.now() - 1800000),
      pickedUpAt: new Date(Date.now() - 600000),
    },
  });

  // Orden 3: PENDING (Valencia -> Naguanagua: El Viñedo a C.C. Sambil Mañongo)
  await prisma.order.create({
    data: {
      orderNumber: "#ORD-1003",
      merchantId: merchantUser1.merchant!.id,
      pickupAddress: merchantUser1.merchant!.address,
      pickupLat: merchantUser1.merchant!.latitude,
      pickupLng: merchantUser1.merchant!.longitude,
      dropoffAddress: "C.C. Sambil Valencia, Entrada Las 4 Avenidas, Mañongo, Naguanagua",
      dropoffLat: 10.2450,
      dropoffLng: -68.0010,
      recipientName: "Ignacio Albarracín",
      recipientPhone: "+58 414 556-7788",
      packageNotes: "3x Burger Criolla + Ración de Tequeños. Llamar al llegar.",
      deliveryUserId: deliveryUser.id,
      baseFee: 1.5,
      distanceKm: 3.55,
      totalCost: 2.28, // $1.50 + (1.55km * 0.50) = $2.28
      status: "PENDING",
    },
  });

  // Orden 4 (MVP Delivery-Centric): DRAFT_SUBMITTED
  await prisma.order.create({
    data: {
      orderNumber: "#ORD-1004",
      merchantId: merchantUser2.merchant!.id,
      deliveryUserId: deliveryUser.id,
      pickupAddress: merchantUser2.merchant!.address,
      pickupLat: merchantUser2.merchant!.latitude,
      pickupLng: merchantUser2.merchant!.longitude,
      dropoffAddress: "Urb. El Viñedo, Calle 140, Valencia",
      dropoffLat: 10.2140,
      dropoffLng: -68.0055,
      recipientName: "Alejandro Gómez",
      recipientPhone: "+58 412 111-2233",
      packageNotes: "Pedido de pizza familiar",
      packageDescription: "Caja de pizza familiar y refresco 2L",
      packageSize: "MEDIUM",
      baseFee: 2.0,
      distanceKm: 3.6,
      totalCost: 2.8,
      status: "DRAFT_SUBMITTED",
    },
  });

  console.log("✅ Seed de Valencia y Naguanagua completado con éxito:");
  console.log(`- 1 DeliveryUser (${deliveryUser.email} / password123)`);
  console.log(`- 1 Admin`);
  console.log(`- 3 Comercios (${merchantUser1.merchant!.businessName}, ${merchantUser2.merchant!.businessName}, ${merchantUser3.merchant!.businessName})`);
  console.log(`- 3 Riders (${riderUser1.rider!.status}, ${riderUser2.rider!.status}, ${riderUser3.rider!.status})`);
  console.log(`- 4 Órdenes (#ORD-1001 DELIVERED, #ORD-1002 IN_TRANSIT, #ORD-1003 PENDING, #ORD-1004 DRAFT_SUBMITTED)`);
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
