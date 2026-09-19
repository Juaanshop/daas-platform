"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bike, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Credenciales inválidas");
      }

      router.push("/app");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail("delivery@daas.com");
    setPassword("password123");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#101010] border border-[#282828] rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#BBEB42]/40 shadow-xl shadow-[#BBEB42]/20 mb-4 bg-[#191919]">
            <img
              src="/avatar.png"
              alt="Juan Romero"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Panel del Repartidor</h1>
          <p className="text-sm text-[#888888] mt-1">
            Acceso exclusivo para gestión de comercios afiliados y pedidos
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-400 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#D1D1D1] uppercase tracking-wider mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-[#888888]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@delivery.com"
                className="w-full bg-[#191919] border border-[#282828] rounded-xl pl-11 pr-4 py-3 text-white text-base sm:text-sm placeholder:text-[#5D5D5D] focus:outline-none focus:border-[#BBEB42] focus:ring-1 focus:ring-[#BBEB42] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#D1D1D1] uppercase tracking-wider mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-[#888888]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#191919] border border-[#282828] rounded-xl pl-11 pr-4 py-3 text-white text-base sm:text-sm placeholder:text-[#5D5D5D] focus:outline-none focus:border-[#BBEB42] focus:ring-1 focus:ring-[#BBEB42] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 min-h-[50px] bg-[#BBEB42] hover:bg-[#CDF561] text-[#080808] font-black py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-[#BBEB42]/15 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-[#080808] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Ingresar al Panel</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#282828] text-center">
          <p className="text-xs text-[#888888] mb-3">¿Probando el sistema por primera vez?</p>
          <button
            type="button"
            onClick={handleFillDemo}
            className="text-xs font-bold text-[#BBEB42] hover:text-[#CDF561] flex items-center justify-center gap-1.5 mx-auto py-1.5 px-3 rounded-lg bg-[#BBEB42]/10 border border-[#BBEB42]/25 hover:bg-[#BBEB42]/20 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Cargar credenciales de prueba (delivery@daas.com)
          </button>
        </div>
      </div>
    </div>
  );
}
