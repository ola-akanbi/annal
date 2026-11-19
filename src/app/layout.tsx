import type { Metadata, Viewport } from "next";
import site from "@/lib/site.json";
import "./globals.css";

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
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
