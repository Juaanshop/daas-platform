import { redirect } from "next/navigation";
import { getCurrentDeliveryUser } from "@/lib/auth";
import Link from "next/link";
import { Bike, Store, Package, LogOut, DollarSign } from "lucide-react";
import { MobileBottomNav } from "@/components/delivery/MobileBottomNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentDeliveryUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#080808] text-[#F6F6F6] flex flex-col selection:bg-[#BBEB42]/30 selection:text-[#BBEB42]">
      {/* Top Navbar con protección Safe Area para notch/isla dinámica de iPhone */}
      <header className="sticky top-0 z-40 bg-[#080808]/95 backdrop-blur-xl border-b border-[#282828] px-3.5 sm:px-6 lg:px-8 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-2.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Brand & Driver Status */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-[#282828] shadow-md shadow-[#BBEB42]/15 shrink-0 bg-[#101010]">
              <img
                src="/avatar.png"
                alt="Juan Romero"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-white block text-xs sm:text-sm truncate">
                  Panel Delivery
                </span>
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#BBEB42] bg-[#BBEB42]/10 px-1.5 py-0.5 rounded-full border border-[#BBEB42]/25 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#BBEB42] animate-pulse" />
                  <span>En Línea</span>
                </span>
              </div>
              <span className="text-[11px] sm:text-xs text-[#B0B0B0] block font-medium truncate">
                {user.name} &bull; <span className="text-[#BBEB42]/90">{user.phone}</span>
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links (hidden on mobile, replaced by MobileBottomNav) */}
          <nav className="hidden md:flex items-center gap-2 lg:gap-3">
            <Link
              href="/app"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#A0A0A0] hover:text-white hover:bg-[#191919] hover:border hover:border-[#282828] transition-all"
            >
              <Package className="w-4 h-4" />
              <span>Resumen</span>
            </Link>

            <Link
              href="/app/orders"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#A0A0A0] hover:text-white hover:bg-[#191919] hover:border hover:border-[#282828] transition-all"
            >
              <Bike className="w-4 h-4" />
              <span>Despachos</span>
            </Link>

            <Link
              href="/app/merchants"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#A0A0A0] hover:text-white hover:bg-[#191919] hover:border hover:border-[#282828] transition-all"
            >
              <Store className="w-4 h-4" />
              <span>Comercios & Links</span>
            </Link>

            <Link
              href="/app/settlements"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#A0A0A0] hover:text-white hover:bg-[#191919] hover:border hover:border-[#282828] transition-all"
            >
              <DollarSign className="w-4 h-4 text-[#BBEB42]" />
              <span>Liquidación</span>
            </Link>
          </nav>

          {/* Action Right: Logout */}
          <div className="flex items-center shrink-0">
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all cursor-pointer"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline font-semibold">Salir</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content Area con padding inferior seguro para MobileBottomNav */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 pb-safe-nav md:pb-8">
        {children}
      </main>

      {/* Fixed Bottom Navigation for Mobile Devices */}
      <MobileBottomNav />
    </div>
  );
}
