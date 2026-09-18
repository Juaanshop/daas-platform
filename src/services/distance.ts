/**
 * Distance & Routing Engine (Google Maps Distance Matrix API con Fallback a Haversine)
 *
 * Provee cálculo de distancia vial exacta y duración estimada con tráfico
 * para el cálculo de costos de despacho en la plataforma DaaS.
 */

import { calculateHaversineDistance } from "./pricing";

export interface RouteDistanceResult {
  distanceKm: number;
  durationMinutes: number;
  provider: "google_maps" | "osrm" | "haversine";
  statusText?: string;
}

export class GoogleMapsDistanceService {
  /**
   * Obtiene la clave de servidor de Google Maps (o la clave pública como fallback)
   */
  static getApiKey(): string | undefined {
    return (
      process.env.GOOGLE_MAPS_SERVER_KEY?.trim() ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
      undefined
    );
  }

  /**
   * Calcula la distancia de ruta y duración entre dos coordenadas [lat, lng].
   * 1. Utiliza Google Maps Distance Matrix API si la clave está configurada.
   * 2. Si no hay clave o falla, utiliza OSRM (Open Source Routing Machine) para calcular distancia vial real vehicular.
   * 3. Como contingencia final ante fallas de red, conmuta a Haversine.
   */
  static async calculateRouteDistance(
    origin: [number, number],
    destination: [number, number]
  ): Promise<RouteDistanceResult> {
    const [lat1, lng1] = origin;
    const [lat2, lng2] = destination;

    if (lat1 === lat2 && lng1 === lng2) {
      return {
        distanceKm: 0,
        durationMinutes: 0,
        provider: "haversine",
        statusText: "Origen y destino idénticos",
      };
    }

    const apiKey = this.getApiKey();

    if (apiKey) {
      try {
        const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
        url.searchParams.set("origins", `${lat1},${lng1}`);
        url.searchParams.set("destinations", `${lat2},${lng2}`);
        url.searchParams.set("mode", "driving");
        url.searchParams.set("language", "es");
        url.searchParams.set("key", apiKey);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(url.toString(), {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const element = data.rows?.[0]?.elements?.[0];
          if (data.status === "OK" && element && element.status === "OK") {
            const distanceMeters = element.distance.value;
            const distanceKm = Math.round((distanceMeters / 1000) * 100) / 100;
            const durationSeconds =
              element.duration_in_traffic?.value || element.duration?.value || 0;
            const durationMinutes = Math.max(1, Math.round(durationSeconds / 60 + 5));

            return {
              distanceKm,
              durationMinutes,
              provider: "google_maps",
              statusText: `Ruta vial Google Maps (${element.distance.text}, ${element.duration.text})`,
            };
          }
        }
      } catch (err: any) {
        console.warn("Google Maps Distance Matrix falló, intentando OSRM vial:", err?.message);
      }
    }

    // 2. Ruta vial precisa mediante OSRM (Rutas vehiculares reales por calles y autopistas)
    const osrmResult = await this.queryOsrmRoute(origin, destination);
    if (osrmResult) {
      return osrmResult;
    }

    // 3. Fallback de contingencia a Haversine
    return this.fallbackHaversine(origin, destination, "Modo local: Contingencia Haversine");
  }

  /**
   * Consulta OSRM (Open Source Routing Machine) para calcular distancia vial real y tiempo de manejo
   * sin requerir API key ni incurrir en costos.
   */
  private static async queryOsrmRoute(
    origin: [number, number],
    destination: [number, number]
  ): Promise<RouteDistanceResult | null> {
    const [lat1, lng1] = origin;
    const [lat2, lng2] = destination;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=false`;
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(timeoutId);

      if (!res.ok) return null;
      const data = await res.json();
      if (data.code !== "Ok" || !data.routes?.[0]) return null;

      const route = data.routes[0];
      const distanceKm = Math.round((route.distance / 1000) * 100) / 100;
      const durationMinutes = Math.max(1, Math.round(route.duration / 60 + 5));

      return {
        distanceKm,
        durationMinutes,
        provider: "osrm",
        statusText: `Ruta vial OSRM (${distanceKm} km, ~${durationMinutes} min)`,
      };
    } catch {
      return null;
    }
  }

  /**
   * Cálculo de contingencia mediante Haversine y modelo de velocidad urbana.
   * Aplica un coeficiente de sinuosidad vial (Urban Road Circuity Factor de 1.25x)
   * para aproximar con alta fidelidad el kilometraje real de calles y avenidas
   * en Valencia y Naguanagua antes de contar con la API Key de Google Maps.
   */
  private static fallbackHaversine(
    origin: [number, number],
    destination: [number, number],
    reason?: string
  ): RouteDistanceResult {
    const rawDistanceKm = calculateHaversineDistance(
      origin[0],
      origin[1],
      destination[0],
      destination[1]
    );

    // Factor de sinuosidad urbana: 1.25x para rutas vehiculares reales (avenidas, retornos, cruces)
    const circuityFactor = rawDistanceKm === 0 ? 1 : 1.25;
    const distanceKm = Math.round(rawDistanceKm * circuityFactor * 100) / 100;

    // Velocidad media urbana: 25 km/h + 5 minutos fijos de retiro/entrega
    const travelMinutes = (distanceKm / 25.0) * 60;
    const durationMinutes = Math.max(8, Math.round(travelMinutes + 5));

    return {
      distanceKm,
      durationMinutes,
      provider: "haversine",
      statusText: reason || "Estimación de red vial urbana (Circuity Factor 1.25x)",
    };
  }
}
