import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AulaLink - Plataforma Educativa",
  description: "Plataforma educativa interactiva, accesible y optimizada para bajo consumo de datos.",
  icons: {
    icon: { url: "/AulaLink.png", type: "image/png" },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${inter.variable} h-full antialiased overflow-x-hidden`}
    >
      <body className="min-h-[100dvh] w-full flex flex-col overflow-x-hidden bg-slate-50 text-slate-800 font-sans selection:bg-indigo-500 selection:text-white">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
