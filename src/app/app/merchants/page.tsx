"use client";

import { useState, useEffect } from "react";
import {
  Store,
  Plus,
  Copy,
  Check,
  ExternalLink,
  MapPin,
  Phone,
  AlertCircle,
  Sparkles,
  Edit2,
  Trash2,
  Power,
  PowerOff,
  MessageCircle,
  Share2,
} from "lucide-react";

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

  // Modal / Form state (Create or Edit)
  const [showModal, setShowModal] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<MerchantItem | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("10.2135");
  const [longitude, setLongitude] = useState("-68.0062");
  const [phone, setPhone] = useState("+58 414 ");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Confirm delete modal state
  const [merchantToDelete, setMerchantToDelete] = useState<MerchantItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

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

  const handleShareWhatsApp = (m: MerchantItem) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://daas-platform-pink.vercel.app";
    const fullUrl = `${origin}/m/${m.publicToken}`;
    const message = `¡Hola ${m.businessName}! Aquí tienes tu enlace exclusivo para solicitar delivery al instante:\n\n${fullUrl}\n\nGuárdalo para solicitar tus carreras con cálculo de tarifa inmediato.`;

    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: `Link de Despacho - ${m.businessName}`,
          text: message,
          url: fullUrl,
        })
        .catch(() => {
          const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
          window.open(waUrl, "_blank", "noopener,noreferrer");
        });
    } else {
      const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(waUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleApplyPreset = (lat: number, lng: number) => {
    setLatitude(lat.toString());
    setLongitude(lng.toString());
  };

  const handleOpenCreateModal = () => {
    setEditingMerchant(null);
    setBusinessName("");
    setAddress("");
    setLatitude("10.2135");
    setLongitude("-68.0062");
    setPhone("+58 414 ");
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (m: MerchantItem) => {
    setEditingMerchant(m);
    setBusinessName(m.businessName);
    setAddress(m.address);
    setLatitude(m.latitude.toString());
    setLongitude(m.longitude.toString());
    setPhone(m.phone);
    setFormError(null);
    setShowModal(true);
  };

  const handleToggleActive = async (m: MerchantItem) => {
    try {
      const res = await fetch(`/api/delivery/merchants/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !m.isActive }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo actualizar el estado del comercio");
      }
      setActionFeedback(`Comercio "${m.businessName}" ${!m.isActive ? "reactivado" : "desactivado"} exitosamente.`);
      setTimeout(() => setActionFeedback(null), 3000);
      await fetchMerchants();
    } catch (err: any) {
      alert(err.message || "Error al cambiar estado del comercio");
    }
  };

  const handleDeleteMerchant = async () => {
    if (!merchantToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/delivery/merchants/${merchantToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo eliminar el comercio");
      }
      setActionFeedback(data.message || `Comercio "${merchantToDelete.businessName}" procesado.`);
      setTimeout(() => setActionFeedback(null), 3500);
      setMerchantToDelete(null);
      await fetchMerchants();
    } catch (err: any) {
      alert(err.message || "Error al eliminar el comercio");
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmitMerchantForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const payload = {
        businessName,
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        phone,
      };

      const url = editingMerchant
        ? `/api/delivery/merchants/${editingMerchant.id}`
        : "/api/delivery/merchants";
      const method = editingMerchant ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo guardar el comercio");
      }

      setShowModal(false);
      setEditingMerchant(null);
      setBusinessName("");
      setAddress("");
      setActionFeedback(editingMerchant ? "Datos del comercio actualizados." : "Nuevo comercio afiliado con éxito.");
      setTimeout(() => setActionFeedback(null), 3000);
      await fetchMerchants();
    } catch (err: any) {
      setFormError(err.message || "Error al guardar el comercio");
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
          <p className="text-sm text-[#888888] mt-1">
            Cada comercio cuenta con un enlace único. Cópialo y compárteselo por WhatsApp para que pidan sus carreras.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 bg-[#BBEB42] hover:bg-[#CDF561] text-[#080808] font-black px-4 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-[#BBEB42]/15 cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Afiliar Nuevo Comercio</span>
        </button>
      </div>

      {actionFeedback && (
        <div className="p-3 bg-[#BBEB42]/10 border border-[#BBEB42]/25 rounded-xl text-xs text-[#BBEB42] flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Merchants List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#BBEB42] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : merchants.length === 0 ? (
        <div className="bg-[#101010] border border-[#282828] rounded-2xl p-12 text-center">
          <Store className="w-12 h-12 text-[#454545] mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white">No tienes comercios registrados aún</h3>
          <p className="text-sm text-[#888888] max-w-md mx-auto mt-1 mb-6">
            Afilia un restaurante o negocio local para generarle su link público y comenzar a recibir solicitudes.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 bg-[#BBEB42] hover:bg-[#CDF561] text-[#080808] font-black px-4 py-2 rounded-xl text-sm transition-all cursor-pointer active:scale-95"
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
                className={`bg-[#101010] border rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between transition-all shadow-md ${
                  m.isActive
                    ? "border-[#282828] hover:border-[#454545]"
                    : "border-[#282828]/50 opacity-75 bg-[#101010]/50"
                }`}
              >
                <div>
                  {/* Card Header with Status & Action Buttons */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-base sm:text-lg font-bold text-white truncate">{m.businessName}</h3>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${
                            m.isActive
                              ? "bg-[#BBEB42]/10 text-[#BBEB42] border-[#BBEB42]/25"
                              : "bg-[#191919] text-[#888888] border-[#282828]"
                          }`}
                        >
                          {m.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#888888] mt-0.5">
                        <Phone className="w-3 h-3 text-[#6D6D6D] shrink-0" />
                        <span className="font-mono text-[11px]">{m.phone}</span>
                      </div>
                    </div>

                    {/* Action Buttons: Edit, Toggle Active, Delete */}
                    <div className="flex items-center gap-0.5 shrink-0 bg-[#191919] p-0.5 rounded-xl border border-[#282828]">
                      <button
                        onClick={() => handleOpenEditModal(m)}
                        className="p-1.5 text-[#888888] hover:text-[#BBEB42] hover:bg-[#282828] rounded-lg transition-colors cursor-pointer"
                        title="Editar datos del comercio"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleToggleActive(m)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          m.isActive
                            ? "text-[#BBEB42] hover:text-white hover:bg-[#282828]"
                            : "text-[#5D5D5D] hover:text-[#BBEB42] hover:bg-[#282828]"
                        }`}
                        title={m.isActive ? "Desactivar comercio" : "Activar comercio"}
                      >
                        {m.isActive ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => setMerchantToDelete(m)}
                        className="p-1.5 text-[#888888] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar comercio"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-1.5 text-xs text-[#888888] mt-2.5 bg-[#191919] p-2 sm:p-2.5 rounded-xl border border-[#282828]">
                    <MapPin className="w-3.5 h-3.5 text-[#BBEB42] shrink-0 mt-0.5" />
                    <span className="line-clamp-2 leading-relaxed text-[#D1D1D1] text-[11px] sm:text-xs">{m.address}</span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-[#888888] px-1">
                    <span>
                      Órdenes: <strong className="text-white font-mono">{m._count?.orders || 0}</strong>
                    </span>
                    <span className="font-mono text-[#6D6D6D]">
                      {m.latitude.toFixed(3)}, {m.longitude.toFixed(3)}
                    </span>
                  </div>
                </div>

                {/* Public Link Section */}
                <div className="mt-3 pt-2.5 border-t border-[#282828]">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-[#888888] font-semibold">
                      Link del comercio
                    </span>
                    <a
                      href={`/m/${m.publicToken}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-[#888888] hover:text-[#BBEB42] flex items-center gap-1 transition-colors"
                    >
                      <span>Vista previa</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="space-y-2">
                    <div className="bg-[#080808] border border-[#282828] rounded-xl px-2.5 py-1.5 text-xs font-mono text-[#D1D1D1] truncate">
                      {typeof window !== "undefined" ? window.location.origin : ""}/m/{m.publicToken}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleCopyLink(m.publicToken)}
                        className={`w-full py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                          isCopied
                            ? "bg-[#BBEB42] text-[#080808] font-black shadow-sm"
                            : "bg-[#191919] hover:bg-[#282828] text-[#F6F6F6] border border-[#282828]"
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

                      <button
                        onClick={() => handleShareWhatsApp(m)}
                        className="w-full py-2 px-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer bg-[#25D366] hover:bg-[#20ba5a] text-black shadow-sm active:scale-95"
                        title="Enviar link por WhatsApp al cliente"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Compartir WA</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Crear o Editar Comercio (Adaptado a Bottom Sheet en Móvil) */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#101010] border-t sm:border border-[#282828] rounded-t-3xl sm:rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl overflow-y-auto max-h-[88vh]">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#BBEB42]/10 text-[#BBEB42] flex items-center justify-center">
                  {editingMerchant ? <Edit2 className="w-4 h-4" /> : <Store className="w-4 h-4" />}
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  {editingMerchant ? "Editar Datos del Comercio" : "Afiliar Nuevo Comercio"}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-[#191919] hover:bg-[#282828] text-[#888888] hover:text-white flex items-center justify-center text-sm font-semibold cursor-pointer"
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

            <form onSubmit={handleSubmitMerchantForm} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-[#D1D1D1] uppercase tracking-wider mb-1">
                  Nombre Comercial
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Ej. Hamburguesas El Viñedo"
                  className="w-full bg-[#191919] border border-[#282828] rounded-xl px-3.5 py-3 text-white text-base sm:text-sm placeholder:text-[#5D5D5D] focus:outline-none focus:border-[#BBEB42]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D1D1D1] uppercase tracking-wider mb-1">
                  Teléfono de Contacto (WhatsApp del Comercio)
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+58 414 123-4567"
                  className="w-full bg-[#191919] border border-[#282828] rounded-xl px-3.5 py-3 text-white text-base sm:text-sm placeholder:text-[#5D5D5D] focus:outline-none focus:border-[#BBEB42]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D1D1D1] uppercase tracking-wider mb-1">
                  Dirección Comercial (Punto de Retiro)
                </label>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Calle 139, El Viñedo, Valencia, Carabobo"
                  className="w-full bg-[#191919] border border-[#282828] rounded-xl px-3.5 py-2.5 text-white text-base sm:text-xs placeholder:text-[#5D5D5D] focus:outline-none focus:border-[#BBEB42] resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#D1D1D1] uppercase tracking-wider">
                    Ubicación Geográfica (Coordenadas)
                  </label>
                  <span className="text-[11px] text-[#888888]">Valencia, Naguanagua, San Diego</span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-2">
                  <input
                    type="number"
                    step="any"
                    required
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="Latitud (ej. 10.2135)"
                    className="w-full bg-[#191919] border border-[#282828] rounded-xl px-3 py-2.5 text-white text-base sm:text-xs focus:outline-none focus:border-[#BBEB42]"
                  />
                  <input
                    type="number"
                    step="any"
                    required
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="Longitud (ej. -68.0062)"
                    className="w-full bg-[#191919] border border-[#282828] rounded-xl px-3 py-2.5 text-white text-base sm:text-xs focus:outline-none focus:border-[#BBEB42]"
                  />
                </div>

                {/* Zona Presets como carrusel táctil deslizable */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none touch-pan-x">
                  <span className="text-[10px] text-[#6D6D6D] shrink-0 mr-1">Zonas rápidas:</span>
                  {PRESET_ZONES.map((z) => (
                    <button
                      key={z.name}
                      type="button"
                      onClick={() => handleApplyPreset(z.lat, z.lng)}
                      className="text-[10px] whitespace-nowrap bg-[#191919] hover:bg-[#282828] text-[#D1D1D1] px-2.5 py-1 rounded-lg border border-[#282828] transition-colors cursor-pointer active:scale-95 shrink-0"
                    >
                      {z.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#282828]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-xs text-[#888888] hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-[46px] bg-[#BBEB42] hover:bg-[#CDF561] text-[#080808] font-black px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2 shadow-md shadow-[#BBEB42]/15 active:scale-95"
                >
                  {submitting ? (
                    <span className="inline-block w-4 h-4 border-2 border-[#080808] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{editingMerchant ? "Guardar Cambios" : "Guardar y Generar Link"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Eliminación */}
      {merchantToDelete && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#101010] border border-[#282828] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-white">¿Eliminar este comercio?</h3>
              <p className="text-xs text-[#888888] mt-1">
                Vas a procesar el comercio{" "}
                <strong className="text-white">"{merchantToDelete.businessName}"</strong>.
              </p>
              {merchantToDelete._count?.orders && merchantToDelete._count.orders > 0 ? (
                <div className="mt-3 p-3 bg-[#BBEB42]/10 border border-[#BBEB42]/20 rounded-xl text-left text-xs text-[#BBEB42]">
                  <p className="font-semibold">⚠️ Este comercio tiene {merchantToDelete._count.orders} órdenes registradas.</p>
                  <p className="text-[11px] text-[#CDF561]/80 mt-0.5">
                    Para resguardar el historial contable y balances, el comercio será <strong>desactivado</strong> en lugar de borrado físico.
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-[#6D6D6D] mt-2">
                  No cuenta con órdenes asociadas, por lo que será eliminado de forma definitiva.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-[#282828]">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setMerchantToDelete(null)}
                className="px-4 py-2 text-xs text-[#888888] hover:text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteMerchant}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {deleting ? "Procesando..." : "Confirmar Eliminación"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
