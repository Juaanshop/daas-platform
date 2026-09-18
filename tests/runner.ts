import { runGeofenceTests } from "./geofence.test";
import { runPricingTests } from "./pricing.test";
import { runOrderFlowTests } from "./order-flow.test";
import { runWhatsAppTests } from "./whatsapp.test";
import { runMapsTests } from "./maps.test";
import { runDistanceTests } from "./distance.test";
import { runSettlementTests } from "./settlement.test";
import { runMerchantsAndRidersTests } from "./merchants-riders.test";
import { runDeleteAndHideTests } from "./merchants-riders-delete-hide.test";
import { runEditMerchantsAndRidersTests } from "./merchants-riders-edit.test";
import { runDeliveryAuthAndMerchantsTests } from "./delivery-auth-merchants.test";
import { runMerchantQuoteAndOrderFlowTests } from "./merchant-quote-order-flow.test";

async function runAllTests() {
  console.log("==========================================================");
  console.log("🚀 EJECUTANDO SUITE DE TESTS - DAAS PLATFORM");
  console.log("==========================================================\n");

  try {
    runGeofenceTests();
    runPricingTests();
    runOrderFlowTests();
    runWhatsAppTests();
    runMapsTests();
    await runDistanceTests();
    await runSettlementTests();
    await runMerchantsAndRidersTests();
    await runDeleteAndHideTests();
    await runEditMerchantsAndRidersTests();
    await runDeliveryAuthAndMerchantsTests();
    await runMerchantQuoteAndOrderFlowTests();
    console.log("🎉 ¡TODOS LOS TESTS DE UNIDAD PASARON SATISFACTORIAMENTE!\n");
    process.exit(0);
  } catch (err) {
    console.error("💥 Error en ejecución de tests:", err);
    process.exit(1);
  }
}

runAllTests();
