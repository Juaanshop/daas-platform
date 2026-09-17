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
  provider: "google_maps" | "haversine";
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
   * Utiliza Google Maps Distance Matrix API si la clave está configurada;
   * si no, o ante cualquier eventualidad de red/cuota, conmuta automáticamente a Haversine.
   */
  static async calculateRouteDistance(
    origin: [number, number],
    destination: [number, number]
  ): Promise<RouteDistanceResult> {
    const [lat1, lng1] = origin;
    const [lat2, lng2] = destination;

    const apiKey = this.getApiKey();

    // Si no hay API Key configurada, usar inmediatamente Haversine
    if (!apiKey) {
      return this.fallbackHaversine(origin, destination, "Modo local: Sin API Key de Google Maps");
    }

    try {
      const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
      url.searchParams.set("origins", `${lat1},${lng1}`);
      url.searchParams.set("destinations", `${lat2},${lng2}`);
      url.searchParams.set("mode", "driving");
      url.searchParams.set("language", "es");
      url.searchParams.set("key", apiKey);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

      const res = await fetch(url.toString(), {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        return this.fallbackHaversine(
          origin,
          destination,
          `Google Maps API HTTP error: ${res.status}`
        );
      }

      const data = await res.json();

      if (data.status !== "OK" || !data.rows?.[0]?.elements?.[0]) {
        return this.fallbackHaversine(
          origin,
          destination,
          `Google Maps Status: ${data.status || "UNKNOWN"}`
        );
      }

      const element = data.rows[0].elements[0];
      if (element.status !== "OK") {
        return this.fallbackHaversine(
          origin,
          destination,
          `Element Status: ${element.status} (sin ruta vial disponible)`
        );
      }

      // Distancia en metros convertida a kilómetros (2 decimales)
      const distanceMeters = element.distance.value;
      const distanceKm = Math.round((distanceMeters / 1000) * 100) / 100;

      // Duración en segundos convertida a minutos + 5 min fijos de entrega/recepción
      const durationSeconds =
        element.duration_in_traffic?.value || element.duration?.value || 0;
      const durationMinutes = Math.max(8, Math.round(durationSeconds / 60 + 5));

      return {
        distanceKm,
        durationMinutes,
        provider: "google_maps",
        statusText: `Ruta vial Google Maps (${element.distance.text}, ${element.duration.text})`,
      };
    } catch (err: any) {
      return this.fallbackHaversine(
        origin,
        destination,
        `Excepción en Distance Matrix: ${err.message || "Error desconocido"}`
      );
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
