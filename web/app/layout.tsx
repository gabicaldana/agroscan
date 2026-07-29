import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { BarraInferior } from "@/components/BarraInferior";
import { CabecalhoApp } from "@/components/CabecalhoApp";
import { RegistroServiceWorker } from "@/components/RegistroServiceWorker";

// Auto-hospedada pelo next/font: nao depende de rede para renderizar,
// o que importa num app que precisa abrir offline.
const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AgroScan - diagnóstico de doenças em plantas",
  description:
    "Identifique doenças em culturas agrícolas pela câmera do celular, em campo e offline.",
  applicationName: "AgroScan",
  appleWebApp: {
    capable: true,
    title: "AgroScan",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#15803d",
  width: "device-width",
  initialScale: 1,
  // Deixa o conteúdo ir até as bordas em celulares com notch.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${plex.variable} h-full antialiased`}>
      <body className="bg-fundo text-texto flex min-h-full flex-col">
        <RegistroServiceWorker />
        <CabecalhoApp />
        <main className="flex-1 pb-[calc(var(--spacing-toque)+env(safe-area-inset-bottom))]">
          {children}
        </main>
        <BarraInferior />
      </body>
    </html>
  );
}
