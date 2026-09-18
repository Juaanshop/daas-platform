"use client";

import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();

  // Ocultar footer en el panel operativo de delivery, enlaces de comercio y login
  if (
    pathname.startsWith("/app") ||
    pathname.startsWith("/m/") ||
    pathname === "/login"
  ) {
    return null;
  }

  return (
    <footer className="border-t border-white/5 py-6 text-center text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Plataforma Delivery v1.0.0</span>
        </div>
        <div>
          <span>Valencia &bull; Naguanagua &bull; San Diego</span>
        </div>
      </div>
    </footer>
  );
}
