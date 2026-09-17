"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  Zap,
  Store,
  ShieldAlert,
  Bike,
  DollarSign,
  ArrowRight,
  Sparkles,
  Layers,
  Database,
  Radio,
  Clock,
  Compass,
  CheckCircle2,
} from "lucide-react";
import { PricingService } from "@/services/pricing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function HomePage() {
  // Mini playground de pricing en el home
  const [distanceInput, setDistanceInput] = useState<number>(3.5);
  const [baseFeeInput, setBaseFeeInput] = useState<number>(2.0);

  // Origen El Viñedo (Valencia: 10.2135, -68.0062), Destino hacia Mañongo (Naguanagua)
  const quote = PricingService.calculateQuote({
    origin: [10.2135, -68.0062],
    destination: [10.2135 + distanceInput * 0.009, -68.0062],
    baseFee: baseFeeInput,
  });

  const roles = [
    {
      title: "Portal Comercio",
      role: "MERCHANT",
      href: "/merchant",
      icon: Store,
      badge: "Gastronomía",
      color: "from-emerald-500/10 via-slate-900/40 to-teal-500/5",
      border: "border-emerald-500/20 hover:border-emerald-500/50",
      accent: "text-emerald-400",
      buttonVariant: "primary" as const,
      description:
        "Solicita repartidores al instante con cotización automática Haversine, geocerca conurbada y monitor de despachos.",
      actionText: "Entrar como Comercio",
    },
    {
      title: "Backoffice & Despacho",
      role: "ADMIN",
      href: "/admin",
      icon: ShieldAlert,
      badge: "Torre de Control",
      color: "from-indigo-500/10 via-slate-900/40 to-sky-500/5",
      border: "border-indigo-500/20 hover:border-indigo-500/50",
      accent: "text-indigo-400",
      buttonVariant: "secondary" as const,
      description:
        "Visualiza la demanda en tiempo real, monitorea la disponibilidad de la flota y asigna órdenes con un solo clic.",
      actionText: "Entrar al Backoffice",
    },
    {
      title: "PWA Repartidor",
      role: "RIDER",
      href: "/rider",
      icon: Bike,
      badge: "App Móvil",
      color: "from-sky-500/10 via-slate-900/40 to-cyan-500/5",
      border: "border-sky-500/20 hover:border-sky-500/50",
      accent: "text-sky-400",
      buttonVariant: "cyber" as const,
      description:
        "Interfaz táctil optimizada para celular: pedidos asignados, retiro guiado en comercio y confirmación de entrega.",
      actionText: "Entrar como Repartidor",
    },
    {
      title: "Corte de Caja Diario",
      role: "FINANCE",
      href: "/settlements",
      icon: DollarSign,
      badge: "Liquidaciones",
      color: "from-teal-500/10 via-slate-900/40 to-emerald-500/5",
      border: "border-teal-500/20 hover:border-teal-500/50",
      accent: "text-teal-400",
      buttonVariant: "outline" as const,
      description:
        "Conciliación financiera automática del día: cobros por comercio, dispersión a riders y comisiones de plataforma.",
      actionText: "Ver Liquidaciones",
    },
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section with Framer Motion entrance */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative pt-6 pb-12 text-center space-y-6 max-w-4xl mx-auto"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
          <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>Plataforma SaaS B2B • Cobertura Exclusiva Valencia & Naguanagua (Carabobo)</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
          Coordinación de despachos{" "}
          <span className="text-gradient-brand">
            on-demand
          </span>{" "}
          para gastronomía
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
          Conecta restaurantes y comercios con una flota local de repartidores en <b>Valencia, Naguanagua y San Diego</b>. Cotización instantánea por distancia vial o Haversine, geocercas activas y sincronización en tiempo real vía SSE.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link href="/merchant">
            <Button size="lg" variant="primary" className="shadow-emerald-500/25">
              <Store className="w-5 h-5" />
              <span>Probar Despacho (Comercio)</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>

          <Link href="/admin">
            <Button size="lg" variant="secondary">
              <ShieldAlert className="w-5 h-5 text-indigo-400" />
              <span>Torre de Control (Admin)</span>
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Role Cards Grid with Stagger Animation */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Portales de la Plataforma
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Selecciona el entorno operativo que deseas explorar:
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {roles.map((r) => {
            const Icon = r.icon;
            return (
              <motion.div
                key={r.href}
                variants={itemVariants}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <div
                  className={`surface-card rounded-2xl p-6 border ${r.border} bg-gradient-to-b ${r.color} flex flex-col justify-between h-full space-y-5 transition-all shadow-xl`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-12 h-12 rounded-2xl bg-slate-950/80 border border-white/10 flex items-center justify-center shadow-inner ${r.accent}`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <Badge variant="outline" className="text-[10px] font-bold uppercase">
                        {r.badge}
                      </Badge>
                    </div>

                    <h3 className="text-lg font-bold text-white tracking-tight">{r.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {r.description}
                    </p>
                  </div>

                  <Link href={r.href} className="w-full">
                    <Button variant={r.buttonVariant} size="sm" className="w-full">
                      <span>{r.actionText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Pricing Engine Interactive Playground */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="surface-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden"
      >
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 mb-1">
                <Compass className="w-4 h-4" /> Pricing Engine Desacoplado
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight">
                Simulador Interactivo de Tarifas
              </h3>
              <p className="text-xs text-slate-400">
                Regla: Tarifa base variable desde $2.00 (cubre primeros 2.0 km) + $0.50 por km adicional.
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block font-semibold">
                Tarifa Cotizada
              </span>
              <span className="text-3xl sm:text-4xl font-black text-emerald-400 tabular-nums">
                ${quote.totalCost.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Selector de Tarifa Base Variable */}
          <div className="space-y-2 p-4 rounded-2xl bg-slate-950/60 border border-white/5">
            <div className="flex justify-between items-center text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1 text-emerald-400">
                <DollarSign className="w-3.5 h-3.5" />
                Tarifa Base Variable: ${baseFeeInput.toFixed(2)} (Mínimo $2.00 en adelante)
              </span>
              <Badge variant="info">
                {quote.isIntermunicipal ? "Intermunicipal auto: $2.50" : "Local Valencia: $2.00"}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {[
                { label: "$2.00 (Mínimo / Local)", val: 2.0 },
                { label: "$2.50 (Intermunicipal)", val: 2.5 },
                { label: "$3.00 (Prioritario)", val: 3.0 },
                { label: "$3.50 (Express / Lluvia)", val: 3.5 },
                { label: "$4.00 (Nocturno)", val: 4.0 },
              ].map((tier) => (
                <button
                  key={tier.val}
                  type="button"
                  onClick={() => setBaseFeeInput(tier.val)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    baseFeeInput === tier.val
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold shadow-md shadow-emerald-500/10 scale-[1.02]"
                      : "bg-slate-900/60 text-slate-400 border-white/5 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </div>

          {/* Slider de distancia */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-300">
              <span>Distancia ortodrómica: <b className="text-white">{quote.distanceKm} km</b></span>
              <span className="text-sky-400 flex items-center gap-1 font-semibold">
                <Clock className="w-3.5 h-3.5" /> Tiempo est.: ~
                {quote.estimatedMinutes} min
              </span>
            </div>

            <input
              type="range"
              min="0.5"
              max="15.0"
              step="0.5"
              value={distanceInput}
              onChange={(e) => setDistanceInput(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.5 km (Zona Centro)</span>
              <span>5.0 km</span>
              <span>10.0 km</span>
              <span>15.0 km (Periferia)</span>
            </div>
          </div>

          {/* Desglose de Cálculo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-center text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5">
              <span className="text-slate-400 block text-[11px]">Tarifa Base</span>
              <span className="font-bold text-emerald-400 text-sm">
                ${quote.baseFee.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {quote.isIntermunicipal ? "Intermunicipal (2 km)" : "Cubre primeros 2 km"}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5">
              <span className="text-slate-400 block text-[11px]">Recargo Km Extra</span>
              <span className="font-bold text-white text-sm">
                ${quote.extraKmFee.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {quote.distanceKm > 2
                  ? `${(quote.distanceKm - 2).toFixed(1)} km * $0.50`
                  : "0 km extra"}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <span className="text-emerald-400 block text-[11px] font-bold">
                Total para el Comercio
              </span>
              <span className="font-black text-emerald-300 text-base">
                ${quote.totalCost.toFixed(2)}
              </span>
              <span className="text-[10px] text-emerald-400/80 block">
                Repartidor percibe 80% (${(quote.totalCost * 0.8).toFixed(2)})
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tech Stack Specs */}
      <div className="border-t border-white/[0.08] pt-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-xs text-slate-400 text-center">
        <div>
          <div className="font-bold text-slate-200">Next.js 16 + App Router</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Turbopack & Server Handlers</p>
        </div>
        <div>
          <div className="font-bold text-slate-200">Prisma ORM & SQLite</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Modelos Relacionales Concurridos</p>
        </div>
        <div>
          <div className="font-bold text-slate-200">Geofencing & Pricing</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Valencia - Naguanagua Engine</p>
        </div>
        <div>
          <div className="font-bold text-slate-200">Server-Sent Events (SSE)</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Reactividad en vivo sin polling</p>
        </div>
      </div>
    </div>
  );
}
