"use client";

import React, { useRef, useEffect, useState } from "react";
import { APIProvider, useMapsLibrary } from "@vis.gl/react-google-maps";
import { MapPin, Search, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export interface SelectedPlace {
  address: string;
  lat: number;
  lng: number;
  mapUrl: string;
}

interface GooglePlacesInputProps {
  value: string;
  onChange: (val: string) => void;
  onPlaceSelected: (place: SelectedPlace) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Componente interno que inicializa google.maps.places.Autocomplete
 * cuando la librería está cargada dentro de APIProvider
 */
function AutocompleteInner({
  value,
  onChange,
  onPlaceSelected,
  placeholder,
  className,
}: GooglePlacesInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const places = useMapsLibrary("places");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!places || !inputRef.current) return;

    // Bounds de Valencia, Naguanagua y San Diego (Gran Valencia, Carabobo)
    const granValenciaBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(10.13, -68.065), // Suroeste (Valencia)
      new google.maps.LatLng(10.305, -67.88) // Noreste (San Diego / Bárbula)
    );

    const options: google.maps.places.AutocompleteOptions = {
      bounds: granValenciaBounds,
      strictBounds: false, // sesgo prioritario en Valencia, Naguanagua y San Diego
      componentRestrictions: { country: "ve" },
      fields: ["formatted_address", "geometry", "name", "url", "place_id"],
    };

    const autocomplete = new places.Autocomplete(inputRef.current, options);
    setIsReady(true);

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry?.location) return;

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const address = place.formatted_address || place.name || "";
      const mapUrl =
        place.url ||
        `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

      onChange(address);
      onPlaceSelected({
        address,
        lat,
        lng,
        mapUrl,
      });
    });

    return () => {
      google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [places, onChange, onPlaceSelected]);

  return (
    <div className="space-y-1 relative">
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-semibold text-slate-300">
          Buscar Dirección / Lugar en Google Maps
        </label>
        <Badge variant="success" pulse className="text-[10px] py-0 px-2">
          Places API Activo
        </Badge>
      </div>

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Escribe para autocompletar (ej: Sambil, El Viñedo, CC Cristal)..."}
          className={`w-full bg-slate-900/90 border border-white/15 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-white placeholder:text-slate-500 rounded-xl px-3.5 py-2.5 pl-9 text-xs transition-all shadow-inner outline-none ${className}`}
        />
        <Search className="w-4 h-4 text-emerald-400 absolute left-3 top-3 pointer-events-none" />
      </div>
    </div>
  );
}

/**
 * Componente principal con Fallback inteligente si no hay API Key configurada
 */
export function GooglePlacesInput(props: GooglePlacesInputProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

  // Si no hay API Key de Google Maps configurada en .env, renderizar fallback elegante
  if (!apiKey) {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="block text-[11px] font-semibold text-slate-300">
            Dirección / Lugar de Entrega
          </label>
          <Badge variant="outline" className="text-[10px] text-slate-400 py-0 px-2">
            Modo Local (Sin API Key)
          </Badge>
        </div>

        <Input
          type="text"
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          placeholder={props.placeholder || "Ingresa la dirección o usa un atajo rápido..."}
          icon={<MapPin className="w-3.5 h-3.5 text-slate-400" />}
          className={props.className}
        />
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey} libraries={["places"]}>
      <AutocompleteInner {...props} />
    </APIProvider>
  );
}
