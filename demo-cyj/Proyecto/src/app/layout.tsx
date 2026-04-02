import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Asesorías Integrales CYJ – Sistema de Gestión",
  description: "Sistema integral de administración de propiedades. Gestión de condominios, residentes, órdenes de trabajo, personal y finanzas.",
  keywords: ["Asesorías Integrales CYJ", "Administración", "Gestión", "Condominio", "Propiedades", "CYJ"],
  authors: [{ name: "Asesorías Integrales CYJ" }],
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
