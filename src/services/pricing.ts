/**
 * Pricing Engine (Servicio modular de cotización para entregas DaaS)
 *
 * Reglas de Tarifación:
 * - Tarifa Base Variable: Mínimo $2.00 en adelante
 *   • Tarifa Base Local (mismo municipio: Valencia, Naguanagua o San Diego): $2.00 (cubre los primeros 2.0 km)
 *   • Tarifa Base Intermunicipal (Valencia <-> Naguanagua <-> San Diego): $2.50 (cubre los primeros 2.0 km)
 *   • Tarifa Base Personalizada / Prioritaria: Permite montos >= $2.00 (ej. $2.50, $3.00, $3.50, etc.)
 * - Tarifa por Km adicional: $0.50 / km posterior a 2.0 km
 * - Tiempo estimado: Calculado sobre velocidad media urbana de 25 km/h + 5 min de preparación/retiro
 */

import { GeofenceService, Municipality } from "./geofence";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface PricingInput {
  origin: [number, number]; // [lat, lng]
  destination: [number, number]; // [lat, lng]
  baseFee?: number; // Tarifa base variable (mínimo $2.00)
}

export interface PricingQuote {
  distanceKm: number;
  estimatedMinutes: number;
  baseFee: number;
  extraKmFee: number;
  totalCost: number;
  isCovered: boolean;
  isIntermunicipal: boolean;
  coverageError?: string;
  originZone?: Municipality | null;
  destinationZone?: Municipality | null;
  distanceProvider?: "google_maps" | "haversine";
  providerStatusText?: string;
}

const EARTH_RADIUS_KM = 6371;
export const MIN_BASE_FEE = 2.0;
export const DEFAULT_LOCAL_BASE_FEE = 2.0;
export const INTERMUNICIPAL_BASE_FEE = 2.5;
export const BASE_KM_COVERAGE = 2.0;
export const EXTRA_KM_RATE = 0.5;
const AVG_SPEED_KMH = 25.0; // Velocidad promedio de moto en ciudad
const FIXED_PREP_MINUTES = 5; // Retiro y entrega

/**
 * Calcula la distancia en kilómetros usando la fórmula de Haversine
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (angle: number) => (angle * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(phi1) * Math.cos(phi2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = EARTH_RADIUS_KM * c;
  // Redondeo a 2 decimales
  return Math.round(distance * 100) / 100;
}

export class PricingService {
  /**
   * Cotiza una entrega dados los puntos de origen y destino [lat, lng] y tarifa base variable opcional
   * (Modo sincrónico utilizando la fórmula de Haversine)
   */
  static calculateQuote(input: PricingInput): PricingQuote {
    const [lat1, lng1] = input.origin;
    const [lat2, lng2] = input.destination;

    const distanceKm = calculateHaversineDistance(lat1, lng1, lat2, lng2);

    // Verificación de cobertura en Valencia y Naguanagua
    const coverage = GeofenceService.validateDispatchCoverage(
      input.origin,
      input.destination
    );

    const isIntermunicipal = Boolean(
      coverage.originZone &&
        coverage.destinationZone &&
        coverage.originZone !== coverage.destinationZone
    );

    let baseFee: number;
    if (input.baseFee !== undefined && input.baseFee !== null) {
      baseFee = Math.max(MIN_BASE_FEE, Math.round(input.baseFee * 100) / 100);
    } else if (isIntermunicipal) {
      baseFee = INTERMUNICIPAL_BASE_FEE;
    } else {
      baseFee = DEFAULT_LOCAL_BASE_FEE;
    }

    let extraKm = 0;
    if (distanceKm > BASE_KM_COVERAGE) {
      extraKm = distanceKm - BASE_KM_COVERAGE;
    }

    const extraKmFee = Math.round(extraKm * EXTRA_KM_RATE * 100) / 100;
    const totalCost = Math.round((baseFee + extraKmFee) * 100) / 100;

    // Tiempo estimado = (distancia / velocidad * 60) + preparación
    const travelMinutes = (distanceKm / AVG_SPEED_KMH) * 60;
    const estimatedMinutes = Math.max(
      8,
      Math.round(travelMinutes + FIXED_PREP_MINUTES)
    );

    return {
      distanceKm,
      estimatedMinutes,
      baseFee,
      extraKmFee,
      totalCost,
      isCovered: coverage.isValid,
      isIntermunicipal,
      coverageError: coverage.error,
      originZone: coverage.originZone,
      destinationZone: coverage.destinationZone,
      distanceProvider: "haversine",
      providerStatusText: "Cálculo ortodrómico Haversine",
    };
  }

  /**
   * Cotiza una entrega consultando Google Maps Distance Matrix API para obtener
   * la distancia vial exacta y tiempo de viaje con tráfico, con fallback a Haversine.
   */
  static async calculateQuoteAsync(input: PricingInput): Promise<PricingQuote> {
    // Importación dinámica o directa de GoogleMapsDistanceService
    const { GoogleMapsDistanceService } = await import("./distance");
    const route = await GoogleMapsDistanceService.calculateRouteDistance(
      input.origin,
      input.destination
    );

    const distanceKm = route.distanceKm;

    // Verificación de cobertura en Valencia y Naguanagua
    const coverage = GeofenceService.validateDispatchCoverage(
      input.origin,
      input.destination
    );

    const isIntermunicipal = Boolean(
      coverage.originZone &&
        coverage.destinationZone &&
        coverage.originZone !== coverage.destinationZone
    );

    let baseFee: number;
    if (input.baseFee !== undefined && input.baseFee !== null) {
      baseFee = Math.max(MIN_BASE_FEE, Math.round(input.baseFee * 100) / 100);
    } else if (isIntermunicipal) {
      baseFee = INTERMUNICIPAL_BASE_FEE;
    } else {
      baseFee = DEFAULT_LOCAL_BASE_FEE;
    }

    let extraKm = 0;
    if (distanceKm > BASE_KM_COVERAGE) {
      extraKm = distanceKm - BASE_KM_COVERAGE;
    }

    const extraKmFee = Math.round(extraKm * EXTRA_KM_RATE * 100) / 100;
    const totalCost = Math.round((baseFee + extraKmFee) * 100) / 100;

    return {
      distanceKm,
      estimatedMinutes: route.durationMinutes,
      baseFee,
      extraKmFee,
      totalCost,
      isCovered: coverage.isValid,
      isIntermunicipal,
      coverageError: coverage.error,
      originZone: coverage.originZone,
      destinationZone: coverage.destinationZone,
      distanceProvider: route.provider,
      providerStatusText: route.statusText,
    };
  }
}

