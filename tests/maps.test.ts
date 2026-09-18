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

  // 5. URL resultante de maps.app.goo.gl/e5yEJbWPH4QGoYZa9
  const expandedNaguanagua = "https://www.google.com/maps/place/5ah.+Santa+eduviges,+Puerta+Real,+Naguanagua+2005,+Carabobo/data=!4m6!3m5!1s0x8e805d003729640d:0xc8cb3afe2202549e!7e2!8m2!3d10.2402307!4d-67.99647!18m1!1e1";
  const parsedExpanded = parseGoogleMapsInput(expandedNaguanagua);
  assert(parsedExpanded !== null, "Parseo de URL expandida con !3d!4d no es nulo");
  assert(parsedExpanded?.lat === 10.2402307, "Latitud 10.2402307 extraída correctamente");
  assert(parsedExpanded?.lng === -67.99647, "Longitud -67.99647 extraída correctamente");
  assert(parsedExpanded?.label === "5ah. Santa eduviges, Puerta Real, Naguanagua 2005, Carabobo", "Nombre de lugar extraído correctamente");
  assert(parsedExpanded?.sourceType === "url_embedded", "Tipo de fuente detectado como url_embedded");

  // 6. URL con prefijo loc: y coma codificada %2C
  const parsedLoc = parseGoogleMapsInput("https://maps.google.com/?q=loc%3A10.2402%2C-67.9964");
  assert(parsedLoc !== null, "Parseo con loc: y %2C no es nulo");
  assert(parsedLoc?.lat === 10.2402, "Latitud extraída de loc:");
  assert(parsedLoc?.lng === -67.9964, "Longitud extraída de loc:");

  // 7. Enlace inválido
  const parsedInvalid = parseGoogleMapsInput("https://example.com/not-a-map");
  assert(parsedInvalid === null, "Texto sin coordenadas retorna null");

  console.log(`\n📊 Resumen Maps Tests: ${passed} pasados, ${failed} fallidos.\n`);
  if (failed > 0) {
    throw new Error(`${failed} pruebas fallaron`);
  }
}
