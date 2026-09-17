import { parseGoogleMapsInput, getGoogleMapsSearchUrl, getGoogleMapsNavigationUrl } from "../src/lib/maps";

export function runMapsTests() {
  console.log("🧪 Iniciando Tests de Parser de Enlaces de Google Maps...");
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

  // 1. URL con formato @lat,lng
  const parsedAt = parseGoogleMapsInput("https://www.google.com/maps/place/El+Vi%C3%B1edo/@10.2135,-68.0062,17z/data=!3m1!4b1");
  assert(parsedAt !== null, "Parseo de URL @lat,lng no es nulo");
  assert(parsedAt?.lat === 10.2135, "Latitud correcta extraída de @lat,lng");
  assert(parsedAt?.lng === -68.0062, "Longitud correcta extraída de @lat,lng");
  assert(parsedAt?.sourceType === "url_at", "Tipo de fuente detectado como url_at");

  // 2. URL con query param ?q=lat,lng
  const parsedQ = parseGoogleMapsInput("https://maps.google.com/?q=10.2450,-68.0010");
  assert(parsedQ !== null, "Parseo de URL ?q=lat,lng no es nulo");
  assert(parsedQ?.lat === 10.2450, "Latitud correcta extraída de ?q=");
  assert(parsedQ?.lng === -68.0010, "Longitud correcta extraída de ?q=");
  assert(parsedQ?.sourceType === "url_query", "Tipo de fuente detectado como url_query");

  // 3. URL de búsqueda oficial ?api=1&query=lat,lng
  const parsedSearch = parseGoogleMapsInput("https://www.google.com/maps/search/?api=1&query=-34.5940,-58.3880");
  assert(parsedSearch !== null, "Parseo de URL ?query=lat,lng no es nulo");
  assert(parsedSearch?.lat === -34.5940, "Latitud correcta extraída de query=");
  assert(parsedSearch?.lng === -58.3880, "Longitud correcta extraída de query=");

  // 4. Coordenadas brutas
  const parsedRaw = parseGoogleMapsInput("10.2135, -68.0062");
  assert(parsedRaw !== null, "Parseo de coordenadas brutas 'lat, lng'");
  assert(parsedRaw?.lat === 10.2135, "Latitud correcta de coordenadas brutas");
  assert(parsedRaw?.lng === -68.0062, "Longitud correcta de coordenadas brutas");

  // 5. Enlace inválido
  const parsedInvalid = parseGoogleMapsInput("https://example.com/not-a-map");
  assert(parsedInvalid === null, "Texto sin coordenadas retorna null");

  console.log(`\n📊 Resumen Maps Tests: ${passed} pasados, ${failed} fallidos.\n`);
  if (failed > 0) {
    throw new Error(`${failed} pruebas fallaron`);
  }
}
