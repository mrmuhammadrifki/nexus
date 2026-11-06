"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import { FIELDS } from "@/lib/catalog";
import { BackLink, Icon } from "./ui";

type Role = { slug: string; name: string; fields: string[]; fit: number; matched: string[]; missing: string[]; tags: string[]; skills: string[] };

/** Halaman "Semua peran": cari + filter per bidang; memilih langsung tersimpan sebagai peran target. */
export function RolesBrowser() {
  const [roles, setRoles] = useState<Role[] | null>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [field, setField] = useState("Semua");
  const [q, setQ] = useState("");
  const [state, setState] = useState<"" | "saving" | "saved" | "error">("");

  useEffect(() => { api("/api/roles").then((d) => { setRoles(d.roles); setCurrent(d.current); }).catch((e) => setErr(e.message)); }, []);

  const list = useMemo(() => {
    const k = q.trim().toLowerCase();
    return (roles ?? []).filter((r) => (field === "Semua" || r.fields.includes(field)) && (!k || r.name.toLowerCase().includes(k) || r.skills.some((s) => s.toLowerCase().includes(k)) || r.fields.some((f) => f.toLowerCase().includes(k))));
  }, [roles, field, q]);

  async function pick(slug: string) {
    const prev = current; setCurrent(slug); setState("saving");
    try { await api("/api/profile", { method: "PUT", json: { targetRole: slug } }); setState("saved"); } catch { setCurrent(prev); setState("error"); }
  }

  if (err) return <div className="card flex flex-col gap-3 items-start"><p className="m-0">{err}</p><Link href="/know" className="btn-primary">Ke KNOW</Link></div>;
  if (!roles) return <p role="status" className="text-ink-2">Memuat…</p>;

  return (
    <>
      <div className="flex flex-col gap-2 max-w-[760px]">
        <BackLink href="/know?step=4">Kembali ke KNOW</BackLink>
        <h1 className="m-0 text-[28px] sm:text-4xl leading-[1.15] font-extrabold tracking-[-0.025em]">Semua peran target</h1>
        <p className="m-0 text-base leading-relaxed text-ink-2">Pilih peran yang paling kamu tuju, walau kecocokannya belum tinggi. Gap skill-nya nanti kamu kejar di GROW.</p>
      </div>

      <section className="card p-5 sm:p-7 flex flex-col gap-5" aria-label="Daftar peran">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <input className="input pl-10" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari peran, skill, atau bidang, mis. “data” atau “Kesehatan”" aria-label="Cari peran" />
        </div>
        <div role="group" aria-label="Filter bidang" className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {["Semua", ...FIELDS.map((f) => f.name)].map((t) => (
            <button key={t} type="button" aria-pressed={field === t} onClick={() => setField(t)} className={`flex-none h-11 px-4 rounded-full border-[1.5px] text-sm cursor-pointer whitespace-nowrap ${field === t ? "border-primary bg-primary text-white font-semibold" : "border-line-2 bg-white font-medium"}`}>{t}</button>
          ))}
        </div>
        <div className="flex items-center justify-between text-sm text-ink-3" aria-live="polite">
          <span>{list.length} peran{field !== "Semua" && ` · ${field}`} · urut dari yang paling cocok</span>
          <span>{state === "saving" ? "menyimpan…" : state === "saved" ? "tersimpan" : state === "error" ? "gagal menyimpan" : ""}</span>
        </div>
        {list.length === 0 ? <p className="m-0 text-ink-2 py-6 text-center">Tidak ada peran yang cocok dengan “{q}”. Coba kata lain atau pilih “Semua”.</p> : (
          <div role="radiogroup" aria-label="Peran target" className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3">
            {list.map((r) => {
              const on = r.slug === current;
              return (
                <button key={r.slug} type="button" role="radio" aria-checked={on} onClick={() => pick(r.slug)} className={`text-left p-4 rounded-2xl border-2 cursor-pointer flex flex-col gap-1.5 ${on ? "border-[#2563EB] bg-know-tint" : "border-line bg-white"}`}>
                  <span className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-[15px] font-bold">{on && <Icon name="check" size={16} sw={2.6} className="text-know-fg" />}{r.name}</span>
                    <span className="text-xs font-bold text-know-fg whitespace-nowrap">{r.fit}% cocok</span>
                  </span>
                  <span className="text-xs text-ink-3">{r.fields.join(" · ")}</span>
                  <span className="text-xs text-ink-2 leading-snug">
                    {r.matched.length > 0 ? <>Skill kamu cocok: {r.matched.join(", ")}.</> : <>Belum ada skill yang cocok.</>}
                    {r.missing.length > 0 && <> Perlu dikejar: {r.missing.join(", ")}.</>}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        <div className="flex justify-end pt-4 border-t border-[#EEF0F6]"><Link href="/know?step=4" className="btn-primary">Selesai pilih <Icon name="arrow" size={18} sw={2.2} /></Link></div>
      </section>
    </>
  );
}
