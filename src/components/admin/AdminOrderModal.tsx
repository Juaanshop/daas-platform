"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  MapPin,
  Compass,
  Link as LinkIcon,
  Sparkles,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Store,
  Bike,
  DollarSign,
  Navigation,
} from "lucide-react";
import { PricingService, PricingQuote } from "@/services/pricing";
import { parseGoogleMapsInput, getGoogleMapsSearchUrl } from "@/lib/maps";

interface Merchant {
  id: string;
  businessName: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
}

interface Rider {
  id: string;
  phone: string;
  vehiclePlate: string;
  status: string;
  user: {
    name: string;
  };
}

interface AdminOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchants: Merchant[];
  riders: Rider[];
  onOrderCreated: () => void;
}

// Enlaces de prueba rápidos de Google Maps en Valencia, Naguanagua y San Diego
const GOOGLE_MAPS_PRESETS = [
  {
    name: "Torre Banaven (Valencia)",
    address: "Torre Banaven, PB, Av. Bolívar Norte c/c Calle 137, Valencia",
    url: "https://maps.app.goo.gl/gVzVd3u28uZvADrP6",
    lat: 10.2035672,
    lng: -68.0071639,
  },
  {
    name: "C.C. Sambil (Naguanagua)",
    address: "C.C. Sambil Valencia, Mañongo",
    url: "https://www.google.com/maps/place/Sambil+Valencia/@10.2450,-68.0010,16z",
    lat: 10.245,
    lng: -68.001,
  },
  {
    name: "El Viñedo (Valencia)",
    address: "Av. Monseñor Adams, El Viñedo",
    url: "https://maps.google.com/?q=10.2135,-68.0062",
    lat: 10.2135,
    lng: -68.0062,
  },
  {
    name: "C.C. La Granja (Naguanagua)",
    address: "Av. Universidad, C.C. La Granja, Naguanagua",
    url: "https://maps.google.com/?q=10.2485,-68.0105",
    lat: 10.2485,
    lng: -68.0105,
  },
  {
    name: "C.C. Fin de Siglo (San Diego)",
    address: "C.C. Fin de Siglo, Av. Don Julio Centeno, San Diego",
    url: "https://maps.google.com/?q=10.2520,-67.9540",
    lat: 10.252,
    lng: -67.954,
  },
  {
    name: "El Remanso (San Diego)",
    address: "Urb. El Remanso, Los Jarales, San Diego",
    url: "https://maps.google.com/?q=10.2650,-67.9480",
    lat: 10.265,
    lng: -67.948,
  },
];

export function AdminOrderModal({
  isOpen,
  onClose,
  merchants,
  riders,
  onOrderCreated,
}: AdminOrderModalProps) {
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>("");
  const [googleMapsUrlInput, setGoogleMapsUrlInput] = useState<string>(
    GOOGLE_MAPS_PRESETS[0].url
  );
  const [dropoffAddress, setDropoffAddress] = useState<string>(
    GOOGLE_MAPS_PRESETS[0].address
  );
  const [parsedCoords, setParsedCoords] = useState<{
    lat: number;
    lng: number;
  } | null>({
    lat: GOOGLE_MAPS_PRESETS[0].lat,
    lng: GOOGLE_MAPS_PRESETS[0].lng,
  });

  const [recipientName, setRecipientName] = useState<string>("Gabriel Mendoza");
  const [recipientPhone, setRecipientPhone] = useState<string>("+58 414 776-8899");
  const [packageNotes, setPackageNotes] = useState<string>(
    "2x Combos Familiares + Bebida. Entregar en vigilancia."
  );
  const [assignRiderId, setAssignRiderId] = useState<string>("");
  const [customBaseFee, setCustomBaseFee] = useState<number>(2.0);

  const [isResolvingUrl, setIsResolvingUrl] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (merchants.length > 0 && !selectedMerchantId) {
      setSelectedMerchantId(merchants[0].id);
    }
  }, [merchants, selectedMerchantId]);

  // Comercio emisor actual
  const currentMerchant = useMemo(() => {
    return merchants.find((m) => m.id === selectedMerchantId) || merchants[0];
  }, [merchants, selectedMerchantId]);

  // Repartidores disponibles
  const availableRiders = useMemo(() => {
    return riders.filter((r) => r.status === "IDLE");
  }, [riders]);

  // Resolver link de Google Maps cuando el usuario escribe o pega
  const handleUrlChange = async (url: string) => {
    setGoogleMapsUrlInput(url);
    setErrorMessage(null);

    if (!url.trim()) {
      setParsedCoords(null);
      return;
    }

    // 1. Intentar parseo síncrono local
    const localParsed = parseGoogleMapsInput(url);
    if (localParsed) {
      setParsedCoords({ lat: localParsed.lat, lng: localParsed.lng });
      return;
    }

    // 2. Si es una URL acortada (maps.app.goo.gl o goo.gl), resolver vía backend
    if (url.includes("maps.app.goo.gl") || url.includes("goo.gl")) {
      setIsResolvingUrl(true);
      try {
        const res = await fetch("/api/maps/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const data = await res.json();
        if (data.ok && data.coords) {
          setParsedCoords(data.coords);
        } else {
          setParsedCoords(null);
          setErrorMessage(
            "No se pudieron extraer coordenadas exactas del link. Verifica la URL o usa un preset."
          );
        }
      } catch (err) {
        setParsedCoords(null);
        setErrorMessage("Error de conexión al resolver el link de Google Maps.");
      } finally {
        setIsResolvingUrl(false);
      }
    } else {
      setParsedCoords(null);
    }
  };

  // Preset demo rápido
  const handleSelectPreset = (preset: (typeof GOOGLE_MAPS_PRESETS)[0]) => {
    setGoogleMapsUrlInput(preset.url);
    setDropoffAddress(preset.address);
    setParsedCoords({ lat: preset.lat, lng: preset.lng });
    setErrorMessage(null);
  };

  // Cálculo síncrono de cotización instantánea
  const quote: PricingQuote | null = useMemo(() => {
    if (!currentMerchant || !parsedCoords) return null;
    return PricingService.calculateQuote({
      origin: [currentMerchant.latitude, currentMerchant.longitude],
      destination: [parsedCoords.lat, parsedCoords.lng],
      baseFee: customBaseFee,
    });
  }, [currentMerchant, parsedCoords, customBaseFee]);

  // Enviar orden
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentMerchant) {
      setErrorMessage("Por favor selecciona un comercio de origen");
      return;
    }

    if (!parsedCoords) {
      setErrorMessage(
        "Debes ingresar un link válido de Google Maps que contenga coordenadas"
      );
      return;
    }

    if (quote && !quote.isCovered) {
      setErrorMessage(
        quote.coverageError ||
          "La ubicación seleccionada está fuera del rango de cobertura en Valencia, Naguanagua y San Diego"
      );
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. Crear Orden en DB
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId: currentMerchant.id,
          dropoffAddress,
          dropoffLat: parsedCoords.lat,
          dropoffLng: parsedCoords.lng,
          dropoffMapUrl: googleMapsUrlInput,
          recipientName,
          recipientPhone,
          packageNotes,
          customBaseFee,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo crear la solicitud");
      }

      // 2. Si el admin seleccionó un repartidor de inmediato, asignarlo
      if (assignRiderId && data.order?.id) {
        await fetch(`/api/orders/${data.order.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "ASSIGNED",
            riderId: assignRiderId,
          }),
        });
      }

      onOrderCreated();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-hidden animate-in fade-in">
      {/* Backdrop para cerrar al hacer clic afuera */}
      <div 
        className="fixed inset-0 bg-transparent" 
        onClick={onClose} 
      />

      {/* Contenedor Principal del Modal con scroll interno y límites estrictos */}
      <div 
        className="relative w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-white/15 shadow-2xl shadow-cyan-500/10 overflow-hidden z-10 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ENCABEZADO FIJO (Sticky en la parte superior) */}
        <div className="p-5 sm:p-6 pb-4 border-b border-white/10 flex items-start justify-between gap-3 flex-shrink-0 bg-slate-900/95 backdrop-blur-md">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 mb-2">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              Despacho Centralizado (Admin)
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Crear Solicitud con Link de Google Maps
            </h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Ingresa directamente el enlace de Google Maps del destino del cliente para geolocalización instantánea y cotización automática.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors flex-shrink-0 cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CUERPO DEL FORMULARIO CON SCROLL SUAVE */}
        <form 
          id="admin-order-form" 
          onSubmit={handleSubmit} 
          className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5"
        >
          {/* Selector de Comercio Emisor */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-1.5 shadow-inner">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Store className="w-4 h-4 text-emerald-400" />
                Comercio Emisor (Punto de Retiro):
              </label>
              <span className="text-[11px] text-emerald-400 font-mono">
                {currentMerchant
                  ? `[${currentMerchant.latitude.toFixed(4)}, ${currentMerchant.longitude.toFixed(4)}]`
                  : ""}
              </span>
            </div>

            <select
              value={selectedMerchantId}
              onChange={(e) => setSelectedMerchantId(e.target.value)}
              className="w-full bg-slate-900 border border-white/15 text-white text-xs font-medium rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-400 focus:outline-none cursor-pointer"
            >
              {merchants.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.businessName} — {m.address}
                </option>
              ))}
            </select>
          </div>

          {/* Campo Mandatorio: Enlace de Google Maps del Destino */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-cyan-500/30 shadow-lg shadow-cyan-500/5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-extrabold text-cyan-400 flex items-center gap-1.5">
                <LinkIcon className="w-4 h-4 text-cyan-400" />
                Link de Google Maps del Destino:
              </label>

              {parsedCoords ? (
                <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Coords: [{parsedCoords.lat.toFixed(4)}, {parsedCoords.lng.toFixed(4)}]
                </span>
              ) : isResolvingUrl ? (
                <span className="text-[11px] font-bold text-amber-400 animate-pulse">
                  Resolviendo link...
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">
                  Pega la URL de Google Maps
                </span>
              )}
            </div>

            <div>
              <input
                id="admin-google-maps-url-input"
                type="text"
                required
                value={googleMapsUrlInput}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://maps.app.goo.gl/... o https://maps.google.com/?q=lat,lng"
                className="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-400 focus:outline-none font-mono"
              />
            </div>

            {/* Presets rápidos */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 font-semibold">
                Enlaces demo rápidos:
              </span>
              {GOOGLE_MAPS_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`text-[10px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    googleMapsUrlInput === preset.url
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold"
                      : "bg-slate-900 text-slate-400 border-white/5 hover:text-white"
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>

            {/* Dirección / Referencia del Destino */}
            <div className="pt-2 border-t border-white/5">
              <label className="text-[11px] font-semibold text-slate-300 mb-1 block">
                Nombre de la Dirección o Referencia:
              </label>
              <input
                type="text"
                required
                value={dropoffAddress}
                onChange={(e) => setDropoffAddress(e.target.value)}
                placeholder="Ej: Av. Bolívar Norte c/c Calle 137 / Urb. El Parral"
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:ring-2 focus:ring-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Destinatario y Teléfono */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nombre del Destinatario
              </label>
              <input
                type="text"
                required
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Teléfono del Cliente
              </label>
              <input
                type="text"
                required
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Notas del Pedido */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Notas del Pedido / Instrucciones para el Repartidor
            </label>
            <input
              type="text"
              value={packageNotes}
              onChange={(e) => setPackageNotes(e.target.value)}
              placeholder="Ej: Manejar con cuidado horizontal, avisar en vigilancia"
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-indigo-400 focus:outline-none"
            />
          </div>

          {/* Tarifa Base Variable */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2.5 shadow-inner">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  Tarifa Base Variable (Mínimo $2.00 en adelante)
                </label>
                <span className="text-[11px] text-slate-400 block">
                  Cubre los primeros 2 km en Valencia, Naguanagua y San Diego.
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-white/15">
                <span className="text-xs font-bold text-slate-400">$</span>
                <input
                  type="number"
                  min="2.0"
                  step="0.25"
                  value={customBaseFee}
                  onChange={(e) =>
                    setCustomBaseFee(
                      Math.max(2.0, parseFloat(e.target.value) || 2.0)
                    )
                  }
                  className="w-16 bg-transparent text-sm font-black text-emerald-300 focus:outline-none text-right font-mono"
                />
              </div>
            </div>

            {/* Presets rápidos de tarifa base */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "$2.00 (Mínimo Local)", val: 2.0 },
                { label: "$2.50 (Intermunicipal)", val: 2.5 },
                { label: "$3.00 (Prioritario)", val: 3.0 },
                { label: "$3.50 (Express / Lluvia)", val: 3.5 },
                { label: "$4.00 (Nocturno)", val: 4.0 },
              ].map((tier) => (
                <button
                  key={tier.val}
                  type="button"
                  onClick={() => setCustomBaseFee(tier.val)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                    customBaseFee === tier.val
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold shadow-sm"
                      : "bg-slate-900 text-slate-400 border-white/5 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </div>

          {/* Asignación Opcional de Rider Inmediata */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
            <div>
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Bike className="w-3.5 h-3.5 text-sky-400" />
                Asignación Inmediata de Repartidor:
              </span>
              <span className="text-[11px] text-slate-400 block">
                Opcional. Si lo dejas libre, la orden quedará como Pendiente en la torre de control.
              </span>
            </div>

            <select
              value={assignRiderId}
              onChange={(e) => setAssignRiderId(e.target.value)}
              className="bg-slate-900 border border-white/15 text-white text-xs font-medium rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-400 focus:outline-none sm:max-w-[220px] cursor-pointer"
            >
              <option value="">Dejar Pendiente (Asignar luego)</option>
              {availableRiders.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.user.name} ({r.vehiclePlate})
                </option>
              ))}
            </select>
          </div>

          {/* Resumen de Cotización Instantánea */}
          {quote && (
            <div className="rounded-2xl p-4 bg-slate-950/90 border border-emerald-500/30 shadow-inner grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-white/5">
                <span className="text-[10px] text-slate-400 block font-semibold">Distancia</span>
                <span className="font-mono font-bold text-white text-sm">{quote.distanceKm} km</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-white/5">
                <span className="text-[10px] text-slate-400 block font-semibold">Tarifa Base</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">${quote.baseFee.toFixed(2)}</span>
                <span className="text-[9px] text-slate-400 block">
                  {quote.isIntermunicipal ? "Intermunicipal" : "Base 2km"}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-white/5">
                <span className="text-[10px] text-slate-400 block font-semibold">Km Extra (+$0.50)</span>
                <span className="font-mono font-bold text-sky-300 text-sm">
                  +${quote.extraKmFee.toFixed(2)}
                </span>
                <span className="text-[9px] text-slate-400 block">
                  ~{quote.estimatedMinutes} min
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
                <span className="text-[10px] font-bold text-emerald-400 block">Total Cotizado</span>
                <span className="font-mono font-black text-emerald-300 text-base">
                  ${quote.totalCost.toFixed(2)}
                </span>
                <span className="text-[9px] text-emerald-400/80 font-mono block">
                  Rider: ${(quote.totalCost * 0.8).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Mensaje de Error */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </form>

        {/* PIE DE PÁGINA FIJO (Docked Footer con Cotización y Botón de Envío) */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-slate-950/95 backdrop-blur-md flex-shrink-0 flex items-center justify-between gap-4">
          <div className="hidden sm:flex items-center gap-2">
            {quote ? (
              <div className="text-xs">
                <span className="text-slate-400 block font-medium">Cotización Instantánea:</span>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-mono font-black text-base">
                    ${quote.totalCost.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ({quote.distanceKm} km • Ganancia Rider: ${(quote.totalCost * 0.8).toFixed(2)})
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-500">
                Ingresa un enlace de destino para cotizar
              </span>
            )}
          </div>

          <button
            type="submit"
            form="admin-order-form"
            disabled={isSubmitting || !parsedCoords || !quote}
            className="w-full sm:w-auto flex-1 sm:flex-initial min-w-[240px] py-3.5 px-6 rounded-2xl font-bold text-sm text-slate-950 bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:brightness-110 shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>
                  {quote
                    ? `Crear y Despachar Pedido • $${quote.totalCost.toFixed(2)}`
                    : "Crear y Despachar Pedido"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
