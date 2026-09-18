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
  let str = input.trim();

  // Decodificar entidades de URI (%2C -> ,, %20 -> espacio, %21 -> !)
  try {
    str = decodeURIComponent(str);
  } catch {
    // Si no se puede decodificar, continuamos con str original
  }

  // Extraer nombre de lugar si viene en el path /maps/place/...
  let label: string | undefined;
  const placeMatch = str.match(/\/maps\/place\/([^/@?]+)/i);
  if (placeMatch) {
    const rawPlace = placeMatch[1].replace(/\+/g, " ").trim();
    // Si el nombre del lugar no son solo coordenadas, guardarlo como etiqueta legible
    if (!/^-?\d+(\.\d+)?\s*,\s*-?\d+/.test(rawPlace)) {
      label = rawPlace;
    }
  }

  // Caso 1: Parámetro @lat,lng (común en Google Maps)
  // Ej: https://www.google.com/maps/place/.../@10.2135,-68.0062,17z/...
  const atMatch = str.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng, label, sourceType: "url_at" };
    }
  }

  // Caso 2: Formato embebido de Google Maps data !3d{lat}!4d{lng} o !8m2!3d...
  const embeddedMatch = str.match(/!3d(-?\d+(?:\.\d+)?)(?:!4d|%214d)(-?\d+(?:\.\d+)?)/i);
  if (embeddedMatch) {
    const lat = parseFloat(embeddedMatch[1]);
    const lng = parseFloat(embeddedMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng, label, sourceType: "url_embedded" };
    }
  }

  // Caso 3: Parámetros de consulta ?q=lat,lng o ?query=lat,lng o ?ll=lat,lng o ?daddr=lat,lng
  // Soportando opcional prefijo loc: e.g. ?q=loc:10.2135,-68.0062
  const queryMatch = str.match(/[?&](?:q|query|ll|daddr|destination)=(?:loc:)?(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/i);
  if (queryMatch) {
    const lat = parseFloat(queryMatch[1]);
    const lng = parseFloat(queryMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng, label, sourceType: "url_query" };
    }
  }

  // Caso 4: Path con coordenadas directas: /maps/search/lat,lng o /maps/dir//lat,lng o /maps/place/lat,lng
  const pathCoordsMatch = str.match(/\/maps\/(?:search|dir|place)\/(?:.*\/)?(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/i);
  if (pathCoordsMatch) {
    const lat = parseFloat(pathCoordsMatch[1]);
    const lng = parseFloat(pathCoordsMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng, label, sourceType: "url_query" };
    }
  }

  // Caso 5: Coordenadas brutas "10.2135, -68.0062" en cualquier parte del texto
  const rawCoordsMatch = str.match(/(?:^|[^\d.-])(-?\d{1,2}(?:\.\d{3,}))[,\s]+(-?\d{1,3}(?:\.\d{3,}))(?:[^\d.-]|$)/);
  if (rawCoordsMatch) {
    const lat = parseFloat(rawCoordsMatch[1]);
    const lng = parseFloat(rawCoordsMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng, label, sourceType: "raw_coords" };
    }
  }

  return null;
}
