import type { Metadata, Viewport } from "next";
import "@fontsource-variable/plus-jakarta-sans/wght.css"; // font di-host sendiri: build tidak bergantung jaringan ke Google
import "./globals.css";
import { SWRegister } from "@/components/sw-register";

export const metadata: Metadata = {
  title: { default: "NEXUS — Dari potensi jadi dampak", template: "%s · NEXUS" },
  description: "Kenali potensimu, upgrade skill, temukan partner, rancang solusi, dan cek kesiapan dampak proyekmu. Semua di satu tempat.",
  applicationName: "NEXUS",
  appleWebApp: { capable: true, title: "NEXUS", statusBarStyle: "default" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
};
export const viewport: Viewport = { themeColor: "#2450e6", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head><noscript><style>{".reveal{opacity:1!important;transform:none!important}"}</style></noscript></head>
      <body>
        {children}
        <SWRegister />
      </body>
    </html>
  );
}
