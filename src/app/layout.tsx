import type { Metadata, Viewport } from "next";
import { Archivo, Martian_Mono } from "next/font/google";
import site from "@/lib/site.json";
import "./globals.css";

// Archivo reads; its expanded width sets the total the way a register prints a double-width total.
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

// Martian Mono only prints: hashes, addresses, small labels. Never running text.
const martian = Martian_Mono({
  subsets: ["latin"],
  variable: "--font-martian",
  display: "swap",
});

// Absolute URLs for the link-preview image: production, each Vercel preview, and locally.
const host =
  process.env.VERCEL_ENV === "production" ? process.env.VERCEL_PROJECT_PRODUCTION_URL : process.env.VERCEL_URL;
const origin = host ? `https://${host}` : `http://localhost:${process.env.PORT ?? 3000}`;

export const metadata: Metadata = {
  metadataBase: new URL(origin),
  title: `${site.name} · ${site.thesis}`,
  description: site.thesis,
  openGraph: { title: site.name, description: site.thesis, type: "website" },
  twitter: { card: "summary_large_image", title: site.name, description: site.thesis },
};

export const viewport: Viewport = { themeColor: site.themeColor };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${archivo.variable} ${martian.variable}`}>
      <body>{children}</body>
    </html>
  );
}
