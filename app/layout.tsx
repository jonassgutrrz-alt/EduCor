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
  metadataBase: new URL("https://www.aulalink.net"),
  title: "AulaLink - Plataforma Educativa",
  description:
    "Plataforma educativa interactiva, accesible y optimizada para bajo consumo de datos.",
  manifest: "/manifest.json",
  icons: {
    icon: { url: "/AulaLink.png", type: "image/png" },
    apple: { url: "/AulaLink.png", type: "image/png" },
  },
  alternates: {
    canonical: "https://www.aulalink.net",
  },
  verification: {
    google: "PEGA_AQUI_EL_CODIGO_DE_VERIFICACION_DE_GOOGLE",
  },
  openGraph: {
    title: "AulaLink - Plataforma Educativa",
    description:
      "Plataforma educativa interactiva optimizada para bajo consumo de datos.",
    url: "https://www.aulalink.net",
    siteName: "AulaLink",
    images: [
      {
        url: "/AulaLink.png",
        width: 1200,
        height: 630,
        alt: "AulaLink Logo",
      },
    ],
    locale: "es_AR",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#4f46e5",
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