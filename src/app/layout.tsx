import type { Metadata, Viewport } from "next";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#080808",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Delivery Panel | Plataforma de Despacho",
  description:
    "Panel operativo de despachos y liquidaciones para delivery y comercios afiliados.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Delivery Panel",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#080808] text-[#F6F6F6] selection:bg-[#BBEB42]/30 selection:text-[#BBEB42]">
        <Navbar />
        <main className="w-full flex-1 flex flex-col">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
