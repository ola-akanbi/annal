import type { Metadata, Viewport } from "next";
import { Archivo, Doto, Martian_Mono } from "next/font/google";
import { Providers } from "@/components/motion";
import { AppToaster } from "@/components/toaster";
import site from "@/lib/site.json";
import "./globals.css";
import "./landing.css";
import "./book.css";

// Archivo reads; its expanded width sets the total the way a register prints a double-width total.
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

// Doto is the register's print head: every amount, total and line number is set in dots, and the
// ROND axis lets the dots settle from square to round as a figure prints.
const doto = Doto({
  subsets: ["latin"],
  axes: ["ROND"],
  weight: "variable",
  variable: "--font-doto",
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
    <html lang="en" className={`${archivo.variable} ${martian.variable} ${doto.variable}`}>
      <body>
        <Providers>{children}</Providers>
        <AppToaster />
      </body>
    </html>
  );
}
