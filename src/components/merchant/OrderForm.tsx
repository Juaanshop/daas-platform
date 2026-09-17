"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  MapPin,
  Clock,
  Compass,
  DollarSign,
  AlertCircle,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  Link as LinkIcon,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { PricingService, PricingQuote } from "@/services/pricing";
import { parseGoogleMapsInput, getGoogleMapsSearchUrl } from "@/lib/maps";
import { GooglePlacesInput, SelectedPlace } from "./GooglePlacesInput";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Merchant {
  id: string;
  businessName: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  balance: number;
}

interface OrderFormProps {
  merchants: Merchant[];
  selectedMerchantId: string;
  onMerchantChange: (id: string) => void;
  onOrderCreated: () => void;
}

const PRESET_DESTINATIONS = [
  {
    name: "Torre Banaven (El Rico Ricon)",
    address: "Torre Banaven, PB, Av. Bolívar Norte c/c Calle 137, Valencia",
    url: "https://maps.app.goo.gl/gVzVd3u28uZvADrP6",
    lat: 10.2035672,
    lng: -68.0071639,
  },
  {
    name: "C.C. Sambil Mañongo",
    address: "C.C. Sambil Valencia, Entrada Las 4 Avenidas, Mañongo, Naguanagua",
    url: "https://www.google.com/maps/place/Sambil+Valencia/@10.2450,-68.0010,16z",
    lat: 10.245,
    lng: -68.001,
  },
  {
    name: "El Viñedo (Calle de los Cafés)",
    address: "Calle 139 c/c Av. Monseñor Adams, El Viñedo, Valencia",
    url: "https://maps.google.com/?q=10.2135,-68.0062",
    lat: 10.2135,
    lng: -68.0062,
  },
  {
    name: "C.C. La Granja / Naguanagua",
    address: "Av. Universidad c/c Av. Salvador Feo La Cruz, Naguanagua",
    url: "https://maps.google.com/?q=10.2485,-68.0105",
    lat: 10.2485,
    lng: -68.0105,
  },
  {
    name: "C.C. Fin de Siglo / San Diego",
    address: "Av. Don Julio Centeno, C.C. Fin de Siglo, San Diego",
    url: "https://maps.google.com/?q=10.2520,-67.9540",
    lat: 10.2520,
    lng: -67.9540,
  },
  {
    name: "El Remanso / San Diego",
    address: "Urb. El Remanso, Av. 1, San Diego",
    url: "https://maps.google.com/?q=10.2650,-67.9480",
    lat: 10.2650,
    lng: -67.9480,
  },
];

const PRESET_PACKAGES = [
  "2x Burger Criolla Doble + Papas Rústicas (Caja Térmica)",
  "1x Pizza Napolitana Familiar + Refresco 1.5L (Horizontal)",
  "1x Sushi Roll Box 30 piezas (Contiene hielo seco)",
  "12x Tequeños Gourmet con Salsa Tártara de la Casa",
];

export function OrderForm({
  merchants,
  selectedMerchantId,
  onMerchantChange,
  onOrderCreated,
}: OrderFormProps) {
  const currentMerchant = useMemo(
    () => merchants.find((m) => m.id === selectedMerchantId) || merchants[0],
    [merchants, selectedMerchantId]
  );

  const [googleMapsUrlInput, setGoogleMapsUrlInput] = useState<string>(
    PRESET_DESTINATIONS[0].url
  );
  const [dropoffAddress, setDropoffAddress] = useState<string>(
    PRESET_DESTINATIONS[0].address
  );
  const [parsedCoords, setParsedCoords] = useState<{
    lat: number;
    lng: number;
  } | null>({
    lat: PRESET_DESTINATIONS[0].lat,
    lng: PRESET_DESTINATIONS[0].lng,
  });

  const [recipientName, setRecipientName] = useState("Esteban Benítez");
  const [recipientPhone, setRecipientPhone] = useState("+58 412 998-1122");
  const [packageNotes, setPackageNotes] = useState(PRESET_PACKAGES[0]);
  const [customBaseFee, setCustomBaseFee] = useState<number>(2.0);

  const [isResolvingUrl, setIsResolvingUrl] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Parsea automáticamente el link de Google Maps cuando el comercio escribe o pega
  const handleUrlChange = async (val: string) => {
    setGoogleMapsUrlInput(val);
    setMessage(null);

    if (!val.trim()) {
      setParsedCoords(null);
      return;
    }

    // 1. Intento de parseo directo síncrono (@lat,lng, ?q=, coordenadas brutas)
    const direct = parseGoogleMapsInput(val);
    if (direct) {
      setParsedCoords({ lat: direct.lat, lng: direct.lng });
      return;
    }

    // 2. Si es un shortlink (goo.gl / maps.app), resolver en backend
    if (val.includes("goo.gl") || val.includes("maps.app")) {
      try {
        setIsResolvingUrl(true);
        const res = await fetch("/api/maps/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: val }),
        });
        const data = await res.json();
        if (data.ok) {
          setParsedCoords({ lat: data.lat, lng: data.lng });
          if (data.canonicalAddress && !dropoffAddress) {
            setDropoffAddress(data.canonicalAddress);
          }
        } else {
          setParsedCoords(null);
        }
      } catch (err) {
        console.error("Error al resolver URL:", err);
      } finally {
        setIsResolvingUrl(false);
      }
    }
  };

  const [asyncQuote, setAsyncQuote] = useState<PricingQuote | null>(null);

  const handleSelectPreset = (preset: (typeof PRESET_DESTINATIONS)[0]) => {
    setGoogleMapsUrlInput(preset.url);
    setDropoffAddress(preset.address);
    setParsedCoords({ lat: preset.lat, lng: preset.lng });
  };

  const handlePlaceSelected = (place: SelectedPlace) => {
    setDropoffAddress(place.address);
    setGoogleMapsUrlInput(place.mapUrl);
    setParsedCoords({ lat: place.lat, lng: place.lng });
  };

  // Cálculo instantáneo síncrono (Haversine)
  const syncQuote: PricingQuote | null = useMemo(() => {
    if (!currentMerchant || !parsedCoords) return null;
    return PricingService.calculateQuote({
      origin: [currentMerchant.latitude, currentMerchant.longitude],
      destination: [parsedCoords.lat, parsedCoords.lng],
      baseFee: customBaseFee,
    });
  }, [currentMerchant, parsedCoords, customBaseFee]);

  // Consulta asíncrona a Google Maps Distance Engine vía /api/quote
  React.useEffect(() => {
    if (!currentMerchant || !parsedCoords) {
      setAsyncQuote(null);
      return;
    }

    let isSubscribed = true;
    fetch("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin: [currentMerchant.latitude, currentMerchant.longitude],
        destination: [parsedCoords.lat, parsedCoords.lng],
        baseFee: customBaseFee,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (isSubscribed && data.ok && data.quote) {
          setAsyncQuote(data.quote);
        }
      })
      .catch((err) => console.error("Error al cotizar async:", err));

    return () => {
      isSubscribed = false;
    };
  }, [currentMerchant, parsedCoords, customBaseFee]);

  // Si existe cotización vial asíncrona de Google Maps, usarla; si no, la síncrona
  const quote = asyncQuote || syncQuote;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMerchant) return;

    if (!parsedCoords) {
      setMessage({
        type: "error",
        text: "Ingresa un enlace válido de Google Maps o coordenadas reconocibles para calcular la ruta exacta.",
      });
      return;
    }

    if (quote && !quote.isCovered) {
      setMessage({
        type: "error",
        text: quote.coverageError || "Punto de despacho fuera de Valencia, Naguanagua y San Diego (Carabobo).",
      });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId: currentMerchant.id,
          pickupAddress: currentMerchant.address,
          pickupLat: currentMerchant.latitude,
          pickupLng: currentMerchant.longitude,
          dropoffAddress,
          dropoffLat: parsedCoords.lat,
          dropoffLng: parsedCoords.lng,
          dropoffMapUrl: googleMapsUrlInput,
          baseFee: customBaseFee,
          recipientName,
          recipientPhone,
          packageNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo despachar el pedido");
      }

      setMessage({
        type: "success",
        text: `¡Pedido ${data.order.orderNumber} despachado! Cotización: $${data.order.totalCost} (${data.order.distanceKm} km).`,
      });
      onOrderCreated();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentMerchant) {
    return (
      <div className="surface-card p-8 rounded-2xl text-center text-slate-400">
        <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Cargando comercios disponibles...
      </div>
    );
  }

  return (
    <div className="surface-card rounded-3xl p-6 sm:p-7 border border-white/10 shadow-2xl relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header del Formulario */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-white/[0.08] pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
            Nueva Solicitud de Despacho
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cotización instantánea por distancia ortodrómica y enlace Google Maps.
          </p>
        </div>

        {/* Selector de Comercio */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-300">
            Comercio:
          </label>
          <select
            id="merchant-select"
            value={currentMerchant.id}
            onChange={(e) => onMerchantChange(e.target.value)}
            className="bg-slate-900 border border-white/15 text-white text-xs font-semibold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-emerald-400 focus:outline-none cursor-pointer"
          >
            {merchants.map((m) => (
              <option key={m.id} value={m.id}>
                {m.businessName} ({m.address.includes("Naguanagua") ? "Naguanagua" : "Valencia"})
              </option>
            ))}
          </select>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Origen y Destino Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Origen (Fijo del comercio) */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <MapPin className="w-3.5 h-3.5" /> Punto de Retiro (Sede)
              </span>
              <a
                href={getGoogleMapsSearchUrl(
                  currentMerchant.latitude,
                  currentMerchant.longitude,
                  currentMerchant.address
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                title="Ver sede en Google Maps"
              >
                <span>Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="text-sm font-bold text-slate-100">
              {currentMerchant.businessName}
            </div>
            <div className="text-xs text-slate-400 leading-relaxed">{currentMerchant.address}</div>
            <div className="text-[11px] text-slate-500 font-mono">
              Coords: [{currentMerchant.latitude.toFixed(4)},{" "}
              {currentMerchant.longitude.toFixed(4)}]
            </div>
          </div>

          {/* Destino de Entrega con Enlace de Google Maps */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs font-medium text-slate-300">
              <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                <Compass className="w-3.5 h-3.5" /> Destino de Entrega (GPS)
              </span>

              {parsedCoords && (
                <a
                  href={getGoogleMapsSearchUrl(parsedCoords.lat, parsedCoords.lng, dropoffAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 transition-colors"
                  title="Ver destino en Google Maps"
                >
                  <MapPin className="w-3 h-3" />
                  <span>Ver en Maps</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>

            {/* Autocompletado de Lugares con Google Places API */}
            <GooglePlacesInput
              value={dropoffAddress}
              onChange={(val) => setDropoffAddress(val)}
              onPlaceSelected={handlePlaceSelected}
              placeholder="Ej: C.C. Sambil, Torre Banaven, El Viñedo, La Granja..."
            />

            {/* Input de Google Maps Link o Coordenadas */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-300">
                Link de Google Maps o Coordenadas <span className="text-cyan-400 font-bold">*</span>
              </label>
              <Input
                id="dropoff-map-url-input"
                type="text"
                required
                value={googleMapsUrlInput}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="Pega link de Google Maps (ej: https://maps.app.goo.gl/...)"
                icon={<LinkIcon className="w-3.5 h-3.5 text-cyan-400" />}
                className="font-mono text-xs"
              />

              {/* Estado de resolución y detección de coordenadas */}
              <AnimatePresence mode="wait">
                {isResolvingUrl && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 text-[11px] text-cyan-300 pt-0.5"
                  >
                    <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                    <span>Resolviendo enlace de Google Maps y extrayendo coordenadas...</span>
                  </motion.div>
                )}

                {parsedCoords && !isResolvingUrl && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap items-center gap-2 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-1 rounded-xl"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="font-semibold">
                      GPS: [{parsedCoords.lat.toFixed(5)}, {parsedCoords.lng.toFixed(5)}]
                    </span>
                    {quote?.destinationZone && (
                      <Badge variant="success" className="text-[10px] py-0 px-2">
                        {quote.destinationZone}
                      </Badge>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Presets rápidos de destino con Google Maps */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] text-slate-400 font-medium block">
                Atajos demo rápidos:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {PRESET_DESTINATIONS.map((preset) => (
                  <motion.button
                    key={preset.name}
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleSelectPreset(preset)}
                    className={`text-[11px] px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                      googleMapsUrlInput === preset.url
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold shadow-sm shadow-cyan-500/10"
                        : "bg-slate-900 text-slate-400 border-white/5 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    {preset.name}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Destinatario y Paquete */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">
              Nombre del Destinatario
            </label>
            <Input
              id="recipient-name-input"
              type="text"
              required
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Ej: Carlos Gómez"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">
              Teléfono de Contacto (Venezuela)
            </label>
            <Input
              id="recipient-phone-input"
              type="text"
              required
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="+58 412 / 414 / 424..."
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300">
              Detalle del Paquete / Instrucciones
            </label>
            <div className="flex gap-1.5">
              {PRESET_PACKAGES.map((pkg, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPackageNotes(pkg)}
                  className="text-[10px] text-slate-400 hover:text-emerald-400 underline decoration-dotted cursor-pointer"
                >
                  Combo #{idx + 1}
                </button>
              ))}
            </div>
          </div>
          <Textarea
            id="package-notes-input"
            rows={2}
            value={packageNotes}
            onChange={(e) => setPackageNotes(e.target.value)}
            placeholder="Ej: 2 pizzas en caja térmica, no inclinar. Dejar en vigilancia."
          />
        </div>

        {/* Configuración de Tarifa Base Variable */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Tarifa Base Variable (Mínimo $2.00 en adelante)
              </label>
              <span className="text-[11px] text-slate-400 block">
                Cubre los primeros 2.0 km de recorrido.
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-white/10">
              <span className="text-xs font-bold text-slate-400">$</span>
              <input
                id="custom-base-fee-input"
                type="number"
                min="2.0"
                step="0.25"
                value={customBaseFee}
                onChange={(e) =>
                  setCustomBaseFee(
                    Math.max(2.0, parseFloat(e.target.value) || 2.0)
                  )
                }
                className="w-16 bg-transparent text-sm font-black text-emerald-300 focus:outline-none text-right tabular-nums"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "$2.00 (Mínimo / Local)", val: 2.0 },
              { label: "$2.50 (Intermunicipal)", val: 2.5 },
              { label: "$3.00 (Prioritario)", val: 3.0 },
              { label: "$3.50 (Express / Alta Demanda)", val: 3.5 },
            ].map((tier) => (
              <motion.button
                key={tier.val}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => setCustomBaseFee(tier.val)}
                className={`px-3 py-1 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  customBaseFee === tier.val
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold shadow-sm shadow-emerald-500/10"
                    : "bg-slate-900/60 text-slate-400 border-white/5 hover:text-white hover:bg-slate-800"
                }`}
              >
                {tier.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Pricing Engine Instant Preview Widget con Animación */}
        {quote && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-2xl p-4 border shadow-inner transition-colors ${
              quote.isCovered
                ? "bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-emerald-950/20 border-emerald-500/25"
                : "bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-rose-950/20 border-rose-500/30"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Cotización en Tiempo Real
                </span>
                {quote.distanceProvider === "google_maps" ? (
                  <Badge variant="info" pulse className="text-[10px] py-0 px-2">
                    Ruta Vial Google Maps
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-slate-400 py-0 px-2">
                    Estimación Haversine
                  </Badge>
                )}
              </div>
              <span className="text-[11px] text-slate-400">
                Tarifa base (${quote.baseFee.toFixed(2)}) + $0.50/km extra
              </span>
            </div>

            {quote.isCovered ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-950/50 border border-white/5">
                  <div className="text-[11px] text-slate-400">Distancia</div>
                  <div className="text-base font-bold text-white tabular-nums">
                    {quote.distanceKm} km
                  </div>
                  <div
                    className="text-[10px] text-slate-500 truncate max-w-[95px] mx-auto mt-0.5"
                    title={quote.providerStatusText}
                  >
                    {quote.distanceProvider === "google_maps" ? "Ruta vial" : "Línea recta"}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/50 border border-white/5">
                  <div className="text-[11px] text-slate-400">Tarifa Base</div>
                  <div className="text-base font-bold text-emerald-400 tabular-nums">
                    ${quote.baseFee.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {quote.isIntermunicipal ? "Intermunicipal" : "Base (2 km)"}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/50 border border-white/5">
                  <div className="text-[11px] text-slate-400">Km Extra</div>
                  <div className="text-base font-bold text-sky-300 tabular-nums">
                    +${quote.extraKmFee.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    ~{quote.estimatedMinutes} min
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
                  <div className="text-[11px] font-bold text-emerald-400">
                    Total Final
                  </div>
                  <div className="text-xl font-black text-emerald-300 tabular-nums">
                    ${quote.totalCost.toFixed(2)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{quote.coverageError || "Dirección fuera del área autorizada de Valencia, Naguanagua y San Diego."}</span>
              </div>
            )}
          </motion.div>
        )}

        {/* Status Message */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className={`p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2 ${
                message.type === "success"
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
              }`}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{message.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <Button
          id="btn-dispatch-order"
          type="submit"
          variant="primary"
          size="lg"
          disabled={isSubmitting || !quote || !quote.isCovered}
          isLoading={isSubmitting}
          className="w-full"
        >
          {!quote?.isCovered && quote ? (
            <>
              <AlertTriangle className="w-4 h-4" />
              Fuera de Cobertura (Valencia / Naguanagua)
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Solicitar Repartidor Ahora • ${quote?.totalCost.toFixed(2) || "0.00"}
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
