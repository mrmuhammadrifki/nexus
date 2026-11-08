"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/client";
import { GOALS, INTERESTS, LEVELS, MAX_GOALS, MAX_INTERESTS, MAX_SKILLS, SKILLS, WORK_STYLES, levelLabel, popularSkillsFor } from "@/lib/catalog";
import { BackLink, Bridge, Icon, Progress } from "./ui";
import { KnowSkeleton } from "./skeletons";

type P = { interests: string[]; skillNames: string[]; levels: Record<string, number | null>; goals: string[]; workStyle: string; label?: string; role?: string | null; roleSlug?: string | null; options: { slug: string; name: string; fit: number; matched: string[]; missing: string[]; tags: string[] }[] };
// 5 langkah internal, tampil sebagai 4 pertanyaan (langkah level = lanjutan pertanyaan skill).
const STEP_Q = [0, 1, 1, 2, 3];
const TITLES = ["Minat", "Skill", "Target", "Gaya kerja"];

export function KnowQuiz() {
  const [p, setP] = useState<P | null>(null);
  const [fetchErr, setFetchErr] = useState("");
  const [loading, setLoading] = useState(true);
  const sp = useSearchParams();
  const [step, setStep] = useState(Math.min(4, Math.max(0, Number(sp.get("step")) || 0)));
  const [saving, setSaving] = useState<"" | "saving" | "saved" | "error">("");
  const seq = useRef(0);

  const loadProfile = useCallback(() => {
    setLoading(true);
    setFetchErr("");
    api("/api/profile")
      .then((d) => {
        setP({
          interests: d.interests ?? [],
          skillNames: (d.skills ?? []).map((s: any) => s.name),
          levels: Object.fromEntries((d.skills ?? []).map((s: any) => [s.name, s.level ?? null])),
          goals: d.goals ?? [],
          workStyle: d.workStyle ?? "",
          label: d.profileLabel,
          role: d.targetRoleName,
          roleSlug: d.targetRole ?? null,
          options: d.roleOptions ?? [],
        });
      })
      .catch((e: any) => setFetchErr(e.message || "Gagal memuat profil"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  async function update(patch: Partial<P>) {
    if (!p) return;
    const next = { ...p, ...patch };
    setP(next); setSaving("saving");
    const my = ++seq.current;
    try {
      const body: any = { interests: next.interests, skillNames: next.skillNames };
      if (next.goals.length) body.goals = next.goals;
      if (next.workStyle) body.workStyle = next.workStyle;
      const r = await api("/api/profile", { method: "PUT", json: body });
      if (my === seq.current) { setP((c) => c && { ...c, label: r.profileLabel, role: r.targetRoleName, roleSlug: r.targetRole ?? null, options: r.roleOptions ?? [], levels: Object.fromEntries((r.skills ?? []).map((x: any) => [x.name, x.level ?? null])) }); setSaving("saved"); } // auto-save tiap jawaban
    } catch { if (my === seq.current) setSaving("error"); }
  }
  async function setLevel(name: string, level: number) {
    if (!p) return;
    setP({ ...p, levels: { ...p.levels, [name]: level } }); setSaving("saving");
    const my = ++seq.current;
    try {
      const r = await api("/api/profile", { method: "PUT", json: { levels: [{ name, level }] } });
      if (my === seq.current) { setP((c) => c && { ...c, label: r.profileLabel, role: r.targetRoleName, roleSlug: r.targetRole ?? null, options: r.roleOptions ?? [] }); setSaving("saved"); }
    } catch { if (my === seq.current) setSaving("error"); }
  }
  async function pickRole(slug: string) {
    if (!p) return;
    setP({ ...p, roleSlug: slug, role: p.options.find((o) => o.slug === slug)?.name ?? p.role }); setSaving("saving");
    try { const r = await api("/api/profile", { method: "PUT", json: { targetRole: slug } }); setP((c) => c && { ...c, roleSlug: r.targetRole, role: r.targetRoleName, options: r.roleOptions ?? [] }); setSaving("saved"); } catch { setSaving("error"); }
  }
  const toggle = (k: "interests" | "skillNames", v: string) => update({ [k]: p![k].includes(v) ? p![k].filter((x) => x !== v) : [...p![k], v] } as any);

  if (fetchErr) {
    return (
      <div className="card p-6 flex flex-col gap-3 items-start">
        <p className="text-[#B42318] m-0 font-medium" role="alert">{fetchErr}</p>
        <button type="button" onClick={loadProfile} className="btn-primary">Coba lagi</button>
      </div>
    );
  }
  if (!p || loading) return <KnowSkeleton />;
  const unrated = p.skillNames.filter((n) => !p.levels[n]);
  const complete = p.interests.length > 0 && p.skillNames.length > 0 && unrated.length === 0 && p.goals.length > 0 && !!p.workStyle;
  const doneFlags = [p.interests.length > 0, p.skillNames.length > 0, p.skillNames.length > 0 && unrated.length === 0, p.goals.length > 0, !!p.workStyle];
  const pct = Math.round((doneFlags.filter(Boolean).length / doneFlags.length) * 100);
  const canNext = [p.interests.length > 0, p.skillNames.length > 0, p.skillNames.length > 0 && unrated.length === 0, p.goals.length > 0, !!p.workStyle][step];
  const reqHints = [
    "Pilih minimal 1 minat (wajib)",
    "Pilih minimal 1 skill (wajib)",
    unrated.length > 0 ? `Beri nilai level untuk semua skill (${unrated.length} belum dinilai)` : "Beri nilai level untuk semua skill (wajib)",
    "Pilih minimal 1 target tahun ini (wajib)",
    "Pilih 1 gaya kerja tim (wajib)",
  ];
  const style = WORK_STYLES.find((w) => w.id === p.workStyle);
  const goalTitles = p.goals.map((id) => GOALS.find((g) => g.id === id)?.title).filter(Boolean) as string[];

  const Chips = ({ k, list, max }: { k: "interests" | "skillNames"; list: string[]; max: number }) => {
    const full = p[k].length >= max;
    return (
      <div className="flex flex-col gap-3">
        <div className="text-xs text-ink-3" aria-live="polite">{p[k].length}/{max} dipilih{full && " · batas tercapai, lepas satu untuk menambah"}</div>
        <div className="flex flex-wrap gap-2.5">{list.map((v) => {
          const on = p[k].includes(v);
          return <button key={v} type="button" className="chip" aria-pressed={on} disabled={!on && full} onClick={() => toggle(k, v)}>{on && <Icon name="check" size={16} sw={2.6} />}{v}</button>;
        })}</div>
      </div>
    );
  };
  const Cards = ({ list, val, pick }: { list: { id: string; title: string; desc: string }[]; val: string; pick: (id: string) => void }) => (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">{list.map((o) => (
      <button key={o.id} type="button" aria-pressed={val === o.id} onClick={() => pick(o.id)} className={`text-left p-[18px] rounded-2xl border-2 cursor-pointer flex flex-col gap-1 ${val === o.id ? "border-[#2563EB] bg-know-tint" : "border-line bg-white"}`}>
        <span className="text-base font-bold">{o.title}</span><span className="text-sm text-ink-2">{o.desc}</span>
      </button>
    ))}</div>
  );

  return (
    <>
      <div className="flex flex-col gap-2 max-w-[760px]">
        <BackLink href="/dashboard">Kembali ke dashboard</BackLink>
        <span className="label-caps text-know-fg text-[13px]">STEP 1 DARI 5 · KNOW</span>
        <h1 className="m-0 text-[28px] sm:text-4xl leading-[1.15] font-extrabold tracking-[-0.025em]">Kenalan dulu sama dirimu</h1>
        <p className="m-0 text-base leading-relaxed text-ink-2">Cuma 4 pertanyaan singkat. Gak ada jawaban benar atau salah, dan bisa kamu ubah kapan aja.</p>
      </div>
      <div className="flex flex-wrap gap-7 items-start">
        <section aria-label="Pertanyaan" className="card flex-[999_1_540px] min-w-0 p-5 sm:p-8 flex flex-col gap-7">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between text-sm font-semibold text-ink-2"><span>Pertanyaan {STEP_Q[step] + 1} dari 4 · {pct}% terisi</span><span>{step === 2 ? "Level skill" : TITLES[STEP_Q[step]]}</span></div>
            <Progress pct={pct} label="Progres pengisian KNOW" color="bg-[#2563EB]" />
          </div>
          {step === 0 && <Q t="Bidang apa yang paling bikin kamu tertarik?" s="Boleh pilih lebih dari satu."><Chips k="interests" list={INTERESTS} max={MAX_INTERESTS} /></Q>}
          {step === 1 && (() => {
            const popular = popularSkillsFor(p.interests);
            const extra = p.skillNames.filter((x) => !popular.includes(x));
            return (
              <Q t="Skill apa yang udah kamu kuasai?" s="Pilih yang udah pernah kamu pakai di tugas, proyek, atau organisasi. Level-nya kamu nilai di GROW.">
                <div className="flex flex-col gap-3.5">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-sm font-semibold text-ink-2">{p.interests.length ? "Skill paling populer di bidangmu" : "Skill paling populer"}</span>
                    <span className="text-xs text-ink-3" aria-live="polite">{p.skillNames.length}/{MAX_SKILLS} dipilih</span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">{[...popular, ...extra].map((v) => {
                    const on = p.skillNames.includes(v);
                    return <button key={v} type="button" className="chip" aria-pressed={on} disabled={!on && p.skillNames.length >= MAX_SKILLS} onClick={() => toggle("skillNames", v)}>{on && <Icon name="check" size={16} sw={2.6} />}{v}</button>;
                  })}</div>
                  <Link href="/know/skills" className="btn-secondary self-start h-11 px-4 text-sm">
                    <Icon name="plus" size={16} sw={2.4} />Lihat semua skill ({SKILLS.length}) · cari &amp; filter per bidang
                  </Link>
                </div>
              </Q>
            );
          })()}
          {step === 2 && (
            <Q t="Seberapa mahir kamu di tiap skill?" s="Nilai jujur aja, ini bukan ujian. Hasilnya dipakai buat ngitung skill yang perlu kamu kejar dan nyariin partner yang pas.">
              <div className="flex flex-col gap-5">
                <details className="rounded-xl bg-bg p-3.5 text-sm text-ink-2">
                  <summary className="cursor-pointer font-semibold text-ink min-h-11 flex items-center">Arti tiap level</summary>
                  <ul className="m-0 mt-2 pl-0 list-none flex flex-col gap-1.5">{LEVELS.map((l) => <li key={l.n}><b className="text-ink">{l.n} · {l.label}</b> — {l.hint}</li>)}</ul>
                </details>
                {p.skillNames.length === 0 && <p className="m-0 text-ink-2">Belum ada skill dipilih. <button type="button" className="font-semibold text-primary cursor-pointer bg-transparent border-0 p-0" onClick={() => setStep(1)}>Pilih skill dulu</button></p>}
                {p.skillNames.map((n) => {
                  const cur = p.levels[n] ?? 0;
                  return (
                    <fieldset key={n} className="m-0 p-0 border-0 flex flex-col gap-2 min-w-0">
                      <legend className="p-0 mb-2 flex items-center justify-between gap-3 w-full text-[15px] font-bold"><span>{n}</span><span className={`text-[13px] font-semibold ${cur ? "text-know-fg" : "text-impact-fg"}`}>{levelLabel(cur || null)}</span></legend>
                      <div role="radiogroup" aria-label={`Level ${n}`} className="grid grid-cols-5 gap-1.5">
                        {LEVELS.map((l) => (
                          <button key={l.n} type="button" role="radio" aria-checked={cur === l.n} aria-label={`${l.n} — ${l.label}`} title={l.hint} onClick={() => setLevel(n, l.n)}
                            className={`min-h-12 rounded-xl border-2 cursor-pointer text-sm font-bold ${cur === l.n ? "border-[#2563EB] bg-know-tint text-know-fg" : cur >= l.n ? "border-[#BBD0FF] bg-[#F3F7FF] text-know-fg" : "border-line bg-white text-ink-2"}`}>{l.n}</button>
                        ))}
                      </div>
                    </fieldset>
                  );
                })}
                {p.skillNames.length > 0 && unrated.length > 0 && <p role="status" className="m-0 text-sm font-semibold text-impact-fg">Masih {unrated.length} skill yang belum dinilai.</p>}
              </div>
            </Q>
          )}
          {step === 3 && (
            <Q t="Target kamu setahun ke depan apa?" s={`Boleh pilih sampai ${MAX_GOALS}. Yang pertama kamu pilih jadi target utama.`}>
              <div className="flex flex-col gap-3">
                <div className="text-xs text-ink-3" aria-live="polite">{p.goals.length}/{MAX_GOALS} dipilih{p.goals.length >= MAX_GOALS && " · batas tercapai, lepas satu untuk menambah"}</div>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">{GOALS.map((o) => {
                  const idx = p.goals.indexOf(o.id), on = idx >= 0, full = p.goals.length >= MAX_GOALS;
                  return (
                    <button key={o.id} type="button" role="checkbox" aria-checked={on} disabled={!on && full}
                      onClick={() => update({ goals: on ? p.goals.filter((x) => x !== o.id) : [...p.goals, o.id] })}
                      className={`text-left p-[18px] rounded-2xl border-2 cursor-pointer flex flex-col gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${on ? "border-[#2563EB] bg-know-tint" : "border-line bg-white"}`}>
                      <span className="flex items-center justify-between gap-2"><span className="text-base font-bold">{o.title}</span>{on && <span className="text-[11px] font-bold text-white bg-[#2563EB] rounded-full px-2 py-0.5 whitespace-nowrap">{idx === 0 ? "Utama" : `Target ${idx + 1}`}</span>}</span>
                      <span className="text-sm text-ink-2">{o.desc}</span>
                    </button>
                  );
                })}</div>
              </div>
            </Q>
          )}
          {step === 4 && <Q t="Di tim, kamu paling nyaman jadi apa?" s="Biar kami bisa cariin partner yang ngelengkapin kamu."><Cards list={WORK_STYLES} val={p.workStyle} pick={(id) => update({ workStyle: id })} /></Q>}
          <div className="flex flex-col gap-3 pt-5 border-t border-[#EEF0F6]">
            {!canNext && (
              <p className="m-0 text-xs font-semibold text-[#B42318] bg-[#FEF3F2] py-2 px-3 rounded-lg self-start sm:self-end">
                ⚠️ {reqHints[step]}
              </p>
            )}
            <div className="flex justify-between items-center gap-3 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
                {step > 0 ? <button type="button" className="btn-secondary" onClick={() => setStep(step - 1)}>Kembali</button> : <Link href="/dashboard" className="btn-secondary">Kembali</Link>}
                <span className="text-sm text-ink-3" role="status">{saving === "saving" ? "Nyimpen…" : saving === "error" ? "Gagal nyimpen, coba lagi" : "Auto-save aktif"}</span>
              </div>
              {step < 4 ? <button type="button" className="btn-primary" disabled={!canNext} onClick={() => setStep(step + 1)}>Lanjut <Icon name="arrow" size={18} sw={2.2} /></button>
                : <Link href="/grow" aria-disabled={!complete} className={`btn-primary ${complete && saving !== "saving" ? "" : "pointer-events-none opacity-50"}`}>Simpan, lanjut ke GROW <Icon name="arrow" size={18} sw={2.2} /></Link>}
            </div>
          </div>
        </section>
        <aside aria-label="Profil potensi" className="flex-[1_1_320px] min-w-0 flex flex-col gap-4">
          <div className="card flex flex-col gap-[18px]">
            <div className="flex items-center justify-between gap-2"><span className="label-caps text-know-fg">PROFIL POTENSIMU</span><span className="text-xs font-semibold text-ink-3" aria-live="polite">{saving === "saved" ? "Tersimpan" : "update real-time"}</span></div>
            <div className="flex items-center gap-3.5">
              <div className="w-[52px] h-[52px] rounded-2xl bg-know-tint text-know-fg grid place-items-center"><Icon name="compass" size={26} /></div>
              <div><div className="text-lg font-bold">{style?.label ?? "Profil belum lengkap"}</div><div className="text-sm text-ink-3">Target: {goalTitles.length ? goalTitles.join(" · ") : "-"}</div></div>
            </div>
            {complete && p.options.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                <div>
                  <span className="text-[13px] font-semibold text-ink-2">Peran target</span>
                  <p className="m-0 mt-0.5 text-xs text-ink-3">Tiga tebakan teratas dari skill (beserta levelnya) dan bidangmu. Tidak ada yang pas? Lihat semua peran.</p>
                </div>
                {p.options.map((o) => {
                  const on = o.slug === p.roleSlug;
                  return (
                    <button key={o.slug} type="button" role="radio" aria-checked={on} onClick={() => pickRole(o.slug)} className={`text-left p-3 rounded-xl border-2 cursor-pointer flex flex-col gap-1 ${on ? "border-[#2563EB] bg-know-tint" : "border-line bg-white"}`}>
                      <span className="flex items-center justify-between gap-2"><span className="text-sm font-bold">{o.name}</span><span className="text-xs font-bold text-know-fg whitespace-nowrap">{o.fit}% cocok</span></span>
                      <span className="text-xs text-ink-2 leading-snug">
                        {o.matched.length > 0 ? <>Skill kamu cocok: {o.matched.join(", ")}.</> : <>Belum ada skill yang cocok.</>}
                        {o.tags.length > 0 && <> Minat: {o.tags.join(", ")}.</>}
                        {o.missing.length > 0 && <> Perlu dikejar: {o.missing.join(", ")}.</>}
                      </span>
                    </button>
                  );
                })}
                <Link href="/know/peran" className="btn-secondary h-11 px-4 text-sm"><Icon name="plus" size={16} sw={2.4} />Lihat semua peran · cari &amp; filter</Link>
                {p.options[0].fit < 50 && <p role="status" className="m-0 text-xs font-semibold text-impact-fg">Kecocokan tertinggi masih di bawah 50%. Wajar kalau skill-mu belum menutup tuntutan peran mana pun, pilih peran yang kamu tuju lalu kejar gap-nya di GROW.</p>}
              </div>
            ) : (
              <p className="m-0 text-sm text-ink-3">Peran target muncul setelah semua jawaban terisi dan semua skill dinilai.</p>
            )}
            <Tags title="Minat" items={p.interests} cls="bg-[#F2F4F8] text-ink" />
            <Tags title="Skill" items={p.skillNames.map((n) => (p.levels[n] ? `${n} · ${levelLabel(p.levels[n])}` : `${n} · belum dinilai`))} cls="bg-know-tint text-know-fg" />
          </div>
          <Bridge tone="green"><strong>Lanjut kepake di GROW:</strong> target dan skill-mu jadi dasar buat ngitung skill apa yang perlu kamu upgrade.</Bridge>
        </aside>
      </div>
    </>
  );
}
const Q = ({ t, s, children }: { t: string; s: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-5"><div><h2 className="m-0 text-[22px] font-bold">{t}</h2><p className="mt-1.5 mb-0 text-[15px] text-ink-3">{s}</p></div>{children}</div>
);
const Tags = ({ title, items, cls }: { title: string; items: string[]; cls: string }) => (
  <div className="flex flex-col gap-2"><span className="text-[13px] font-semibold text-ink-2">{title}</span>
    <div className="flex flex-wrap gap-1.5">{items.length ? items.map((x) => <span key={x} className={`text-[13px] font-semibold px-[11px] py-[5px] rounded-full ${cls}`}>{x}</span>) : <span className="text-[13px] text-ink-3">Belum dipilih</span>}</div></div>
);
