"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Bike,
  User,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Compass,
  CreditCard,
} from "lucide-react";
import { REPRESENTATIVE_SECTORS } from "@/services/geofence";

interface CreateRiderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRiderCreated: () => void;
}

export function CreateRiderModal({
  isOpen,
  onClose,
  onRiderCreated,
}: CreateRiderModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [status, setStatus] = useState<"IDLE" | "OFFLINE">("IDLE");
  const [currentLat, setCurrentLat] = useState<number>(10.2135);
  const [currentLng, setCurrentLng] = useState<number>(-68.0062);
  const [baseSectorName, setBaseSectorName] = useState("El Viñedo (Valencia)");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSelectBase = (lat: number, lng: number, name: string, mun: string) => {
    setCurrentLat(lat);
    setCurrentLng(lng);
    setBaseSectorName(`${name} (${mun})`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      setIsLoading(true);
      const res = await fetch("/api/riders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          vehiclePlate: vehiclePlate.trim().toUpperCase(),
          status,
          currentLat,
          currentLng,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo registrar el repartidor");
      }

      setSuccessMessage(`¡Repartidor "${data.rider.user.name}" dado de alta con éxito!`);
      setTimeout(() => {
        onRiderCreated();
        onClose();
        // Reset form
        setName("");
        setEmail("");
        setPhone("");
        setVehiclePlate("");
        setStatus("IDLE");
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
            className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-sky-500/20 shadow-2xl shadow-sky-500/10 p-6 sm:p-8 z-10 space-y-6"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Bike className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Dar de Alta Nuevo Repartidor
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Registra un nuevo miembro en la flota operativa de Valencia, Naguanagua y San Diego.
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
              {/* Nombre y Apellido */}
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-sky-400" />
                  Nombre Completo del Repartidor *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Alejandro Rivas"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              {/* Correo y Teléfono */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-sky-400" />
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="alejandro.rider@daas.local"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-sky-400" />
                    Teléfono Celular *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+58 424 555-1234"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              {/* Placa y Estado Inicial */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-sky-400" />
                    Placa / Matrícula Vehicular *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. AE9K21M"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 text-xs font-mono uppercase focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                    Estado Operativo Inicial
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "IDLE" | "OFFLINE")}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-sky-500 transition-colors cursor-pointer"
                  >
                    <option value="IDLE">🟢 Disponible (Libre para despachos)</option>
                    <option value="OFFLINE">⚪ Desconectado / Fuera de turno</option>
                  </select>
                </div>
              </div>

              {/* Base Inicial de Despacho en Carabobo */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-cyan-400" />
                    Punto base inicial en Valencia, Naguanagua o San Diego:
                  </span>
                  <span className="text-[11px] font-mono text-cyan-300">{baseSectorName}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {REPRESENTATIVE_SECTORS.map((sec) => (
                    <button
                      type="button"
                      key={sec.name}
                      onClick={() => handleSelectBase(sec.centerLat, sec.centerLng, sec.name, sec.municipality)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
                        baseSectorName.includes(sec.name)
                          ? "bg-sky-500/20 text-sky-300 border-sky-500/40"
                          : "bg-slate-900 text-slate-300 border-white/10 hover:border-sky-500/30 hover:text-sky-300"
                      }`}
                    >
                      {sec.name}
                    </button>
                  ))}
                </div>
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
                  disabled={isLoading}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-sky-400 to-cyan-400 hover:brightness-110 shadow-lg shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all cursor-pointer"
                >
                  {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isLoading ? "Registrando..." : "Dar de Alta Repartidor"}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
