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

    const trimmed = url.trim();

    // 1. Intento de parseo directo (URLs completas con @lat,lng, query params o coordenadas directas)
    const directParsed = parseGoogleMapsInput(trimmed);
    if (directParsed) {
      return NextResponse.json({
        ok: true,
        lat: directParsed.lat,
        lng: directParsed.lng,
        resolvedUrl: trimmed,
        sourceType: directParsed.sourceType,
      });
    }

    // 2. Si es un link acortado (ej. maps.app.goo.gl o goo.gl/maps), resolvemos la redirección HTTP
    if (trimmed.includes("goo.gl") || trimmed.includes("maps.app")) {
      try {
        const headRes = await fetch(trimmed, {
          method: "HEAD",
          redirect: "follow",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });

        const finalUrl = headRes.url;
        const expandedParsed = parseGoogleMapsInput(finalUrl);

        if (expandedParsed) {
          return NextResponse.json({
            ok: true,
            lat: expandedParsed.lat,
            lng: expandedParsed.lng,
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
