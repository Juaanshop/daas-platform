"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Bike,
  Phone,
  Mail,
  Navigation,
  AlertCircle,
  Save,
  CheckCircle2,
} from "lucide-react";
import { REPRESENTATIVE_SECTORS } from "@/services/geofence";
import { Rider } from "./FleetCard";

interface EditRiderModalProps {
  isOpen: boolean;
  onClose: () => void;
  rider: Rider | null;
  onRiderUpdated: () => void;
}

export function EditRiderModal({
  isOpen,
  onClose,
  rider,
  onRiderUpdated,
}: EditRiderModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [status, setStatus] = useState<string>("IDLE");
  const [currentLat, setCurrentLat] = useState<number>(10.2135);
  const [currentLng, setCurrentLng] = useState<number>(-68.0062);
  const [isActive, setIsActive] = useState<boolean>(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Cargar datos cuando el rider cambia
  useEffect(() => {
    if (rider) {
      setName(rider.user?.name || "");
      setEmail(rider.user?.email || "");
      setPhone(rider.phone || "");
      setVehiclePlate(rider.vehiclePlate || "");
      setStatus(rider.status || "IDLE");
      setCurrentLat(rider.currentLat ?? 10.2135);
      setCurrentLng(rider.currentLng ?? -68.0062);
      setIsActive(rider.isActive !== false);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [rider]);

  // Selección de sector base rápido
  const handleSelectSector = (sectorName: string) => {
    const sector = REPRESENTATIVE_SECTORS.find((s) => s.name === sectorName);
    if (sector) {
      setCurrentLat(sector.centerLat);
      setCurrentLng(sector.centerLng);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rider) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      setIsLoading(true);

      const res = await fetch("/api/riders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          riderId: rider.id,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          vehiclePlate: vehiclePlate.trim().toUpperCase(),
          status,
          currentLat: Number(currentLat),
          currentLng: Number(currentLng),
          isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo actualizar el repartidor");
      }

      setSuccessMessage("¡Repartidor actualizado correctamente!");
      setTimeout(() => {
        onRiderUpdated();
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
      {isOpen && rider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-hidden animate-in fade-in">
          {/* Backdrop click to close */}
          <div className="fixed inset-0" onClick={onClose} />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="relative w-full max-w-xl max-h-[92vh] sm:max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-sky-500/25 shadow-2xl shadow-sky-500/10 overflow-hidden z-10 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Fijo */}
            <div className="p-5 sm:p-6 pb-4 border-b border-white/10 flex items-start justify-between gap-3 flex-shrink-0 bg-slate-900/95 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Bike className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    Editar Repartidor / Despachador
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Modifica datos de contacto, matrícula y disponibilidad de la flota en Carabobo.
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
            <form id="edit-rider-form" onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {/* Notificaciones */}
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

              {/* Fila 1: Nombre y Teléfono */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Nombre Completo del Repartidor *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Lucas Torres"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    Teléfono Celular *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+58 414 412-8899"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              {/* Fila 2: Correo y Matrícula Vehicular */}
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
                    placeholder="lucas.torres@daas.local"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Placa Vehicular *
                  </label>
                  <input
                    type="text"
                    required
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                    placeholder="AE5K89Y"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 font-mono tracking-wider uppercase focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              {/* Fila 3: Estado de Turno */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  Estado Operativo / Turno:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: "IDLE", label: "Disponible (Libre)", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
                    { val: "BUSY", label: "En Viaje (Ocupado)", color: "text-sky-400 border-sky-500/30 bg-sky-500/10" },
                    { val: "OFFLINE", label: "Fuera de Turno", color: "text-slate-400 border-white/10 bg-slate-900" },
                  ].map((s) => (
                    <button
                      key={s.val}
                      type="button"
                      onClick={() => setStatus(s.val)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        status === s.val
                          ? `${s.color} ring-2 ring-sky-400/20 font-black`
                          : "bg-slate-950 text-slate-400 border-white/5 hover:text-white"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fila 4: Sector Base y Coordenadas */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                    Sector Base de Operaciones:
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    [{currentLat.toFixed(4)}, {currentLng.toFixed(4)}]
                  </span>
                </div>

                <select
                  onChange={(e) => handleSelectSector(e.target.value)}
                  className="w-full bg-slate-900 border border-white/15 text-white text-xs font-medium rounded-xl p-2.5 focus:ring-2 focus:ring-sky-400 focus:outline-none cursor-pointer"
                  defaultValue=""
                >
                  <option value="" disabled>
                    -- Seleccionar sector base para posicionar en el mapa --
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
              </div>

              {/* Estado de Actividad */}
              <div className="flex items-center gap-3 pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-white/20 bg-slate-950 text-sky-500 focus:ring-sky-400 w-4 h-4 cursor-pointer"
                  />
                  <span>Repartidor Activo en la Flota (Visible)</span>
                </label>
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
                form="edit-rider-form"
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-sky-400 to-cyan-400 hover:brightness-110 shadow-lg shadow-sky-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
