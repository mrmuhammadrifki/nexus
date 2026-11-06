import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "NEXUS — From Future-Ready to Impact-Ready",
    short_name: "NEXUS",
    description: "Dari potensi jadi dampak: KNOW → GROW → CONNECT → CREATE → IMPACT.",
    lang: "id",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f8fc",
    theme_color: "#2450e6",
    categories: ["education", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Dashboard", url: "/dashboard" },
      { name: "Kanvas proyek", url: "/create" },
    ],
  };
}
