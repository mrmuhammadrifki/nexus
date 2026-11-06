import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SWRegister } from "@/components/sw-register";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-jakarta", display: "swap" });

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
    <html lang="id" className={jakarta.variable}>
      <head><noscript><style>{".reveal{opacity:1!important;transform:none!important}"}</style></noscript></head>
      <body>
        {children}
        <SWRegister />
      </body>
    </html>
  );
}
