import type { MetadataRoute } from "next";

// Web App Manifest — makes Data Scanner CRM installable (PWA).
// Served by Next at /manifest.webmanifest and linked automatically.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Data Scanner CRM",
    short_name: "Data Scanner",
    description:
      "CRM de WhatsApp do Data Scanner: caixa de entrada, contatos, funis e disparos.",
    lang: "pt-BR",
    start_url: "/dashboard?source=pwa",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#020617",
    theme_color: "#020617",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Caixa de entrada", url: "/inbox", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Contatos", url: "/contacts", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
