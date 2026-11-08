"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, DoneDot, ActiveDot, EmptyDot, Icon, Logo, STEPS } from "./ui";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "home", match: ["/dashboard"] },
  { href: "/know", label: "Perjalanan", icon: "compass", match: ["/know", "/grow", "/impact"] },
  { href: "/connect", label: "Tim", icon: "users", match: ["/connect"] },
  { href: "/create", label: "Proyek", icon: "bulb", match: ["/create"] },
];
const inGroup = (path: string, m: string[]) => m.some((x) => path === x || path.startsWith(x + "/"));

export function AppHeader({ name, major, invites }: { name: string; major: string; invites: number }) {
  const path = usePathname();
  return (
    <header className="bg-white border-b border-line">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 min-h-[68px] flex items-center justify-between gap-4">
        <div className="flex items-center gap-7">
          <Link href="/dashboard" prefetch={true} className="flex items-center gap-2.5" aria-label="NEXUS dashboard"><Logo /><span className="text-lg font-extrabold tracking-[0.06em]">NEXUS</span></Link>
          <nav aria-label="Menu aplikasi" className="hidden md:flex gap-1">
            {NAV.map((n) => {
              const on = inGroup(path, n.match);
              return <Link key={n.href} href={n.href} prefetch={true} aria-current={on ? "page" : undefined} className={`px-3.5 py-2.5 rounded-[10px] text-sm ${on ? "bg-primary-tint text-primary font-semibold" : "text-ink-2 font-medium"}`}>{n.label}</Link>;
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/connect#undangan" prefetch={true} aria-label={invites ? `${invites} undangan baru` : "Notifikasi"} className="relative w-11 h-11 rounded-xl border border-line bg-white text-ink-2 grid place-items-center">
            <Icon name="bell" />
            {invites > 0 && <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary text-white text-[11px] font-bold grid place-items-center">{invites}</span>}
          </Link>
          <Link href="/pengaturan" prefetch={true} className="flex items-center gap-2.5 py-1 pl-1 pr-3 rounded-full border border-line">
            <Avatar name={name} />
            <span className="sr-only">Pengaturan akun {name}</span>
            <div className="leading-tight hidden sm:block" aria-hidden="true"><div className="text-sm font-bold">{name.split(" ")[0]}</div><div className="text-xs text-ink-3 max-w-28 truncate">{major}</div></div>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function BottomNav() {
  const path = usePathname();
  return (
    <nav aria-label="Menu utama" className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-white border-t border-line grid grid-cols-4 pb-[env(safe-area-inset-bottom)]">
      {NAV.map((n) => {
        const on = inGroup(path, n.match);
        return (
          <Link key={n.href} href={n.href} prefetch={true} aria-current={on ? "page" : undefined} className={`flex flex-col items-center justify-center gap-0.5 min-h-14 text-[11px] font-semibold ${on ? "text-primary" : "text-ink-3"}`}>
            <Icon name={n.icon} size={22} />{n.label}
          </Link>
        );
      })}
    </nav>
  );
}

const ACTIVE_BG: Record<string, string> = { KNOW: "bg-know-tint", GROW: "bg-grow-tint", CONNECT: "bg-connect-tint", CREATE: "bg-create-tint", IMPACT: "bg-impact-tint" };
const ACTIVE_CLR: Record<string, string> = { KNOW: "#3B82F6", GROW: "#16A34A", CONNECT: "#0F766E", CREATE: "#7C3AED", IMPACT: "#D97706" };
const LABEL = { done: "Beres", active: "Lagi jalan", next: "Belum mulai" } as const;

export function Stepper({ steps }: { steps: { key: string; status: "done" | "active" | "next" }[] }) {
  const path = usePathname();
  if (!STEPS.some((s) => path.startsWith(s.href))) return null;
  return (
    <nav aria-label="Tahapan perjalanan" className="bg-white border-b border-line">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-3 flex gap-2 overflow-x-auto">
        {STEPS.map((s, i) => {
          const st = steps[i]?.status ?? "next";
          const cur = path.startsWith(s.href);
          return (
            <Link key={s.key} href={s.href} prefetch={true} aria-current={cur ? "step" : undefined} className={`flex-[1_0_160px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl ${cur ? ACTIVE_BG[s.key] : ""}`}>
              {st === "done" ? <DoneDot /> : st === "active" ? <ActiveDot color={ACTIVE_CLR[s.key]} /> : <EmptyDot />}
              <div><div className={`text-xs font-bold tracking-[0.06em] ${s.fg}`}>{s.n} {s.key}</div><div className="text-[13px] text-ink-2">{LABEL[st]}</div></div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
