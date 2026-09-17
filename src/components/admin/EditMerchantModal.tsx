"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Store,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  AlertCircle,
  Save,
  CheckCircle2,
} from "lucide-react";
import { GeofenceService, REPRESENTATIVE_SECTORS } from "@/services/geofence";
import { Merchant } from "./MerchantsDirectoryCard";

interface EditMerchantModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchant: Merchant | null;
  onMerchantUpdated: () => void;
}

export function EditMerchantModal({
  isOpen,
  onClose,
  merchant,
  onMerchantUpdated,
}: EditMerchantModalProps) {
  const [businessName, setBusinessName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number>(10.2135);
  const [longitude, setLongitude] = useState<number>(-68.0062);
  const [balance, setBalance] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Inicializar campos cuando cambia el merchant seleccionado
  useEffect(() => {
    if (merchant) {
      setBusinessName(merchant.businessName || "");
      setName(merchant.user?.name || "");
      setEmail(merchant.user?.email || "");
      setPhone(merchant.phone || "");
      setAddress(merchant.address || "");
      setLatitude(merchant.latitude ?? 10.2135);
      setLongitude(merchant.longitude ?? -68.0062);
      setBalance(merchant.balance ?? 0);
      setIsActive(merchant.isActive !== false);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [merchant]);

  // Selección de preset de sector urbano
  const handleSelectSector = (sectorName: string) => {
    const sector = REPRESENTATIVE_SECTORS.find((s) => s.name === sectorName);
    if (sector) {
      setLatitude(sector.centerLat);
      setLongitude(sector.centerLng);
      if (!address.trim() || address === merchant?.address) {
        setAddress(`${sector.name}, ${sector.municipality}`);
      }
    }
  };

  const coverage = GeofenceService.checkLocationCoverage(latitude, longitude);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validación de Geocerca
    if (!coverage.isCovered) {
      setErrorMessage(
        coverage.error ||
          "La ubicación seleccionada está fuera de la zona autorizada de Valencia, Naguanagua y San Diego."
      );
      return;
    }

    try {
      setIsLoading(true);

      const res = await fetch("/api/merchants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId: merchant.id,
          businessName: businessName.trim(),
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
          latitude: Number(latitude),
          longitude: Number(longitude),
          balance: Number(balance),
          isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo actualizar el comercio");
      }

      setSuccessMessage("¡Comercio actualizado correctamente!");
      setTimeout(() => {
        onMerchantUpdated();
        onClose();
      }, 900);
    } catch (err: any) {
      setErrorMessage(err.message || "Ocurrió un error inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && merchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-hidden animate-in fade-in">
          {/* Backdrop click to close */}
          <div className="fixed inset-0" onClick={onClose} />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="relative w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-emerald-500/25 shadow-2xl shadow-emerald-500/10 overflow-hidden z-10 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Fijo */}
            <div className="p-5 sm:p-6 pb-4 border-b border-white/10 flex items-start justify-between gap-3 flex-shrink-0 bg-slate-900/95 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    Editar Comercio / Cliente B2B
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Modifica los datos comerciales, dirección y coordenadas en Valencia, Naguanagua y San Diego.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body Scrollable */}
            <form id="edit-merchant-form" onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {/* Notificaciones de error o éxito */}
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center gap-2.5 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2.5 text-emerald-300 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Fila 1: Nombre Comercial y Contacto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Razón Social / Nombre Comercial *
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Ej. Burger Lab El Viñedo"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Nombre del Contacto Principal *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Carlos Mendoza"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Fila 2: Correo y Teléfono */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contacto@comercio.com"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    Teléfono de Contacto *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+58 414 123-4567"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Fila 3: Dirección Física */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  Dirección Comercial (Punto de Retiro) *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Calle 139 c/c Av. Monseñor Adams, El Viñedo, Valencia"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Selector de Sector de Cobertura */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Sector de Cobertura Rápido:
                  </label>
                  {coverage.isCovered ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                      ✓ {coverage.municipality} ({coverage.nearestSector})
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 font-semibold">
                      ⚠ Fuera de Cobertura
                    </span>
                  )}
                </div>

                <select
                  onChange={(e) => handleSelectSector(e.target.value)}
                  className="w-full bg-slate-900 border border-white/15 text-white text-xs font-medium rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-400 focus:outline-none cursor-pointer"
                  defaultValue=""
                >
                  <option value="" disabled>
                    -- Seleccionar sector para actualizar coordenadas --
                  </option>
                  <optgroup label="Valencia">
                    {REPRESENTATIVE_SECTORS.filter((s) => s.municipality === "Valencia").map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Naguanagua">
                    {REPRESENTATIVE_SECTORS.filter((s) => s.municipality === "Naguanagua").map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="San Diego">
                    {REPRESENTATIVE_SECTORS.filter((s) => s.municipality === "San Diego").map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </optgroup>
                </select>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Latitud</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={latitude}
                      onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Longitud</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={longitude}
                      onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Fila 4: Saldo Comercial y Estado Activo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    Saldo Comercial Disponible ($ USD)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={balance}
                    onChange={(e) => setBalance(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div className="flex flex-col justify-center">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Estado de Visibilidad
                  </label>
                  <div className="flex items-center gap-3 pt-1">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="rounded border-white/20 bg-slate-950 text-emerald-500 focus:ring-emerald-400 w-4 h-4 cursor-pointer"
                      />
                      <span>Comercio Activo en Plataforma</span>
                    </label>
                  </div>
                </div>
              </div>
            </form>

            {/* Footer Fijo */}
            <div className="p-4 sm:p-5 border-t border-white/10 bg-slate-900/95 backdrop-blur-md flex-shrink-0 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                form="edit-merchant-form"
                disabled={isLoading || !coverage.isCovered}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:brightness-110 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
