/**
 * Utilidad para generación y parsing de enlaces interactivos a Google Maps
 */

export function getGoogleMapsSearchUrl(lat: number, lng: number, label?: string): string {
  if (lat && lng) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  if (label) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(label)}`;
  }
  return "https://www.google.com/maps";
}

export function getGoogleMapsNavigationUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export interface ParsedCoordinates {
  lat: number;
  lng: number;
  label?: string;
  sourceType: "url_at" | "url_query" | "url_embedded" | "raw_coords" | "unknown";
}

/**
 * Parsea cualquier link o texto de Google Maps para extraer latitud y longitud
 */
export function parseGoogleMapsInput(input: string): ParsedCoordinates | null {
  if (!input || typeof input !== "string") return null;
  const str = input.trim();

  // Caso 1: Parámetro @lat,lng (muy común en links de escritorio de Google Maps)
  // Ej: https://www.google.com/maps/place/El+Vi%C3%B1edo/@10.2135,-68.0062,17z/...
  const atMatch = str.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng, sourceType: "url_at" };
    }
  }

  // Caso 2: Parámetros de consulta ?q=lat,lng o &query=lat,lng o ?ll=lat,lng
  // Ej: https://maps.google.com/?q=10.2135,-68.0062
  const queryMatch = str.match(/[?&](?:q|query|ll)=(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/i);
  if (queryMatch) {
    const lat = parseFloat(queryMatch[1]);
    const lng = parseFloat(queryMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng, sourceType: "url_query" };
    }
  }

  // Caso 3: Formato embebido de Google Maps data !3d{lat}!4d{lng}
  const embeddedMatch = str.match(/!3d(-?\d+(?:\.\d+)?)(?:!4d|%214d)(-?\d+(?:\.\d+)?)/i);
  if (embeddedMatch) {
    const lat = parseFloat(embeddedMatch[1]);
    const lng = parseFloat(embeddedMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng, sourceType: "url_embedded" };
    }
  }

  // Caso 4: Coordenadas brutas "10.2135, -68.0062" o "10.2135 -68.0062"
  const rawCoordsMatch = str.match(/^(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)$/);
  if (rawCoordsMatch) {
    const lat = parseFloat(rawCoordsMatch[1]);
    const lng = parseFloat(rawCoordsMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng, sourceType: "raw_coords" };
    }
  }

  return null;
}
