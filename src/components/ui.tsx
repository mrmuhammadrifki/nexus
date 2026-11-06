import type { ReactNode } from "react";
import Link from "next/link";

export const STEPS = [
  { key: "KNOW", n: "01", href: "/know", fg: "text-know-fg", tint: "bg-know-tint", name: "Profil potensi", icon: "compass" },
  { key: "GROW", n: "02", href: "/grow", fg: "text-grow-fg", tint: "bg-grow-tint", name: "Prioritas belajar", icon: "trend" },
  { key: "CONNECT", n: "03", href: "/connect", fg: "text-connect-fg", tint: "bg-connect-tint", name: "Tim lintas skill", icon: "users" },
  { key: "CREATE", n: "04", href: "/create", fg: "text-create-fg", tint: "bg-create-tint", name: "Kanvas proyek", icon: "bulb" },
  { key: "IMPACT", n: "05", href: "/impact", fg: "text-impact-fg", tint: "bg-impact-tint", name: "Skor kesiapan", icon: "target" },
] as const;

export function Logo({ size = 30, animated = false }: { size?: number; animated?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={animated ? "logo-anim" : undefined}>
      <g stroke="#B8C2DE" strokeWidth="1.5">
        <line x1="16" y1="16" x2="16" y2="5" /><line x1="16" y1="16" x2="26.5" y2="12.6" /><line x1="16" y1="16" x2="22.5" y2="24.9" />
        <line x1="16" y1="16" x2="9.5" y2="24.9" /><line x1="16" y1="16" x2="5.5" y2="12.6" />
      </g>
      <circle cx="16" cy="16" r="4.5" fill="#2450E6" /><circle cx="16" cy="5" r="3" fill="#3B82F6" /><circle cx="26.5" cy="12.6" r="3" fill="#22C55E" />
      <circle cx="22.5" cy="24.9" r="3" fill="#14B8A6" /><circle cx="9.5" cy="24.9" r="3" fill="#8B5CF6" /><circle cx="5.5" cy="12.6" r="3" fill="#F59E0B" />
    </svg>
  );
}

const P: Record<string, ReactNode> = {
  compass: <><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" /></>,
  trend: <><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></>,
  users: <><path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20" /><circle cx="10" cy="8" r="3.5" /><path d="M20 20v-1.5a3.5 3.5 0 0 0-2.5-3.35" /><path d="M15.5 4.65a3.5 3.5 0 0 1 0 6.7" /></>,
  bulb: <><path d="M9 18h6" /><path d="M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
  arrow: <><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  spark: <><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z" /><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" /></>,
  bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  bolt: <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />,
  home: <><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 4.9.7c0 1.7-2.4 2.3-2.4 3.8" /><path d="M12 17h.01" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  cog: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
};
export function Icon({ name, size = 20, sw = 2, className }: { name: keyof typeof P | string; size?: number; sw?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      {P[name]}
    </svg>
  );
}

export function DoneDot({ size = 24, label }: { size?: number; label?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <circle cx="12" cy="12" r="11" fill="#15803D" /><path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function ActiveDot({ color = "#7C3AED", size = 24 }: { color?: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth="2" /><circle cx="12" cy="12" r="4" fill={color} /></svg>;
}
export function EmptyDot({ size = 24 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="#C3C9DA" strokeWidth="2" /></svg>;
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const palette = [["#EEF2FF", "#2450E6"], ["#FCE7F3", "#BE185D"], ["#FFF4E0", "#B45309"], ["#E8F7EE", "#15803D"], ["#E4F6F8", "#0F766E"], ["#F1EBFF", "#6D28D9"]];
  const i = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length;
  return (
    <div className="grid place-items-center rounded-full font-bold flex-none" style={{ width: size, height: size, background: palette[i][0], color: palette[i][1], fontSize: size * 0.38 }}>
      {(name.trim()[0] || "?").toUpperCase()}
    </div>
  );
}

/** Tautan kembali di atas judul step. */
export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="self-start inline-flex items-center gap-1.5 min-h-11 -my-2 text-sm font-semibold text-ink-2 hover:text-primary">
      <Icon name="arrow" size={16} className="rotate-180" />{children}
    </Link>
  );
}

/** Bar progres + persentase, dengan label untuk pembaca layar. */
export function Progress({ pct, label, color = "bg-primary" }: { pct: number; label: string; color?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-[#EEF0F6]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className={`h-2 rounded-full transition-[width] duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-bold tabular-nums w-11 text-right">{pct}%</span>
    </div>
  );
}

export function AiNote() {
  return <span className="text-xs text-ink-2">Saran AI bisa keliru. Keputusan akhir tetap di kamu.</span>;
}

export function Pill({ children, tone = "gray" }: { children: ReactNode; tone?: "gray" | "green" | "violet" | "blue" | "amber" | "teal" }) {
  const t = { gray: "bg-[#F2F4F8] text-ink-2", green: "bg-grow-tint text-grow-fg", violet: "bg-create-tint text-create-fg", blue: "bg-know-tint text-know-fg", amber: "bg-impact-tint text-impact-fg", teal: "bg-connect-tint text-connect-fg" }[tone];
  return <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full ${t}`}>{children}</span>;
}

/** Kartu "Lanjut kepake di …" */
export function Bridge({ tone, children }: { tone: "green" | "teal" | "violet" | "amber"; children: ReactNode }) {
  const t = { green: "bg-[#F0F6EF] border-[#CFE8D6] text-[#14532D]", teal: "bg-[#EAF7F8] border-[#C4E8EC] text-[#134E4A]", violet: "bg-[#F5F1FF] border-[#E3D8FF] text-[#3B1A78]", amber: "bg-[#FFF8EC] border-[#F5DFB8] text-[#7C2D12]" }[tone];
  return (
    <div className={`border rounded-2xl p-[18px] flex gap-3 ${t}`}>
      <Icon name="arrow" className="flex-none mt-0.5" />
      <p className="m-0 text-sm leading-relaxed">{children}</p>
    </div>
  );
}
