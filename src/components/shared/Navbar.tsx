"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Zap,
  Store,
  ShieldAlert,
  Bike,
  DollarSign,
  Radio,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  const pathname = usePathname();
  const [liveConnected, setLiveConnected] = useState(false);

  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource("/api/events");
      es.onopen = () => setLiveConnected(true);
      es.onerror = () => setLiveConnected(false);
    } catch {
      setLiveConnected(false);
    }

    return () => {
      es?.close();
    };
  }, []);

  const navItems = [
    {
      href: "/merchant",
      label: "Comercio",
      icon: Store,
      badge: "Despachar",
    },
    {
      href: "/admin",
      label: "Backoffice",
      icon: ShieldAlert,
      badge: "Despacho",
    },
    {
      href: "/rider",
      label: "Repartidores",
      icon: Bike,
      badge: "Récord Flota",
    },
    {
      href: "/settlements",
      label: "Liquidaciones",
      icon: DollarSign,
      badge: "Corte Diario",
    },
  ];

  return (
    <header className="sticky top-0 z-50 px-4 lg:px-8 py-3.5 backdrop-blur-xl bg-slate-950/70 border-b border-white/[0.08] shadow-2xl transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo with micro-interaction */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group transition-transform duration-200 hover:scale-[1.02]"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/25 ring-1 ring-white/30 group-hover:shadow-emerald-500/40 transition-all">
            <Zap className="w-5 h-5 text-slate-950 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                DaaS<span className="text-emerald-400">Flash</span>
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Valencia, Naguanagua & San Diego
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium leading-none">
              Carabobo On-Demand Dispatch
            </p>
          </div>
        </Link>

        {/* Center Nav with Framer Motion Sliding Pill */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-2xl bg-slate-900/80 border border-white/[0.08] shadow-inner">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors duration-200 z-10 ${
                  isActive ? "text-emerald-300" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-active-indicator"
                    className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 rounded-xl border border-emerald-500/30 shadow-sm"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon
                  className={`w-4 h-4 z-10 ${
                    isActive ? "text-emerald-400" : "text-slate-400"
                  }`}
                />
                <span className="z-10">{item.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 z-10 shadow-xs shadow-emerald-400 animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Status Indicator */}
        <div className="flex items-center gap-3">
          <Badge
            variant={liveConnected ? "success" : "default"}
            pulse={liveConnected}
            className="hidden sm:inline-flex"
          >
            {liveConnected ? "Live SSE Conectado" : "Conectando..."}
          </Badge>

          {/* Quick Home Link */}
          {pathname !== "/" && (
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white transition-colors px-2.5 py-1.5 rounded-lg border border-white/5 hover:bg-white/5"
            >
              Inicio
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
