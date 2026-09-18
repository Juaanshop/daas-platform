"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bike, Store, DollarSign } from "lucide-react";

export function MobileBottomNav() {
  const pathname = usePathname();
  const [activeCount, setActiveCount] = useState<number>(0);

  // Cargar pedidos activos para el badge numérico
  useEffect(() => {
    let isMounted = true;
    async function loadActiveCount() {
      try {
        const res = await fetch("/api/delivery/orders?status=active");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            const count = (data.orders || []).filter(
              (o: any) =>
                o.status === "DRAFT_SUBMITTED" ||
                o.status === "CONFIRMED_PICKUP" ||
                o.status === "IN_TRANSIT"
            ).length;
            setActiveCount(count);
          }
        }
      } catch (err) {
        // Silencioso en fondo
      }
    }

    loadActiveCount();
    const interval = setInterval(loadActiveCount, 15000); // Polling suave cada 15s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [pathname]);

  const navItems = [
    {
      href: "/app",
      label: "Inicio",
      icon: Home,
      exact: true,
    },
    {
      href: "/app/orders",
      label: "Despachos",
      icon: Bike,
      badge: activeCount > 0 ? activeCount : null,
    },
    {
      href: "/app/merchants",
      label: "Comercios",
      icon: Store,
    },
    {
      href: "/app/settlements",
      label: "Cierre",
      icon: DollarSign,
    },
  ];

  const handleTouch = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(15);
    }
  };

  return (
    <nav
      aria-label="Navegación Móvil Principal"
      className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-8px_24px_rgba(0,0,0,0.6)]"
    >
      <div className="grid grid-cols-4 h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleTouch}
              className={`relative flex flex-col items-center justify-center gap-1 transition-all select-none touch-manipulation cursor-pointer ${
                isActive
                  ? "text-amber-400 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {/* Active Indicator Top Light Bar */}
              {isActive && (
                <span className="absolute top-0 inset-x-5 h-0.5 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? "scale-110 text-amber-400" : "text-slate-400"
                  }`}
                />

                {/* Badge de Despachos Activos */}
                {item.badge !== null && item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-[10px] rounded-full flex items-center justify-center shadow-md animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[11px] tracking-tight ${
                  isActive ? "text-white font-bold" : "font-medium"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
