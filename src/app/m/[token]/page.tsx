import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Store, Bike, MapPin, Phone } from "lucide-react";
import PublicOrderForm from "@/components/merchant/PublicOrderForm";

export const dynamic = "force-dynamic";

export default async function MerchantPublicPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!token) {
    notFound();
  }

  const merchant = await prisma.merchant.findUnique({
    where: { publicToken: token },
    include: {
      deliveryUser: {
        select: {
          name: true,
          phone: true,
        },
      },
    },
  });

  if (!merchant || !merchant.isActive) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] px-3 sm:px-6">
      <div className="w-full max-w-xl space-y-3.5">
        {/* Header Compacto con protección Safe Area para notch/isla dinámica */}
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between gap-3 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Store className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold text-white truncate">
                  {merchant.businessName}
                </h1>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-medium border border-emerald-500/20 shrink-0">
                  Activo
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {merchant.address}
              </p>
            </div>
          </div>

          {merchant.deliveryUser && (
            <div className="hidden xs:flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800/80 shrink-0">
              <Bike className="w-3.5 h-3.5 text-amber-400" />
              <span className="truncate max-w-[120px]">{merchant.deliveryUser.name}</span>
            </div>
          )}
        </div>

        {/* Wizard Form Interactivo */}
        <PublicOrderForm merchant={merchant} />
      </div>
    </div>
  );
}
