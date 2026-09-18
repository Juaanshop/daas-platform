"use client";

import { useState, useEffect } from "react";
import { Store, Plus, Copy, Check, ExternalLink, MapPin, Phone, AlertCircle, Sparkles } from "lucide-react";

interface MerchantItem {
  id: string;
  businessName: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  publicToken: string;
  isActive: boolean;
  _count?: {
    orders: number;
  };
}

const PRESET_ZONES = [
  { name: "El Viñedo (Valencia)", lat: 10.2135, lng: -68.0062 },
  { name: "La Granja (Naguanagua)", lat: 10.2485, lng: -68.0105 },
  { name: "San Diego (Fin de Siglo)", lat: 10.2520, lng: -67.9540 },
  { name: "Prebo (Valencia)", lat: 10.2170, lng: -68.0120 },
  { name: "Mañongo (Naguanagua)", lat: 10.2450, lng: -68.0010 },
];

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<MerchantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("10.2135");
  const [longitude, setLongitude] = useState("-68.0062");
  const [phone, setPhone] = useState("+58 414 ");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchMerchants = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/delivery/merchants");
      if (res.ok) {
        const data = await res.json();
        setMerchants(data.merchants || []);
      }
    } catch (err) {
      console.error("Error al cargar comercios:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchants();
  }, []);

  const handleCopyLink = (token: string) => {
    const fullUrl = `${window.location.origin}/m/${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleApplyPreset = (lat: number, lng: number) => {
    setLatitude(lat.toString());
    setLongitude(lng.toString());
  };

  const handleSubmitNewMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/delivery/merchants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          address,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          phone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo crear el comercio");
      }

      setShowModal(false);
      setBusinessName("");
      setAddress("");
      await fetchMerchants();
    } catch (err: any) {
      setFormError(err.message || "Error al afiliar el comercio");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Comercios Afiliados & Links</h1>
          <p className="text-sm text-slate-400 mt-1">
            Cada comercio cuenta con un enlace único. Cópialo y compárteselo por WhatsApp para que pidan sus carreras.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-orange-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Afiliar Nuevo Comercio</span>
        </button>
      </div>

      {/* Merchants List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : merchants.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
          <Store className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white">No tienes comercios registrados aún</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-1 mb-6">
            Afilia un restaurante o negocio local para generarle su link público y comenzar a recibir solicitudes.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Afiliar primer comercio</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {merchants.map((m) => {
            const isCopied = copiedToken === m.publicToken;
            return (
              <div
                key={m.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between transition-all shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-white">{m.businessName}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>{m.phone}</span>
                      </div>
                    </div>
                    <span className="text-[11px] bg-slate-800 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full font-medium">
                      {m._count?.orders || 0} pedidos
                    </span>
                  </div>

                  <div className="flex items-start gap-1.5 text-xs text-slate-400 mt-3 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                    <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{m.address}</span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800/80">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                      Link del comercio
                    </span>
                    <a
                      href={`/m/${m.publicToken}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <span>Abrir vista previa</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 truncate">
                      {typeof window !== "undefined" ? window.location.origin : ""}/m/{m.publicToken}
                    </div>

                    <button
                      onClick={() => handleCopyLink(m.publicToken)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isCopied
                          ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                          : "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-orange-500/10"
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Afiliar Nuevo Comercio */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Store className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-bold text-white">Afiliar Nuevo Comercio</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-lg font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitNewMerchant} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Nombre Comercial
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Ej. Hamburguesas El Viñedo"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Teléfono de Contacto (WhatsApp del Comercio)
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+58 414 123-4567"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Dirección Comercial (Punto de Retiro)
                </label>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Calle 139, El Viñedo, Valencia, Carabobo"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 resize-none text-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Ubicación Geográfica (Latitud / Longitud)
                  </label>
                  <span className="text-[11px] text-slate-400">Valencia, Naguanagua o San Diego</span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-2">
                  <input
                    type="number"
                    step="any"
                    required
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="Latitud (ej. 10.2135)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                  />
                  <input
                    type="number"
                    step="any"
                    required
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="Longitud (ej. -68.0062)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                  />
                </div>

                {/* Zona Presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 self-center mr-1">Zonas rápidas:</span>
                  {PRESET_ZONES.map((z) => (
                    <button
                      key={z.name}
                      type="button"
                      onClick={() => handleApplyPreset(z.lat, z.lng)}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700 transition-colors cursor-pointer"
                    >
                      {z.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {submitting ? (
                    <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Guardar y Generar Link</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
