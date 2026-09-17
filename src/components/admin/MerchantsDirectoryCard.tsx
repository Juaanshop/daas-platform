"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Store,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  Plus,
  Search,
  Eye,
  EyeOff,
  Trash2,
  Filter,
  Pencil,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GeofenceService } from "@/services/geofence";
import { DeleteConfirmModal } from "./DeleteConfirmModal";

export interface Merchant {
  id: string;
  businessName: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  balance: number;
  isActive?: boolean;
  user: {
    name: string;
    email: string;
  };
  orders?: any[];
}

interface MerchantsDirectoryCardProps {
  merchants: Merchant[];
  onOpenCreateModal: () => void;
  onEditMerchant?: (merchant: Merchant) => void;
  onToggleActive?: (merchantId: string, currentActive: boolean) => Promise<void>;
  onDeleteMerchant?: (merchantId: string) => Promise<void>;
}

export function MerchantsDirectoryCard({
  merchants,
  onOpenCreateModal,
  onEditMerchant,
  onToggleActive,
  onDeleteMerchant,
}: MerchantsDirectoryCardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showInactive, setShowInactive] = useState(true);
  const [merchantToDelete, setMerchantToDelete] = useState<Merchant | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredMerchants = merchants.filter((m) => {
    const isActive = m.isActive !== false;
    if (!showInactive && !isActive) return false;

    const term = searchTerm.toLowerCase();
    return (
      m.businessName.toLowerCase().includes(term) ||
      m.address.toLowerCase().includes(term) ||
      m.user.name.toLowerCase().includes(term) ||
      m.phone.includes(term)
    );
  });

  const activeCount = merchants.filter((m) => m.isActive !== false).length;
  const inactiveCount = merchants.length - activeCount;

  const handleConfirmDelete = async () => {
    if (!merchantToDelete || !onDeleteMerchant) return;
    try {
      setIsDeleting(true);
      await onDeleteMerchant(merchantToDelete.id);
      setMerchantToDelete(null);
    } catch (err: any) {
      alert(`Error al eliminar: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="surface-card rounded-3xl p-6 border border-white/10 shadow-2xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/[0.08]">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-400" />
            Directorio de Comercios y Clientes B2B
          </h3>
          <p className="text-xs text-slate-400">
            Comercios afiliados en Valencia, Naguanagua y San Diego con retiro programado.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="success">
            {activeCount} Activos
          </Badge>
          {inactiveCount > 0 && (
            <Badge variant="outline" className="text-amber-300 border-amber-500/30">
              {inactiveCount} Ocultos
            </Badge>
          )}

          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:brightness-110 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar Cliente</span>
          </button>
        </div>
      </div>

      {/* Controles de Búsqueda y Filtro de Visibilidad */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar comercio por nombre, sector o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Toggle para mostrar/ocultar inactivos */}
        <button
          type="button"
          onClick={() => setShowInactive(!showInactive)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
            showInactive
              ? "bg-slate-900 text-slate-200 border-white/20"
              : "bg-slate-950 text-slate-500 border-white/5 hover:text-slate-300"
          }`}
        >
          <Filter className="w-3.5 h-3.5 text-emerald-400" />
          <span>{showInactive ? "Mostrando Ocultos" : "Solo Activos"}</span>
        </button>
      </div>

      {/* Grid de Comercios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMerchants.map((merchant) => {
          const isActive = merchant.isActive !== false;
          const nearestSector = GeofenceService.findNearestSector(
            merchant.latitude,
            merchant.longitude
          );
          const municipality = GeofenceService.detectMunicipality(
            merchant.latitude,
            merchant.longitude
          );

          return (
            <motion.div
              key={merchant.id}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                isActive
                  ? "bg-slate-950/60 border-emerald-500/20 shadow-lg shadow-emerald-500/5"
                  : "bg-slate-950/40 border-amber-500/20 opacity-75 grayscale-[20%]"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isActive
                          ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                          : "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                      }`}
                    >
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight flex items-center gap-1.5">
                        {merchant.businessName}
                        {!isActive && (
                          <span className="text-[10px] font-semibold text-amber-400 font-mono">
                            (Oculto)
                          </span>
                        )}
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        {merchant.user.name}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shrink-0">
                    {municipality || "Carabobo"}
                  </span>
                </div>

                <div className="text-xs text-slate-400 space-y-1 my-2">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{merchant.address}</span>
                  </div>
                  {nearestSector && (
                    <div className="text-[11px] text-cyan-400 font-medium pl-5">
                      Sector: {nearestSector.name}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 pt-1">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{merchant.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{merchant.user.email}</span>
                  </div>
                </div>
              </div>

              {/* Barra inferior: Saldo y Botones de Acción (Ocultar / Eliminar) */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Saldo:
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    ${(merchant.balance || 0).toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {/* Botón Editar Información */}
                  {onEditMerchant && (
                    <button
                      type="button"
                      onClick={() => onEditMerchant(merchant)}
                      title="Editar información del comercio"
                      className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-emerald-300 hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Botón Ocultar / Mostrar */}
                  {onToggleActive && (
                    <button
                      type="button"
                      onClick={() => onToggleActive(merchant.id, isActive)}
                      title={isActive ? "Ocultar / Pausar comercio" : "Reactivar comercio"}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        isActive
                          ? "text-slate-400 border-white/10 hover:text-amber-300 hover:border-amber-500/40 hover:bg-amber-500/10"
                          : "text-amber-400 border-amber-500/30 bg-amber-500/10 hover:text-emerald-300 hover:border-emerald-500/40"
                      }`}
                    >
                      {isActive ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}

                  {/* Botón Eliminar */}
                  {onDeleteMerchant && (
                    <button
                      type="button"
                      onClick={() => setMerchantToDelete(merchant)}
                      title="Eliminar comercio"
                      className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {filteredMerchants.length === 0 && (
          <div className="col-span-full py-8 text-center text-xs text-slate-500">
            No se encontraron comercios que coincidan con la búsqueda o filtro activo.
          </div>
        )}
      </div>

      {/* Modal de Confirmación de Eliminación */}
      <DeleteConfirmModal
        isOpen={Boolean(merchantToDelete)}
        onClose={() => setMerchantToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Comercio"
        itemName={merchantToDelete?.businessName || ""}
        itemType="comercio"
        isLoading={isDeleting}
      />
    </div>
  );
}
