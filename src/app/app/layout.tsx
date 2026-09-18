import { redirect } from "next/navigation";
import { getCurrentDeliveryUser } from "@/lib/auth";
import Link from "next/link";
import { Bike, Store, Package, LogOut, DollarSign } from "lucide-react";

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-orange-500/10">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-white block text-sm sm:text-base">
                Panel Delivery
              </span>
              <span className="text-xs text-amber-400 block font-medium">
                {user.name} ({user.phone})
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/app"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
            >
              <Package className="w-4 h-4" />
              <span>Resumen</span>
            </Link>

            <Link
              href="/app/orders"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
            >
              <Bike className="w-4 h-4" />
              <span>Despachos</span>
            </Link>

            <Link
              href="/app/merchants"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
            >
              <Store className="w-4 h-4" />
              <span>Comercios & Links</span>
            </Link>

            <Link
              href="/app/settlements"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
            >
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Liquidación</span>
            </Link>

            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all cursor-pointer"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </form>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
