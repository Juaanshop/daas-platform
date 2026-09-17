import { GeofenceService } from "../src/services/geofence";

export function runGeofenceTests() {
  console.log("🧪 Iniciando Tests del Motor de Geocercas (Valencia & Naguanagua)...");
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

  // 1. Puntos dentro de Valencia
  const elVinedo = GeofenceService.checkLocationCoverage(10.2135, -68.0062);
  assert(elVinedo.isCovered === true, "El Viñedo está dentro de la cobertura");
  assert(elVinedo.municipality === "Valencia", "El Viñedo pertenece a Valencia");

  const prebo = GeofenceService.checkLocationCoverage(10.2170, -68.0120);
  assert(prebo.isCovered === true, "Prebo I está dentro de la cobertura");
  assert(prebo.municipality === "Valencia", "Prebo pertenece a Valencia");

  const trigal = GeofenceService.checkLocationCoverage(10.2280, -67.9890);
  assert(trigal.isCovered === true, "El Trigal Norte está dentro de la cobertura");
  assert(trigal.municipality === "Valencia", "El Trigal pertenece a Valencia");

  const centroValencia = GeofenceService.checkLocationCoverage(10.1800, -68.0039);
  assert(centroValencia.isCovered === true, "Casco Central de Valencia está dentro de la cobertura");
  assert(centroValencia.municipality === "Valencia", "Casco Central pertenece a Valencia");

  // 2. Puntos dentro de Naguanagua
  const laGranja = GeofenceService.checkLocationCoverage(10.2485, -68.0105);
  assert(laGranja.isCovered === true, "C.C. La Granja está dentro de la cobertura");
  assert(laGranja.municipality === "Naguanagua", "C.C. La Granja pertenece a Naguanagua");

  const manongo = GeofenceService.checkLocationCoverage(10.2450, -68.0010);
  assert(manongo.isCovered === true, "Mañongo (C.C. Sambil) está dentro de la cobertura");
  assert(manongo.municipality === "Naguanagua", "Mañongo pertenece a Naguanagua");

  const tazajal = GeofenceService.checkLocationCoverage(10.2660, -68.0090);
  assert(tazajal.isCovered === true, "Tazajal está dentro de la cobertura");
  assert(tazajal.municipality === "Naguanagua", "Tazajal pertenece a Naguanagua");

  const barbula = GeofenceService.checkLocationCoverage(10.2780, -68.0160);
  assert(barbula.isCovered === true, "Bárbula / Campus UC está dentro de la cobertura");
  assert(barbula.municipality === "Naguanagua", "Bárbula pertenece a Naguanagua");

  // 3. Puntos dentro de San Diego
  const finDeSiglo = GeofenceService.checkLocationCoverage(10.2520, -67.9540);
  assert(finDeSiglo.isCovered === true, "C.C. Fin de Siglo está dentro de la cobertura");
  assert(finDeSiglo.municipality === "San Diego", "C.C. Fin de Siglo pertenece a San Diego");

  const elRemanso = GeofenceService.checkLocationCoverage(10.2650, -67.9480);
  assert(elRemanso.isCovered === true, "El Remanso está dentro de la cobertura");
  assert(elRemanso.municipality === "San Diego", "El Remanso pertenece a San Diego");

  const elMorro = GeofenceService.checkLocationCoverage(10.2440, -67.9620);
  assert(elMorro.isCovered === true, "El Morro I está dentro de la cobertura");
  assert(elMorro.municipality === "San Diego", "El Morro I pertenece a San Diego");

  // 4. Puntos fuera de zona (Rechazo estricto)
  const caracas = GeofenceService.checkLocationCoverage(10.4910, -66.8530);
  assert(caracas.isCovered === false, "Caracas es rechazada (fuera de rango)");
  assert(Boolean(caracas.error?.includes("Valencia, Naguanagua y San Diego")), "Mensaje de error especifica Valencia, Naguanagua y San Diego");

  const maracay = GeofenceService.checkLocationCoverage(10.2469, -67.5958);
  assert(maracay.isCovered === false, "Maracay es rechazada (fuera de rango)");

  const puertoCabello = GeofenceService.checkLocationCoverage(10.4731, -68.0125);
  assert(puertoCabello.isCovered === false, "Puerto Cabello es rechazado (fuera de conurbación)");

  const buenosAires = GeofenceService.checkLocationCoverage(-34.6037, -58.3816);
  assert(buenosAires.isCovered === false, "Coordenadas internacionales (Buenos Aires) son rechazadas");

  // 5. Validación de trayectos completos (Retiro y Entrega)
  // Caso A: Intermunicipal Valencia (El Viñedo) -> Naguanagua (Sambil Mañongo)
  const crossDispatch = GeofenceService.validateDispatchCoverage(
    [10.2135, -68.0062],
    [10.2450, -68.0010]
  );
  assert(crossDispatch.isValid === true, "Despacho intermunicipal Valencia -> Naguanagua es válido");
  assert(crossDispatch.originZone === "Valencia", "Origen detectado como Valencia");
  assert(crossDispatch.destinationZone === "Naguanagua", "Destino detectado como Naguanagua");

  // Caso B: Intermunicipal Valencia (El Viñedo) -> San Diego (C.C. Fin de Siglo)
  const valenciaToSanDiego = GeofenceService.validateDispatchCoverage(
    [10.2135, -68.0062],
    [10.2520, -67.9540]
  );
  assert(valenciaToSanDiego.isValid === true, "Despacho intermunicipal Valencia -> San Diego es válido");
  assert(valenciaToSanDiego.originZone === "Valencia", "Origen detectado como Valencia");
  assert(valenciaToSanDiego.destinationZone === "San Diego", "Destino detectado como San Diego");

  // Caso C: Intermunicipal Naguanagua (La Granja) -> San Diego (El Remanso)
  const naguanaguaToSanDiego = GeofenceService.validateDispatchCoverage(
    [10.2485, -68.0105],
    [10.2650, -67.9480]
  );
  assert(naguanaguaToSanDiego.isValid === true, "Despacho intermunicipal Naguanagua -> San Diego es válido");
  assert(naguanaguaToSanDiego.originZone === "Naguanagua", "Origen detectado como Naguanagua");
  assert(naguanaguaToSanDiego.destinationZone === "San Diego", "Destino detectado como San Diego");

  // Caso D: Intramunicipal San Diego -> San Diego
  const localSanDiego = GeofenceService.validateDispatchCoverage(
    [10.2520, -67.9540], // C.C. Fin de Siglo
    [10.2650, -67.9480]  // El Remanso
  );
  assert(localSanDiego.isValid === true, "Despacho local San Diego -> San Diego es válido");
  assert(localSanDiego.originZone === "San Diego", "Origen San Diego");
  assert(localSanDiego.destinationZone === "San Diego", "Destino San Diego");

  // Caso E: Intramunicipal Naguanagua -> Naguanagua
  const localNaguanagua = GeofenceService.validateDispatchCoverage(
    [10.2485, -68.0105],
    [10.2660, -68.0090]
  );
  assert(localNaguanagua.isValid === true, "Despacho local Naguanagua -> Naguanagua es válido");

  // Caso F: Destino fuera de rango
  const invalidDest = GeofenceService.validateDispatchCoverage(
    [10.2135, -68.0062], // El Viñedo
    [10.4910, -66.8530]  // Caracas
  );
  assert(invalidDest.isValid === false, "Despacho con destino fuera de zona es rechazado");
  assert(Boolean(invalidDest.error?.includes("Punto de entrega no autorizado")), "Error indica entrega no autorizada");

  // Caso G: Origen fuera de rango
  const invalidOrigin = GeofenceService.validateDispatchCoverage(
    [10.4910, -66.8530], // Caracas
    [10.2135, -68.0062]  // El Viñedo
  );
  assert(invalidOrigin.isValid === false, "Despacho con origen fuera de zona es rechazado");
  assert(Boolean(invalidOrigin.error?.includes("Punto de retiro no autorizado")), "Error indica retiro no autorizado");

  console.log(`\n📊 Resumen Geofence Tests: ${passed} pasados, ${failed} fallidos.\n`);
  if (failed > 0) {
    throw new Error(`${failed} pruebas de geocerca fallaron`);
  }
}
