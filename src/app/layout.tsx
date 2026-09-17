import type { Metadata } from "next";
import { Navbar } from "@/components/shared/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "DaaS Flash | Plataforma B2B Delivery-as-a-Service",
  description:
    "Plataforma B2B on-demand para coordinar despachos locales entre comercios gastronómicos y una flota de repartidores.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#090d16] text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-300">
        <Navbar />
        <main className="max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 flex-1">
          {children}
        </main>
        <footer className="border-t border-white/5 py-6 text-center text-xs text-slate-400">
          <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>DaaS Flash Engine v1.0.0 (B2B MVP)</span>
            </div>
            <div>
              <span>Tarifación: Tarifa base variable desde $2.00 + $0.50/km adicional</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
