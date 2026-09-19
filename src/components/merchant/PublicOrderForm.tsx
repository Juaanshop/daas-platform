"use client";

import { useState, useEffect, useRef } from "react";
import {
  Package,
  MapPin,
  Phone,
  User,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Navigation,
  MessageCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Layers,
  Search,
} from "lucide-react";

interface MerchantData {
  id: string;
  businessName: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  publicToken: string | null;
  deliveryUser?: {
    name: string;
    phone: string;
  } | null;
}

interface QuoteData {
  baseFee: number;
  distanceKm: number;
  totalCost: number;
  estimatedMinutes: number;
  originZone: string;
  destinationZone: string;
  riderEarnings: number;
}

const PHONE_OPERATORS = [
  { prefix: "0414", label: "0414 (Movistar)", badge: "Movistar" },
  { prefix: "0424", label: "0424 (Movistar)", badge: "Movistar" },
  { prefix: "0412", label: "0412 (Digitel)", badge: "Digitel" },
  { prefix: "0416", label: "0416 (Movilnet)", badge: "Movilnet" },
  { prefix: "0426", label: "0426 (Movilnet)", badge: "Movilnet" },
  { prefix: "OTHER", label: "+ Otro", badge: "Internacional" },
];

const COMMON_DESTINATIONS = [
  { name: "C.C. Sambil Mañongo", lat: 10.245, lng: -68.001, address: "C.C. Sambil Valencia, Mañongo, Naguanagua" },
  { name: "El Viñedo", lat: 10.2135, lng: -68.0062, address: "Calle 139, El Viñedo, Valencia" },
  { name: "Tazajal", lat: 10.266, lng: -68.009, address: "Urb. Tazajal, Calle 3, Naguanagua" },
  { name: "C.C. Fin de Siglo", lat: 10.252, lng: -67.954, address: "Av. Don Julio Centeno, San Diego" },
  { name: "La Trigaleña", lat: 10.222, lng: -67.994, address: "Urb. La Trigaleña, Valencia" },
  { name: "La Granja", lat: 10.2485, lng: -68.0105, address: "C.C. La Granja, Naguanagua" },
];

export default function PublicOrderForm({ merchant }: { merchant: MerchantData }) {
  // Wizard step: 1 = Obligatorios, 2 = Opcionales y Confirmar
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // 1. CAMPOS OBLIGATORIOS (Paso 1)
  const [packageDescription, setPackageDescription] = useState("");
  const [recipientName, setRecipientName] = useState("");

  // Teléfono accesible con telefonías de Venezuela
  const [phoneOperator, setPhoneOperator] = useState("0414");
  const [phoneSubscriber, setPhoneSubscriber] = useState("");

  // Destino (Obligatorio)
  const [destinationMode, setDestinationMode] = useState<"paste" | "manual">("paste");
  const [pastedUrl, setPastedUrl] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [dropoffLat, setDropoffLat] = useState<number | null>(null);
  const [dropoffLng, setDropoffLng] = useState<number | null>(null);
  const [resolvedPlaceName, setResolvedPlaceName] = useState<string | null>(null);

  // 2. CAMPOS OPCIONALES (Paso 2)
  const [packageSize, setPackageSize] = useState<"SMALL" | "MEDIUM" | "LARGE">("MEDIUM");
  const [packageNotes, setPackageNotes] = useState("");

  // Parsing & Quote state
  const [resolvingLink, setResolvingLink] = useState(false);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [isCovered, setIsCovered] = useState<boolean | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [calculatingQuote, setCalculatingQuote] = useState(false);

  // Submit & Completion state
  const [submitting, setSubmitting] = useState(false);
  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [orderCreated, setOrderCreated] = useState<{
    orderNumber: string;
    whatsappUrl: string;
    totalCost: number;
    distanceKm: number;
  } | null>(null);

  // Construye el teléfono internacional completo
  const getFullRecipientPhone = () => {
    const digits = phoneSubscriber.replace(/\D/g, "");
    if (phoneOperator === "OTHER") {
      return phoneSubscriber.trim();
    }
    const cleanPrefix = phoneOperator.replace(/^0/, "");
    return `+58 ${cleanPrefix} ${digits}`;
  };

  // Manejador inteligente del input de teléfono (detecta pegado completo o entrada numérica)
  const handlePhoneChange = (val: string) => {
    const raw = val.trim();
    // Si pega un número completo con operadora (ej. 04121234567 o +584148589530)
    const digitsOnly = raw.replace(/\D/g, "");

    for (const op of PHONE_OPERATORS) {
      if (op.prefix === "OTHER") continue;
      const opDigits = op.prefix.replace(/^0/, ""); // "414"

      if (digitsOnly.startsWith(`58${opDigits}`) && digitsOnly.length >= 10) {
        setPhoneOperator(op.prefix);
        setPhoneSubscriber(digitsOnly.slice(2 + opDigits.length, 2 + opDigits.length + 7));
        return;
      }
      if (digitsOnly.startsWith(op.prefix) && digitsOnly.length >= 10) {
        setPhoneOperator(op.prefix);
        setPhoneSubscriber(digitsOnly.slice(op.prefix.length, op.prefix.length + 7));
        return;
      }
    }

    // Entrada normal
    if (phoneOperator === "OTHER") {
      setPhoneSubscriber(val);
    } else {
      const clean = val.replace(/\D/g, "").slice(0, 7);
      setPhoneSubscriber(clean);
    }
  };

  // Limpia enlaces duplicados o pegados en cadena (ej: https://...https://...)
  const cleanPastedUrl = (input: string): string => {
    if (!input) return "";
    const trimmed = input.trim();
    const match = trimmed.match(/(https?:\/\/[^\s]+?)(?=(?:https?:\/\/|\s|$))/i);
    if (match) {
      return match[1];
    }
    return trimmed;
  };

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Parse Google Maps / WhatsApp link con auto-detección robusta
  const handleResolveLink = async (urlToTest?: string, isSilent = false) => {
    const raw = cleanPastedUrl((urlToTest !== undefined ? urlToTest : pastedUrl).trim());
    if (!raw) return;

    // Asegurar que el input muestre la URL limpia sin duplicados
    setPastedUrl(raw);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setResolvingLink(true);
    if (!isSilent) setQuoteError(null);

    try {
      const res = await fetch("/api/maps/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: raw }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudieron extraer coordenadas del enlace.");
      }

      setDropoffLat(data.lat);
      setDropoffLng(data.lng);
      setResolvedPlaceName(data.placeName || null);
      setQuoteError(null);

      if (data.placeName) {
        setDropoffAddress(data.placeName);
      } else if (!dropoffAddress) {
        setDropoffAddress(`Ubicación (${data.lat.toFixed(4)}, ${data.lng.toFixed(4)})`);
      }
    } catch (err: any) {
      if (!isSilent) {
        setQuoteError(err.message || "Error al procesar el enlace de Google Maps");
      }
      setDropoffLat(null);
      setDropoffLng(null);
      setResolvedPlaceName(null);
    } finally {
      setResolvingLink(false);
    }
  };

  const handleUrlInputChange = (val: string) => {
    const cleaned = cleanPastedUrl(val);
    setPastedUrl(cleaned);
    setQuoteError(null);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = cleaned.trim();
    const isMapsCandidate =
      trimmed.includes("goo.gl") ||
      trimmed.includes("maps.app") ||
      trimmed.includes("google.com/maps") ||
      (trimmed.startsWith("http") && trimmed.length >= 18) ||
      /^-?\d+(\.\d+)?[,\s]+-?\d+/.test(trimmed);

    if (isMapsCandidate) {
      debounceTimerRef.current = setTimeout(() => {
        handleResolveLink(trimmed, true);
      }, 400);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          const clean = cleanPastedUrl(text);
          setPastedUrl(clean);
          handleResolveLink(clean, false);
        }
      }
    } catch {
      // Ignorar si el usuario no tiene permisos de portapapeles concedidos
    }
  };

  // Recalcular cotización en tiempo real al cambiar coordenadas
  useEffect(() => {
    if (dropoffLat === null || dropoffLng === null) {
      setQuote(null);
      setIsCovered(null);
      return;
    }

    const fetchQuote = async () => {
      setCalculatingQuote(true);
      setQuoteError(null);

      try {
        const res = await fetch(`/api/m/${merchant.publicToken}/quote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dropoffLat,
            dropoffLng,
            pickupLat: merchant.latitude,
            pickupLng: merchant.longitude,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Error al calcular cotización");
        }

        if (!data.isCovered) {
          setIsCovered(false);
          setQuote(null);
          setQuoteError(data.error || "Ubicación fuera de la zona de cobertura autorizada.");
        } else {
          setIsCovered(true);
          setQuote(data.quote);
        }
      } catch (err: any) {
        setQuoteError(err.message || "Error al cotizar trayecto");
        setIsCovered(false);
        setQuote(null);
      } finally {
        setCalculatingQuote(false);
      }
    };

    fetchQuote();
  }, [dropoffLat, dropoffLng, merchant.latitude, merchant.longitude, merchant.publicToken]);

  const handleSelectPreset = (preset: typeof COMMON_DESTINATIONS[0]) => {
    setDropoffLat(preset.lat);
    setDropoffLng(preset.lng);
    setDropoffAddress(preset.address);
    setResolvedPlaceName(preset.name);
    setQuoteError(null);
  };

  // Validación para avanzar de Paso 1 a Paso 2
  const handleProceedToStep2 = () => {
    setStep1Error(null);

    if (!packageDescription.trim()) {
      setStep1Error("Por favor indica qué vas a enviar.");
      return;
    }
    if (!recipientName.trim()) {
      setStep1Error("Por favor indica el nombre de quien recibe.");
      return;
    }

    const digits = phoneSubscriber.replace(/\D/g, "");
    if (!digits || digits.length < (phoneOperator === "OTHER" ? 7 : 7)) {
      setStep1Error("Por favor ingresa los 7 dígitos del número celular.");
      return;
    }

    if (dropoffLat === null || dropoffLng === null || !dropoffAddress.trim()) {
      setStep1Error("Por favor ingresa el punto de entrega (pega un link de Maps o selecciona una zona).");
      return;
    }
    if (!isCovered || !quote) {
      setStep1Error("El destino seleccionado está fuera de cobertura o no pudo ser cotizado.");
      return;
    }

    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Envío final del pedido
  const handleSubmitOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!dropoffLat || !dropoffLng || !isCovered) {
      setQuoteError("El destino no es válido o está fuera de cobertura.");
      return;
    }

    setSubmitting(true);
    setQuoteError(null);

    try {
      const fullPhone = getFullRecipientPhone();

      const res = await fetch(`/api/m/${merchant.publicToken}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageDescription,
          packageSize,
          recipientName,
          recipientPhone: fullPhone,
          dropoffAddress,
          dropoffLat,
          dropoffLng,
          dropoffMapUrl: pastedUrl || null,
          packageNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo registrar el pedido.");
      }

      setOrderCreated({
        orderNumber: data.order.orderNumber,
        whatsappUrl: data.whatsappUrl,
        totalCost: data.order.totalCost,
        distanceKm: data.order.distanceKm,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setQuoteError(err.message || "Error al enviar la solicitud.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setPackageDescription("");
    setRecipientName("");
    setPhoneSubscriber("");
    setPackageSize("MEDIUM");
    setPackageNotes("");
    setPastedUrl("");
    setDropoffAddress("");
    setDropoffLat(null);
    setDropoffLng(null);
    setResolvedPlaceName(null);
    setQuote(null);
    setIsCovered(null);
    setQuoteError(null);
    setStep1Error(null);
    setCurrentStep(1);
    setOrderCreated(null);
  };

  // VISTA DE ÉXITO CON BOTÓN WHATSAPP
  if (orderCreated) {
    return (
      <div className="bg-[#101010] border border-[#282828] rounded-2xl p-6 text-center space-y-5 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="w-14 h-14 rounded-full bg-[#BBEB42]/10 border border-[#BBEB42]/25 text-[#BBEB42] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <span className="text-[11px] uppercase tracking-wider text-[#BBEB42] font-bold bg-[#BBEB42]/10 px-2.5 py-0.5 rounded-full border border-[#BBEB42]/25">
            ¡Solicitud Registrada!
          </span>
          <h2 className="text-xl font-black text-white mt-2">
            Orden {orderCreated.orderNumber}
          </h2>
          <p className="text-xs text-[#888888] mt-1 max-w-sm mx-auto">
            El pedido ya está en el panel de tu repartidor{" "}
            <strong className="text-white">{merchant.deliveryUser?.name || "Delivery"}</strong>.
          </p>
        </div>

        <div className="bg-[#191919] border border-[#282828] rounded-xl p-3.5 max-w-sm mx-auto text-xs text-[#D1D1D1] space-y-1.5 text-left">
          <div className="flex justify-between">
            <span className="text-[#888888]">Distancia:</span>
            <span className="font-bold text-white font-mono">{orderCreated.distanceKm.toFixed(2)} km</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#888888]">Tarifa de Carrera:</span>
            <span className="font-bold text-[#BBEB42] text-sm font-mono">${orderCreated.totalCost.toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-2.5 max-w-sm mx-auto pt-1">
          <a
            href={orderCreated.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-black font-black py-3.5 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer text-sm active:scale-95"
          >
            <MessageCircle className="w-5 h-5 fill-black" />
            <span>Abrir WhatsApp y Notificar al Repartidor</span>
          </a>

          <p className="text-[10px] text-[#6D6D6D]">
            El repartidor ya puede ver el pedido en su panel aunque no envíes el chat.
          </p>

          <button
            onClick={handleResetForm}
            className="w-full mt-3 bg-[#191919] hover:bg-[#282828] text-[#D1D1D1] font-semibold py-2 px-3 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-[#282828]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Crear otra solicitud</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {/* Stepper Tabs */}
      <div className="grid grid-cols-2 gap-2 bg-[#101010] p-1 rounded-xl border border-[#282828] text-xs">
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold transition-all cursor-pointer ${
            currentStep === 1
              ? "bg-[#BBEB42] text-[#080808] font-black shadow-sm"
              : "text-[#888888] hover:text-white"
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-[#080808]/20 flex items-center justify-center text-[10px]">1</span>
          <span>Obligatorio</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (quote && isCovered && packageDescription.trim() && recipientName.trim() && phoneSubscriber.trim()) {
              setCurrentStep(2);
            } else {
              handleProceedToStep2();
            }
          }}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold transition-all cursor-pointer ${
            currentStep === 2
              ? "bg-[#BBEB42] text-[#080808] font-black shadow-sm"
              : "text-[#888888] hover:text-white"
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-[#080808]/20 flex items-center justify-center text-[10px]">2</span>
          <span>Opciones & Confirmar</span>
        </button>
      </div>

      {step1Error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2 text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{step1Error}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* PASO 1: CAMPOS OBLIGATORIOS */}
      {/* ========================================================= */}
      {currentStep === 1 && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          <div className="bg-[#101010] border border-[#282828] rounded-2xl p-4 sm:p-5 space-y-3 shadow-md">
            {/* 1. Descripción */}
            <div>
              <label className="block text-[11px] font-semibold text-[#D1D1D1] uppercase tracking-wider mb-1">
                ¿Qué vas a enviar? <span className="text-[#BBEB42]">*</span>
              </label>
              <input
                type="text"
                required
                value={packageDescription}
                onChange={(e) => setPackageDescription(e.target.value)}
                placeholder="Ej. 2 hamburguesas, 1 refresco..."
                className="w-full bg-[#191919] border border-[#282828] rounded-xl px-3.5 py-2.5 text-white text-base sm:text-xs placeholder:text-[#5D5D5D] focus:outline-none focus:border-[#BBEB42]"
              />
            </div>

            {/* 2. Quien recibe & Teléfono con selector de operadora */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#D1D1D1] uppercase tracking-wider mb-1">
                  Nombre Destinatario <span className="text-[#BBEB42]">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-[#888888]" />
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Ej. Roberto Sánchez"
                    className="w-full bg-[#191919] border border-[#282828] rounded-xl pl-9 pr-3 py-2.5 text-white text-base sm:text-xs placeholder:text-[#5D5D5D] focus:outline-none focus:border-[#BBEB42]"
                  />
                </div>
              </div>

              {/* Teléfono Móvil Accesible */}
              <div>
                <label className="block text-[11px] font-semibold text-[#D1D1D1] uppercase tracking-wider mb-1">
                  Teléfono Celular (WhatsApp) <span className="text-[#BBEB42]">*</span>
                </label>
                <div className="flex gap-1.5">
                  <select
                    value={phoneOperator}
                    onChange={(e) => setPhoneOperator(e.target.value)}
                    className="bg-[#191919] border border-[#282828] rounded-xl px-2 py-2.5 text-white text-base sm:text-xs font-semibold focus:outline-none focus:border-[#BBEB42] cursor-pointer flex-shrink-0"
                  >
                    {PHONE_OPERATORS.map((op) => (
                      <option key={op.prefix} value={op.prefix} className="bg-[#101010] text-white">
                        {op.label}
                      </option>
                    ))}
                  </select>

                  <div className="relative flex-1">
                    <Phone className="absolute left-2.5 top-3 w-3.5 h-3.5 text-[#888888]" />
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                      value={phoneSubscriber}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder={phoneOperator === "OTHER" ? "+584121234567" : "8589530"}
                      maxLength={phoneOperator === "OTHER" ? 16 : 8}
                      className="w-full bg-[#191919] border border-[#282828] rounded-xl pl-8 pr-3 py-2.5 text-white text-base sm:text-xs font-mono placeholder:text-[#5D5D5D] focus:outline-none focus:border-[#BBEB42] tracking-wide"
                    />
                  </div>
                </div>
                <div className="text-[10px] text-[#888888] mt-1 pl-1">
                  {phoneOperator !== "OTHER" && phoneSubscriber ? (
                    <span className="text-[#BBEB42] font-mono font-semibold">
                      Número: +58 {phoneOperator.replace(/^0/, "")} {phoneSubscriber}
                    </span>
                  ) : (
                    <span>Selecciona la telefonía y escribe los 7 dígitos</span>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Punto de Entrega */}
            <div className="pt-2 border-t border-[#282828] space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-semibold text-[#D1D1D1] uppercase tracking-wider">
                  Punto de Entrega <span className="text-[#BBEB42]">*</span>
                </label>

                <div className="flex bg-[#191919] p-0.5 rounded-lg border border-[#282828] text-[10px]">
                  <button
                    type="button"
                    onClick={() => setDestinationMode("paste")}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                      destinationMode === "paste"
                        ? "bg-[#BBEB42] text-[#080808] font-black"
                        : "text-[#888888] hover:text-white"
                    }`}
                  >
                    Pegar Enlace
                  </button>
                  <button
                    type="button"
                    onClick={() => setDestinationMode("manual")}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                      destinationMode === "manual"
                        ? "bg-[#BBEB42] text-[#080808] font-black"
                        : "text-[#888888] hover:text-white"
                    }`}
                  >
                    Zonas Rápidas
                  </button>
                </div>
              </div>

              {destinationMode === "paste" ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <LinkIcon className="absolute left-3 top-3 w-3.5 h-3.5 text-[#888888]" />
                      <input
                        type="text"
                        value={pastedUrl}
                        onChange={(e) => handleUrlInputChange(e.target.value)}
                        onPaste={(e) => {
                          e.preventDefault();
                          const val = e.clipboardData?.getData("text") || "";
                          const clean = cleanPastedUrl(val);
                          if (clean) {
                            setPastedUrl(clean);
                            handleResolveLink(clean, false);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleResolveLink(pastedUrl, false);
                          }
                        }}
                        placeholder="Pega link de Google Maps o WhatsApp..."
                        className="w-full bg-[#191919] border border-[#282828] rounded-xl pl-8 pr-3 py-2.5 text-white text-base sm:text-xs placeholder:text-[#5D5D5D] focus:outline-none focus:border-[#BBEB42]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={pastedUrl.trim() ? () => handleResolveLink(pastedUrl, false) : handlePasteFromClipboard}
                      className="bg-[#BBEB42] hover:bg-[#CDF561] active:scale-95 text-[#080808] font-black px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-all shadow-md shadow-[#BBEB42]/15"
                    >
                      {resolvingLink ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-[#080808] border-t-transparent rounded-full animate-spin" />
                          <span>Detectando...</span>
                        </>
                      ) : pastedUrl.trim() ? (
                        <>
                          <Navigation className="w-3.5 h-3.5 fill-[#080808]/20" />
                          <span>Detectar</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Pegar</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#6D6D6D] px-1">
                    <span>Soporta links de Maps, Plus Codes y WhatsApp</span>
                    {!pastedUrl && (
                      <button
                        type="button"
                        onClick={handlePasteFromClipboard}
                        className="text-[#BBEB42] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Pegar desde portapapeles</span>
                      </button>
                    )}
                  </div>

                  {resolvingLink && (
                    <div className="text-[11px] text-[#BBEB42] flex items-center gap-1.5 pl-1 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-[#BBEB42] animate-ping" />
                      <span>Procesando enlace y extrayendo ubicación...</span>
                    </div>
                  )}

                  {dropoffLat && dropoffLng && (
                    <div className="text-[11px] text-[#BBEB42] flex items-start gap-1.5 pl-1 bg-[#BBEB42]/10 border border-[#BBEB42]/25 p-2 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">
                        {resolvedPlaceName
                          ? `Ubicación detectada: ${resolvedPlaceName}`
                          : `Coordenadas detectadas: ${dropoffLat.toFixed(4)}, ${dropoffLng.toFixed(4)}`}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  {COMMON_DESTINATIONS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-2 rounded-lg border text-left text-[11px] transition-all cursor-pointer ${
                        dropoffLat === preset.lat && dropoffLng === preset.lng
                          ? "bg-[#BBEB42]/10 border-[#BBEB42] text-[#BBEB42] font-bold"
                          : "bg-[#191919] border-[#282828] text-[#D1D1D1] hover:border-[#454545]"
                      }`}
                    >
                      <div className="truncate">{preset.name}</div>
                    </button>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-[10px] text-[#888888] uppercase mb-1">
                  Dirección o Referencia Específica <span className="text-[#BBEB42]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={dropoffAddress}
                  onChange={(e) => setDropoffAddress(e.target.value)}
                  placeholder="Ej. Res. Puerta Real 1, Apto 4-B, Naguanagua"
                  className="w-full bg-[#191919] border border-[#282828] rounded-xl px-3.5 py-2.5 text-white text-base sm:text-xs placeholder:text-[#5D5D5D] focus:outline-none focus:border-[#BBEB42]"
                />
              </div>

              {/* Cotización en vivo */}
              {calculatingQuote ? (
                <div className="p-3 bg-[#191919] border border-[#282828] rounded-xl flex items-center justify-center gap-2 text-xs text-[#888888]">
                  <div className="w-3.5 h-3.5 border-2 border-[#BBEB42] border-t-transparent rounded-full animate-spin" />
                  <span>Calculando tarifa...</span>
                </div>
              ) : quoteError ? (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2 text-rose-400 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>{quoteError}</span>
                </div>
              ) : quote && isCovered ? (
                <div className="p-3 bg-[#191919] border border-[#BBEB42]/30 rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase tracking-wider text-[#888888]">Tarifa Estimada</span>
                    <div className="text-lg font-black text-[#BBEB42] font-mono">${quote.totalCost.toFixed(2)}</div>
                  </div>

                  <div className="text-right text-[11px] text-[#D1D1D1] space-y-0.5">
                    <div>📏 {quote.distanceKm.toFixed(2)} km</div>
                    <div>⏱️ ~{quote.estimatedMinutes} min</div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Botón Siguiente */}
          <button
            type="button"
            onClick={handleProceedToStep2}
            className="w-full min-h-[48px] bg-[#BBEB42] hover:bg-[#CDF561] active:scale-[0.99] text-[#080808] font-black py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-[#BBEB42]/15 flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            <span>Siguiente: Opciones y Confirmar</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* PASO 2: OPCIONALES & CONFIRMACIÓN FINAL */}
      {/* ========================================================= */}
      {currentStep === 2 && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          {/* Resumen Compacto del Paso 1 */}
          <div className="bg-[#191919] border border-[#282828] rounded-xl p-3 text-xs text-[#D1D1D1] flex items-center justify-between">
            <div className="space-y-0.5 min-w-0 pr-2">
              <div className="font-bold text-white truncate">{packageDescription}</div>
              <div className="text-[#888888] text-[11px] truncate">
                Recibe: {recipientName} ({getFullRecipientPhone()})
              </div>
              <div className="text-[#888888] text-[11px] truncate">
                Destino: {dropoffAddress}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="text-[11px] text-[#BBEB42] hover:underline flex-shrink-0 font-bold cursor-pointer"
            >
              Editar
            </button>
          </div>

          {/* Campos Opcionales */}
          <div className="bg-[#101010] border border-[#282828] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-md">
            <div className="flex items-center justify-between border-b border-[#282828] pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#BBEB42]" />
                <span>Detalles Opcionales</span>
              </span>
              <span className="text-[10px] text-[#888888] bg-[#191919] px-2 py-0.5 rounded-md border border-[#282828]">
                Paso 2 de 2
              </span>
            </div>

            {/* Tamaño del Paquete (Opcional) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-semibold text-[#D1D1D1] uppercase tracking-wider">
                  Tamaño del Paquete
                </label>
                <span className="text-[10px] text-[#6D6D6D]">Opcional (por defecto: Mediano)</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "SMALL", label: "Pequeño", desc: "Bolsa individual" },
                  { id: "MEDIUM", label: "Mediano", desc: "Bolsa estándar" },
                  { id: "LARGE", label: "Grande", desc: "Bolsa grande / Pizza" },
                ].map((size) => (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => setPackageSize(size.id as any)}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      packageSize === size.id
                        ? "bg-[#BBEB42]/10 border-[#BBEB42] text-[#BBEB42] font-bold"
                        : "bg-[#191919] border-[#282828] text-[#888888] hover:border-[#454545]"
                    }`}
                  >
                    <div className="text-xs text-white">{size.label}</div>
                    <div className="text-[10px] text-[#6D6D6D] mt-0.5">{size.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Notas Especiales (Opcional) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-[#D1D1D1] uppercase tracking-wider">
                  Instrucciones o Notas Especiales
                </label>
                <span className="text-[10px] text-[#6D6D6D]">Opcional</span>
              </div>
              <input
                type="text"
                value={packageNotes}
                onChange={(e) => setPackageNotes(e.target.value)}
                placeholder="Ej. Tocar timbre 3B, llevar vuelto de $20"
                className="w-full bg-[#191919] border border-[#282828] rounded-xl px-3.5 py-2.5 text-white text-base sm:text-xs placeholder:text-[#5D5D5D] focus:outline-none focus:border-[#BBEB42]"
              />
            </div>

            {/* Caja de Tarifa Final */}
            {quote && (
              <div className="p-3.5 bg-[#191919] border border-[#BBEB42]/30 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#888888] uppercase">Tarifa Total del Despacho</span>
                  <div className="text-xl font-black text-[#BBEB42] font-mono">${quote.totalCost.toFixed(2)}</div>
                </div>
                <div className="text-right text-xs text-[#888888]">
                  <span>{quote.distanceKm.toFixed(2)} km</span> · <span>~{quote.estimatedMinutes} min</span>
                </div>
              </div>
            )}
          </div>

          {/* Botones de Acción */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleSubmitOrder()}
              disabled={submitting || !quote}
              className="w-full min-h-[50px] bg-[#BBEB42] hover:bg-[#CDF561] text-[#080808] font-black py-3.5 px-4 rounded-xl transition-all shadow-xl shadow-[#BBEB42]/20 flex items-center justify-center gap-2 text-sm disabled:opacity-40 cursor-pointer active:scale-95"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-[#080808] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Confirmar y Solicitar Carrera (${quote ? quote.totalCost.toFixed(2) : "0.00"})</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="w-full py-2 px-4 text-xs font-semibold text-[#888888] hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver al Paso 1</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
