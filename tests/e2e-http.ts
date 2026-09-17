async function testLiveServer() {
  console.log("🌐 Verificando servidor HTTP en vivo (http://localhost:3000)...");

  // 1. GET /admin
  const resAdmin = await fetch("http://localhost:3000/admin");
  console.log(`  🏢 GET /admin -> Status: ${resAdmin.status}`);
  if (resAdmin.status !== 200) throw new Error("GET /admin failed");

  // 2. POST /api/merchants (Registrar un nuevo comercio en Valencia)
  const newMerchantData = {
    businessName: "Gelatería Bellini El Viñedo",
    name: "Vincenzo Bellini",
    email: `vincenzo.${Date.now()}@daas.local`,
    phone: "+58 414 777-1234",
    address: "Calle 138 c/c Av. Monseñor Adams, El Viñedo, Valencia",
    latitude: 10.2140,
    longitude: -68.0060,
    balance: 85.0,
  };

  const resMerchant = await fetch("http://localhost:3000/api/merchants", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newMerchantData),
  });

  const dataMerchant = await resMerchant.json();
  console.log(`  🏪 POST /api/merchants -> Status: ${resMerchant.status}, OK: ${dataMerchant.ok}`);
  if (!dataMerchant.ok) throw new Error(`POST /api/merchants failed: ${JSON.stringify(dataMerchant)}`);
  console.log(`     Comercio Registrado: "${dataMerchant.merchant.businessName}" con balance: $${dataMerchant.merchant.balance}`);

  // 3. POST /api/riders (Dar de alta nuevo rider)
  const newRiderData = {
    name: "Carlos Valbuena",
    email: `carlos.valbuena.${Date.now()}@daas.local`,
    phone: "+58 424 999-5555",
    vehiclePlate: `AB${Date.now().toString().slice(-4)}ZZ`,
    status: "IDLE",
    currentLat: 10.2450,
    currentLng: -68.0010,
  };

  const resRider = await fetch("http://localhost:3000/api/riders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newRiderData),
  });

  const dataRider = await resRider.json();
  console.log(`  🛵 POST /api/riders -> Status: ${resRider.status}, OK: ${dataRider.ok}`);
  if (!dataRider.ok) throw new Error(`POST /api/riders failed: ${JSON.stringify(dataRider)}`);
  console.log(`     Repartidor Dado de Alta: "${dataRider.rider.user.name}" con placa: ${dataRider.rider.vehiclePlate}`);

  // 4. GET /api/merchants y GET /api/riders para verificar listados completos
  const resAllMerchants = await fetch("http://localhost:3000/api/merchants");
  const dataAllMerchants = await resAllMerchants.json();
  console.log(`  📋 Total Comercios en Base de Datos: ${dataAllMerchants.merchants.length}`);

  const resAllRiders = await fetch("http://localhost:3000/api/riders");
  const dataAllRiders = await resAllRiders.json();
  console.log(`  📋 Total Repartidores en Base de Datos: ${dataAllRiders.riders.length}`);

  console.log("\n🎉 ¡Todas las llamadas HTTP en vivo al BackOffice funcionaron a la perfección!\n");
}

testLiveServer().catch((err) => {
  console.error("❌ Error en test de servidor en vivo:", err);
  process.exit(1);
});
