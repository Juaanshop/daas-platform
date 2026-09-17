import { WhatsAppService } from "../src/services/whatsapp";

export function runWhatsAppTests() {
  console.log("🧪 Iniciando Tests de Notificaciones de WhatsApp y Google Maps...");
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

  // 1. Test de limpieza de número de teléfono
  const cleanPhone = WhatsAppService.cleanPhoneNumber("+54 11 9876-5432");
  assert(cleanPhone === "541198765432", "Teléfono internacional formateado numéricamente sin símbolos");

  // 2. Test de generación de mensaje completo
  const notification = WhatsAppService.generateDispatchNotification({
    orderNumber: "#ORD-1005",
    totalCost: 3.5,
    pickupAddress: "Av. Corrientes 1245, Centro",
    pickupLat: -34.6037,
    pickupLng: -58.3816,
    dropoffAddress: "Juncal 1420, Recoleta",
    dropoffLat: -34.594,
    dropoffLng: -58.388,
    recipientName: "Ignacio Albarracín",
    recipientPhone: "+54 11 5566-7788",
    packageNotes: "Fugazzeta Rellena con queso extra",
    merchantName: "Pizzería Napoli Centro",
    merchantPhone: "+54 11 4321-8899",
    riderName: "Lucas Torres",
    riderPhone: "+54 11 9876-5432",
  });

  assert(notification.whatsappUrl.startsWith("https://wa.me/541198765432?text="), "URL wa.me generada correctamente para el teléfono del rider");
  assert(notification.message.includes("#ORD-1005"), "Mensaje contiene el número de orden");
  assert(notification.message.includes("Pizzería Napoli Centro"), "Mensaje contiene el nombre del comercio");
  assert(notification.message.includes("Av. Corrientes 1245, Centro"), "Mensaje contiene dirección de retiro");
  assert(notification.message.includes("+54 11 4321-8899"), "Mensaje contiene teléfono del comercio");
  assert(notification.message.includes("Ignacio Albarracín"), "Mensaje contiene nombre del destinatario");
  assert(notification.message.includes("+54 11 5566-7788"), "Mensaje contiene teléfono del destinatario");
  assert(notification.message.includes("Juncal 1420, Recoleta"), "Mensaje contiene dirección de entrega");
  assert(notification.message.includes("https://www.google.com/maps/search/?api=1&query=-34.594,-58.388"), "Mensaje contiene enlace directo a Google Maps del destino");
  assert(notification.message.includes("https://www.google.com/maps/dir/?api=1&destination=-34.594,-58.388"), "Mensaje contiene enlace directo para navegación GPS");

  console.log(`\n📊 Resumen WhatsApp Tests: ${passed} pasados, ${failed} fallidos.\n`);
  if (failed > 0) {
    throw new Error(`${failed} pruebas fallaron`);
  }
}
