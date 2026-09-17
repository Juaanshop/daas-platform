async function testDeleteAndHideHttp() {
  console.log("🌐 Verificando endpoints HTTP de Ocultar y Eliminar en vivo...");

  // 1. Crear un comercio temporal
  const resCreateMerchant = await fetch("http://localhost:3000/api/merchants", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      businessName: "Comercio Temporal HTTP Test",
      name: "Contacto HTTP",
      email: `temp.merchant.${Date.now()}@daas.local`,
      phone: "+58 414 888-0000",
      address: "Calle 137, El Viñedo, Valencia",
      latitude: 10.2135,
      longitude: -68.0062,
      balance: 15.0,
    }),
  });
  const dataCreateMerchant = await resCreateMerchant.json();
  const tempMerchantId = dataCreateMerchant.merchant.id;
  console.log(`  🏢 Comercio temporal creado con ID: ${tempMerchantId}`);

  // 2. Ocultar comercio mediante PATCH /api/merchants
  const resHideMerchant = await fetch("http://localhost:3000/api/merchants", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ merchantId: tempMerchantId, isActive: false }),
  });
  const dataHideMerchant = await resHideMerchant.json();
  console.log(`  👁️‍🗨️ PATCH /api/merchants -> isActive: ${dataHideMerchant.merchant.isActive} (Ocultado)`);
  if (dataHideMerchant.merchant.isActive !== false) throw new Error("Fallo al ocultar comercio vía HTTP");

  // 3. Reactivar comercio mediante PATCH /api/merchants
  const resShowMerchant = await fetch("http://localhost:3000/api/merchants", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ merchantId: tempMerchantId, isActive: true }),
  });
  const dataShowMerchant = await resShowMerchant.json();
  console.log(`  👁️ PATCH /api/merchants -> isActive: ${dataShowMerchant.merchant.isActive} (Reactivado)`);
  if (dataShowMerchant.merchant.isActive !== true) throw new Error("Fallo al reactivar comercio vía HTTP");

  // 4. Eliminar comercio temporal mediante DELETE /api/merchants?id=...
  const resDeleteMerchant = await fetch(`http://localhost:3000/api/merchants?id=${tempMerchantId}`, {
    method: "DELETE",
  });
  const dataDeleteMerchant = await resDeleteMerchant.json();
  console.log(`  🗑️ DELETE /api/merchants -> ok: ${dataDeleteMerchant.ok}, softDeleted: ${dataDeleteMerchant.softDeleted}`);
  if (!dataDeleteMerchant.ok) throw new Error("Fallo al eliminar comercio vía HTTP");

  // 5. Crear y probar repartidor temporal
  const resCreateRider = await fetch("http://localhost:3000/api/riders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Repartidor Temporal HTTP",
      email: `temp.rider.${Date.now()}@daas.local`,
      phone: "+58 412 555-0000",
      vehiclePlate: `DEL${Date.now().toString().slice(-4)}`,
      status: "IDLE",
    }),
  });
  const dataCreateRider = await resCreateRider.json();
  const tempRiderId = dataCreateRider.rider.id;
  console.log(`  🛵 Repartidor temporal creado con ID: ${tempRiderId}`);

  // 6. Ocultar repartidor mediante PATCH /api/riders
  const resHideRider = await fetch("http://localhost:3000/api/riders", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ riderId: tempRiderId, isActive: false }),
  });
  const dataHideRider = await resHideRider.json();
  console.log(`  👁️‍🗨️ PATCH /api/riders -> isActive: ${dataHideRider.rider.isActive}, status: ${dataHideRider.rider.status} (Ocultado y OFFLINE)`);
  if (dataHideRider.rider.isActive !== false || dataHideRider.rider.status !== "OFFLINE") {
    throw new Error("Fallo al ocultar repartidor vía HTTP");
  }

  // 7. Eliminar repartidor mediante DELETE /api/riders?id=...
  const resDeleteRider = await fetch(`http://localhost:3000/api/riders?id=${tempRiderId}`, {
    method: "DELETE",
  });
  const dataDeleteRider = await resDeleteRider.json();
  console.log(`  🗑️ DELETE /api/riders -> ok: ${dataDeleteRider.ok}, softDeleted: ${dataDeleteRider.softDeleted}`);
  if (!dataDeleteRider.ok) throw new Error("Fallo al eliminar repartidor vía HTTP");

  console.log("\n🎉 ¡Todos los endpoints HTTP de Ocultar y Eliminar fueron verificados con éxito!\n");
}

testDeleteAndHideHttp().catch((err) => {
  console.error("❌ Error en test HTTP de delete/hide:", err);
  process.exit(1);
});
