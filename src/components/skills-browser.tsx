"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import { FIELDS, MAX_SKILLS, SKILLS, fieldsOfSkill } from "@/lib/catalog";
import { Icon } from "./ui";

/** Halaman "Semua skill": cari + filter per bidang. Pilihan langsung tersimpan ke profil. */
export function SkillsBrowser() {
  const [picked, setPicked] = useState<string[] | null>(null);
  const [myFields, setMyFields] = useState<string[]>([]);
  const [field, setField] = useState("Semua");
  const [q, setQ] = useState("");
  const [state, setState] = useState<"" | "saving" | "saved" | "error">("");
  const seq = useRef(0);

  useEffect(() => {
    api("/api/profile").then((d) => { setPicked((d.skills ?? []).map((s: any) => s.name)); setMyFields(d.interests ?? []); });
  }, []);

  const list = useMemo(() => {
    const base = field === "Semua" ? SKILLS : field === "Bidangku" ? SKILLS.filter((s) => fieldsOfSkill(s).some((f) => myFields.includes(f))) : FIELDS.find((f) => f.name === field)?.skills ?? [];
    const k = q.trim().toLowerCase();
    return k ? base.filter((s) => s.toLowerCase().includes(k) || fieldsOfSkill(s).some((f) => f.toLowerCase().includes(k))) : base;
  }, [field, q, myFields]);

  if (!picked) return <p role="status" className="text-ink-2">Memuat…</p>;
  const full = picked.length >= MAX_SKILLS;

  async function toggle(s: string) {
    const next = picked!.includes(s) ? picked!.filter((x) => x !== s) : [...picked!, s];
    setPicked(next); setState("saving");
    const my = ++seq.current;
    try { await api("/api/profile", { method: "PUT", json: { skillNames: next } }); if (my === seq.current) setState("saved"); }
    catch { if (my === seq.current) setState("error"); }
  }
  const tabs = ["Semua", ...(myFields.length ? ["Bidangku"] : []), ...FIELDS.map((f) => f.name)];

  return (
    <>
      <div className="flex flex-col gap-2 max-w-[760px]">
        <Link href="/know?step=1" className="text-sm font-semibold text-primary inline-flex items-center gap-1.5 self-start"><Icon name="arrow" size={16} className="rotate-180" />Kembali ke KNOW</Link>
        <h1 className="m-0 text-[28px] sm:text-4xl leading-[1.15] font-extrabold tracking-[-0.025em]">Semua skill</h1>
        <p className="m-0 text-base leading-relaxed text-ink-2">Cari skill atau saring per bidang. Pilihanmu langsung tersimpan.</p>
      </div>

      <section className="card p-5 sm:p-7 flex flex-col gap-5" aria-label="Daftar skill">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <input className="input pl-10" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari skill atau bidang, mis. “desain” atau “Kesehatan”" aria-label="Cari skill" />
        </div>
        <div role="group" aria-label="Filter bidang" className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {tabs.map((t) => (
            <button key={t} type="button" aria-pressed={field === t} onClick={() => setField(t)} className={`flex-none h-11 px-4 rounded-full border-[1.5px] text-sm cursor-pointer whitespace-nowrap ${field === t ? "border-primary bg-primary text-white font-semibold" : "border-line-2 bg-white font-medium"}`}>{t}</button>
          ))}
        </div>
        <div className="flex items-center justify-between text-sm text-ink-3" aria-live="polite">
          <span>{list.length} skill{field !== "Semua" && ` · ${field}`}</span>
          <span>{picked.length}/{MAX_SKILLS} dipilih{state === "saving" ? " · menyimpan…" : state === "saved" ? " · tersimpan" : state === "error" ? " · gagal menyimpan" : ""}</span>
        </div>
        {list.length === 0 ? <p className="m-0 text-ink-2 py-6 text-center">Tidak ada skill yang cocok dengan “{q}”. Coba kata lain atau pilih “Semua”.</p> : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-2.5">
            {list.map((s) => {
              const on = picked.includes(s);
              return (
                <button key={s} type="button" aria-pressed={on} disabled={!on && full} onClick={() => toggle(s)}
                  className={`text-left p-3.5 rounded-2xl border-2 cursor-pointer flex flex-col gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${on ? "border-[#2563EB] bg-know-tint" : "border-line bg-white"}`}>
                  <span className="flex items-center gap-2 text-[15px] font-bold">{on && <Icon name="check" size={16} sw={2.6} className="text-know-fg" />}{s}</span>
                  <span className="text-xs text-ink-3 leading-snug">{fieldsOfSkill(s).slice(0, 3).join(" · ")}{fieldsOfSkill(s).length > 3 && ` +${fieldsOfSkill(s).length - 3}`}</span>
                </button>
              );
            })}
          </div>
        )}
        <div className="flex justify-end pt-4 border-t border-[#EEF0F6]"><Link href="/know?step=2" className="btn-primary">Selesai pilih, nilai levelnya <Icon name="arrow" size={18} sw={2.2} /></Link></div>
      </section>
    </>
  );
}
