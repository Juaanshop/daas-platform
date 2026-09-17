"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Store,
  User,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Compass,
} from "lucide-react";
import { GeofenceService, REPRESENTATIVE_SECTORS } from "@/services/geofence";

interface CreateMerchantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMerchantCreated: () => void;
}

export function CreateMerchantModal({
  isOpen,
  onClose,
  onMerchantCreated,
}: CreateMerchantModalProps) {
  const [businessName, setBusinessName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number>(10.2135);
  const [longitude, setLongitude] = useState<number>(-68.0062);
  const [balance, setBalance] = useState<number>(0);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Validación de geocerca en tiempo real
  const coverage = GeofenceService.checkLocationCoverage(latitude, longitude);

  // Manejador de selector rápido de sectores en Valencia y Naguanagua
  const handleSelectSector = (sectorLat: number, sectorLng: number, sectorName: string) => {
    setLatitude(sectorLat);
    setLongitude(sectorLng);
    if (!address) {
      setAddress(`${sectorName}, Edo. Carabobo`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!coverage.isCovered) {
      setErrorMessage(
        coverage.error || "Las coordenadas están fuera de Valencia, Naguanagua y San Diego."
      );
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch("/api/merchants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName.trim(),
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          address: address.trim(),
          latitude: Number(latitude),
          longitude: Number(longitude),
          balance: Number(balance) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo registrar el comercio");
      }

      setSuccessMessage(`¡Comercio "${data.merchant.businessName}" registrado con éxito!`);
      setTimeout(() => {
        onMerchantCreated();
        onClose();
        // Reset form
        setBusinessName("");
        setName("");
        setEmail("");
        setPhone("");
        setAddress("");
        setBalance(0);
        setSuccessMessage(null);
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || "Ocurrió un error inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-emerald-500/20 shadow-2xl shadow-emerald-500/10 p-6 sm:p-8 z-10 space-y-6"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Registrar Nuevo Cliente / Comercio B2B
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Habilita un nuevo comercio en la red de despacho de Valencia, Naguanagua y San Diego.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error / Success Banners */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Fila 1: Nombre de Empresa & Nombre de Contacto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-emerald-400" />
                    Razón Social / Nombre Comercial *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Burger Lab El Viñedo"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    Persona de Contacto / Encargado *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Laura Gómez"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Fila 2: Correo Electrónico & Teléfono */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-emerald-400" />
                    Correo Electrónico (Acceso) *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="pedidos@comercio.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    Teléfono Celular / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+58 414 823-4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Fila 3: Dirección Física */}
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  Dirección Física de Despacho (Retiro) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Calle 139 c/c Av. Monseñor Adams, El Viñedo, Valencia"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Selector Rápido de Sectores */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-cyan-400" />
                    Sectores frecuentes en Valencia, Naguanagua y San Diego:
                  </span>
                  <span className="text-[11px] text-slate-500">Haz clic para auto-posicionar</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {REPRESENTATIVE_SECTORS.map((sec) => (
                    <button
                      type="button"
                      key={sec.name}
                      onClick={() => handleSelectSector(sec.centerLat, sec.centerLng, sec.name)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-900 hover:bg-emerald-500/10 text-slate-300 hover:text-emerald-300 border border-white/10 hover:border-emerald-500/30 transition-all cursor-pointer"
                    >
                      {sec.name} ({sec.municipality})
                    </button>
                  ))}
                </div>
              </div>

              {/* Fila 4: Coordenadas GPS & Saldo Inicial */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">
                    Latitud GPS *
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={latitude}
                    onChange={(e) => setLatitude(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">
                    Longitud GPS *
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={longitude}
                    onChange={(e) => setLongitude(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-emerald-400" />
                    Saldo Inicial ($)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="0.00"
                    value={balance}
                    onChange={(e) => setBalance(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Banner de Geocerca Feedback */}
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  coverage.isCovered
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                }`}
              >
                {coverage.isCovered ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>
                  {coverage.isCovered
                    ? `Zona Autorizada: ${coverage.municipality} (Sector cercano: ${coverage.nearestSector || "Conurbación"})`
                    : coverage.error || "Coordenadas fuera del rango autorizado."}
                </span>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !coverage.isCovered}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:brightness-110 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all cursor-pointer"
                >
                  {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isLoading ? "Registrando..." : "Registrar Comercio"}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
