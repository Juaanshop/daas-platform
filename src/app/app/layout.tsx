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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-300">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-3.5 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Brand & Driver Status */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-orange-500/15 shrink-0">
              <Bike className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-white block text-sm sm:text-base truncate">
                  Panel Delivery
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>En Línea</span>
                </span>
              </div>
              <span className="text-xs text-amber-400 block font-medium truncate">
                {user.name} &bull; {user.phone}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links (hidden on mobile, replaced by MobileBottomNav) */}
          <nav className="hidden md:flex items-center gap-2 lg:gap-3">
            <Link
              href="/app"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
            >
              <Package className="w-4 h-4" />
              <span>Resumen</span>
            </Link>

            <Link
              href="/app/orders"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
            >
              <Bike className="w-4 h-4" />
              <span>Despachos</span>
            </Link>

            <Link
              href="/app/merchants"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
            >
              <Store className="w-4 h-4" />
              <span>Comercios & Links</span>
            </Link>

            <Link
              href="/app/settlements"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
            >
              <DollarSign className="w-4 h-4 text-emerald-400" />
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
