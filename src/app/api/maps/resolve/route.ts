import { NextRequest, NextResponse } from "next/server";
import { parseGoogleMapsInput } from "@/lib/maps";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { ok: false, error: "Se requiere un enlace o texto válido de Google Maps" },
        { status: 400 }
      );
    }

    // Extraer URL si viene acompañada de texto compartido por WhatsApp o similar
    const urlMatch = url.match(/(https?:\/\/[^\s]+)/i);
    const targetUrl = urlMatch ? urlMatch[1] : url.trim();

    // 1. Intento de parseo directo (URLs completas con @lat,lng, query params, !3d!4d o coordenadas)
    const directParsed = parseGoogleMapsInput(targetUrl);
    if (directParsed) {
      return NextResponse.json({
        ok: true,
        lat: directParsed.lat,
        lng: directParsed.lng,
        placeName: directParsed.label,
        resolvedUrl: targetUrl,
        sourceType: directParsed.sourceType,
      });
    }

    // 2. Si es un link acortado o URL web, resolvemos la redirección completa
    if (targetUrl.startsWith("http://") || targetUrl.startsWith("https://")) {
      try {
        let finalUrl = targetUrl;

        // Usar GET con follow para seguir automáticamente la cadena de redirección de Google Maps
        const getRes = await fetch(targetUrl, {
          method: "GET",
          redirect: "follow",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "es-419,es;q=0.9,en;q=0.8",
          },
        });

        if (getRes.url && getRes.url !== targetUrl) {
          finalUrl = getRes.url;
        }

        let expandedParsed = parseGoogleMapsInput(finalUrl);

        // Si la URL redirigida no tiene coordenadas en la barra de direcciones, inspeccionar el HTML
        if (!expandedParsed) {
          const html = await getRes.text();
          expandedParsed = parseGoogleMapsInput(html);
        }

        if (expandedParsed) {
          return NextResponse.json({
            ok: true,
            lat: expandedParsed.lat,
            lng: expandedParsed.lng,
            placeName: expandedParsed.label,
            resolvedUrl: finalUrl,
            sourceType: "expanded_shortlink",
          });
        }
      } catch (fetchErr) {
        console.warn("No se pudo expandir shortlink automáticamente:", fetchErr);
      }
    }

    return NextResponse.json(
      {
        ok: false,
        error:
          "No se pudieron extraer las coordenadas de este enlace. Por favor verifica que sea un link de Google Maps válido o ingresa coordenadas en formato lat, lng.",
      },
      { status: 422 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Error al procesar el enlace de Google Maps", details: error.message },
      { status: 500 }
    );
  }
}
