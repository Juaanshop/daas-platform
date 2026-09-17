/**
 * Geofencing & Service Coverage Engine
 * 
 * Delimita el rango operativo para entregas exclusivamente dentro de
 * los municipios conurbados de Valencia, Naguanagua y San Diego,
 * Estado Carabobo, Venezuela.
 */

export type Municipality = "Valencia" | "Naguanagua" | "San Diego";

export interface ZoneSector {
  name: string;
  municipality: Municipality;
  centerLat: number;
  centerLng: number;
}

export interface GeofenceLocationResult {
  isCovered: boolean;
  municipality: Municipality | null;
  nearestSector?: string;
  error?: string;
}

export interface CoverageResult {
  isValid: boolean;
  originZone: Municipality | null;
  destinationZone: Municipality | null;
  error?: string;
}

/**
 * Sectores representativos urbanos de Valencia, Naguanagua y San Diego
 */
export const REPRESENTATIVE_SECTORS: ZoneSector[] = [
  // Naguanagua (Norte)
  { name: "La Granja / C.C. Cristal", municipality: "Naguanagua", centerLat: 10.2485, centerLng: -68.0105 },
  { name: "Mañongo / C.C. Sambil", municipality: "Naguanagua", centerLat: 10.2450, centerLng: -68.0010 },
  { name: "Tazajal / Las Quintas", municipality: "Naguanagua", centerLat: 10.2660, centerLng: -68.0090 },
  { name: "Bárbula / Campus UC", municipality: "Naguanagua", centerLat: 10.2780, centerLng: -68.0160 },
  { name: "Naguanagua Centro / Av. Universidad", municipality: "Naguanagua", centerLat: 10.2540, centerLng: -68.0120 },
  { name: "Guere / La Campiña", municipality: "Naguanagua", centerLat: 10.2610, centerLng: -68.0200 },

  // Valencia (Centro y Norte de Valencia)
  { name: "El Viñedo / Calle de los Cafés", municipality: "Valencia", centerLat: 10.2135, centerLng: -68.0062 },
  { name: "Prebo I y II", municipality: "Valencia", centerLat: 10.2170, centerLng: -68.0120 },
  { name: "El Trigal Norte y Centro", municipality: "Valencia", centerLat: 10.2280, centerLng: -67.9890 },
  { name: "La Trigaleña", municipality: "Valencia", centerLat: 10.2220, centerLng: -67.9940 },
  { name: "Las Chimeneas", municipality: "Valencia", centerLat: 10.2180, centerLng: -67.9850 },
  { name: "Guaparo", municipality: "Valencia", centerLat: 10.2310, centerLng: -68.0090 },
  { name: "Los Sauces / San José", municipality: "Valencia", centerLat: 10.2080, centerLng: -68.0020 },
  { name: "Casco Central / Plaza Bolívar", municipality: "Valencia", centerLat: 10.1800, centerLng: -68.0039 },
  { name: "Santa Rosa / Michelena", municipality: "Valencia", centerLat: 10.1600, centerLng: -67.9980 },

  // San Diego (Valle de San Diego)
  { name: "La Esmeralda / C.C. Fin de Siglo", municipality: "San Diego", centerLat: 10.2520, centerLng: -67.9540 },
  { name: "El Remanso / Los Jarales", municipality: "San Diego", centerLat: 10.2650, centerLng: -67.9480 },
  { name: "El Morro I y II", municipality: "San Diego", centerLat: 10.2440, centerLng: -67.9620 },
  { name: "Valle Verde / La Esmeralda Sur", municipality: "San Diego", centerLat: 10.2350, centerLng: -67.9500 },
  { name: "Pueblo de San Diego / Casco Colonial", municipality: "San Diego", centerLat: 10.2580, centerLng: -67.9250 },
  { name: "Zona Castillito / C.C. Metrópolis", municipality: "San Diego", centerLat: 10.2050, centerLng: -67.9550 },
];

/**
 * Coordenadas límite generales de la conurbación Valencia - Naguanagua - San Diego
 * Carabobo, Venezuela
 */
export const COVERAGE_BOUNDS = {
  // Límite norte: Bárbula / La Cumaca / Puente Bárbula / La Entrada
  maxLat: 10.3050,
  // Límite sur: Sur de Valencia / Castillito / Santa Rosa / Plaza de Toros
  minLat: 10.1300,
  // Límite oeste: Faldas del cerro / San Antonio / Naguanagua Oeste
  minLng: -68.0650,
  // Límite este: Límite este de San Diego con Guacara y Yagua
  maxLng: -67.8800,
  // Latitud que divide aproximadamente Naguanagua (Norte) y Valencia (Sur) sobre la Redoma de Guaparo
  naguanaguaValenciaBorderLat: 10.2350,
  // Longitud que divide el valle de San Diego (Este) de Valencia y Naguanagua (Oeste)
  sanDiegoRidgeLng: -67.9650,
};

export class GeofenceService {
  /**
   * Verifica si un punto dado está dentro del polígono general de cobertura
   */
  static isWithinCoverageBounds(lat: number, lng: number): boolean {
    return (
      lat >= COVERAGE_BOUNDS.minLat &&
      lat <= COVERAGE_BOUNDS.maxLat &&
      lng >= COVERAGE_BOUNDS.minLng &&
      lng <= COVERAGE_BOUNDS.maxLng
    );
  }

  /**
   * Detecta el municipio según la posición geográfica
   */
  static detectMunicipality(lat: number, lng: number): Municipality | null {
    if (!this.isWithinCoverageBounds(lat, lng)) {
      return null;
    }
    // Si se ubica al este de la fila montañosa, pertenece a San Diego
    if (lng > COVERAGE_BOUNDS.sanDiegoRidgeLng) {
      return "San Diego";
    }
    // Si se ubica al oeste, se divide entre Naguanagua (Norte) y Valencia (Sur)
    return lat >= COVERAGE_BOUNDS.naguanaguaValenciaBorderLat
      ? "Naguanagua"
      : "Valencia";
  }

  /**
   * Encuentra el sector más cercano para feedback visual al usuario
   */
  static findNearestSector(lat: number, lng: number): ZoneSector | undefined {
    let nearest: ZoneSector | undefined = undefined;
    let minDistance = Infinity;

    for (const sector of REPRESENTATIVE_SECTORS) {
      const dLat = sector.centerLat - lat;
      const dLng = sector.centerLng - lng;
      const distance = Math.sqrt(dLat * dLat + dLng * dLng);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = sector;
      }
    }

    return nearest;
  }

  /**
   * Valida un único punto geográfico
   */
  static checkLocationCoverage(lat: number, lng: number): GeofenceLocationResult {
    const isCovered = this.isWithinCoverageBounds(lat, lng);
    if (!isCovered) {
      return {
        isCovered: false,
        municipality: null,
        error: `Las coordenadas [${lat.toFixed(4)}, ${lng.toFixed(4)}] están fuera del área de cobertura autorizada. El servicio de despacho solo opera en las ciudades de Valencia, Naguanagua y San Diego (Carabobo, Venezuela).`,
      };
    }

    const municipality = this.detectMunicipality(lat, lng);
    const nearest = this.findNearestSector(lat, lng);

    return {
      isCovered: true,
      municipality,
      nearestSector: nearest?.name,
    };
  }

  /**
   * Valida que tanto el punto de retiro (comercio) como el punto de entrega (cliente)
   * se encuentren dentro de Valencia, Naguanagua o San Diego
   */
  static validateDispatchCoverage(
    origin: [number, number],
    destination: [number, number]
  ): CoverageResult {
    const [originLat, originLng] = origin;
    const [destLat, destLng] = destination;

    const originCheck = this.checkLocationCoverage(originLat, originLng);
    if (!originCheck.isCovered) {
      return {
        isValid: false,
        originZone: null,
        destinationZone: null,
        error: `Punto de retiro no autorizado: El comercio se encuentra fuera de Valencia, Naguanagua y San Diego ([${originLat.toFixed(4)}, ${originLng.toFixed(4)}]).`,
      };
    }

    const destCheck = this.checkLocationCoverage(destLat, destLng);
    if (!destCheck.isCovered) {
      return {
        isValid: false,
        originZone: originCheck.municipality,
        destinationZone: null,
        error: `Punto de entrega no autorizado: La dirección de entrega está fuera del rango de cobertura ([${destLat.toFixed(4)}, ${destLng.toFixed(4)}]). Solo despachamos dentro de Valencia, Naguanagua y San Diego (Carabobo, Venezuela).`,
      };
    }

    return {
      isValid: true,
      originZone: originCheck.municipality,
      destinationZone: destCheck.municipality,
    };
  }
}

