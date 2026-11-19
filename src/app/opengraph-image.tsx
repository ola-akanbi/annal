import { ImageResponse } from "next/og";
import site from "@/lib/site.json";

// The link preview on X, Discord and Telegram, and the gallery thumbnail.
// Once the signature component exists, draw it here too: one world on every surface.
export const alt = `${site.name}: ${site.thesis}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: site.themeColor,
          color: "#f5f5f4",
        }}
      >
        <div style={{ fontSize: 36, letterSpacing: 2 }}>{site.name.toUpperCase()}</div>
        <div style={{ fontSize: 64, lineHeight: 1.1, fontWeight: 600 }}>{site.thesis}</div>
      </div>
    ),
    size,
  );
}
