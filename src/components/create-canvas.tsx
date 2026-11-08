"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, useDebounced, useFetch } from "@/lib/client";
import { CANVAS_META } from "@/lib/catalog";
import { EXAMPLES, PLACEHOLDER, TEMPLATES, countPlaceholders, defaultExampleFor, isFilled, type SectionKey } from "@/lib/templates";
import { AiNote, Avatar, BackLink, Bridge, DoneDot, Icon } from "./ui";
import { CreateSkeleton } from "./skeletons";

type Fb = { good: string; improve: string; rewrite: string; ideas: string[] };
type Team = { projectId: string; title: string; members: { userId: string; name: string; role: string; status: string }[] };

export function CreateCanvas() {
  const sp = useSearchParams();
  const team = useFetch<Team>("/api/team");
  const pid = team.data?.projectId;
  const canvasF = useFetch<{ title: string; tagline: string; canvas: Record<string, string> }>(pid ? `/api/projects/${pid}/canvas` : null);

  const [texts, setTexts] = useState<string[] | null>(null);
  const [title, setTitle] = useState(""); const [tagline, setTagline] = useState("");
  const [active, setActive] = useState(Math.min(5, Math.max(0, Number(sp.get("s")) || 0)));
  const [save, setSave] = useState<"idle" | "dirty" | "saving" | "saved" | "error">("idle");
  const dirtyIdx = useRef<Set<number>>(new Set());
  const dirtyMeta = useRef(false);
  const [ai, setAi] = useState<Record<number, Fb | null>>({});
  const [aiBusy, setAiBusy] = useState(false); const [aiErr, setAiErr] = useState("");
  const abort = useRef<AbortController | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (canvasF.data && !texts) {
      setTexts(["problem", "rootCause", "solution", "technology", "features", "impact"].map((k) => canvasF.data!.canvas[k] ?? ""));
      setTitle(canvasF.data.title); setTagline(canvasF.data.tagline ?? "");
    }
  }, [canvasF.data, texts]);

  const flush = useCallback(async () => {
    if (!pid || !texts) return;
    const idxs = [...dirtyIdx.current]; const meta = dirtyMeta.current;
    if (!idxs.length && !meta) return;
    dirtyIdx.current = new Set(); dirtyMeta.current = false; setSave("saving");
    try {
      for (const i of idxs) await api(`/api/projects/${pid}/canvas`, { method: "PATCH", json: { section: CANVAS_META[i].key, text: texts[i] } });
      if (meta) await api(`/api/projects/${pid}/canvas`, { method: "PATCH", json: { title: title.trim() || "Proyek tanpa judul", tagline } });
      setSave("saved");
    } catch { idxs.forEach((i) => dirtyIdx.current.add(i)); dirtyMeta.current = meta; setSave("error"); }
  }, [pid, texts, title, tagline]);

  useDebounced(flush, [texts, title, tagline], 2000, save === "dirty"); // CR-1: simpan 2 detik setelah berhenti mengetik
  useEffect(() => {
    const h = () => { if (document.visibilityState === "hidden") flush(); };
    document.addEventListener("visibilitychange", h); return () => document.removeEventListener("visibilitychange", h);
  }, [flush]);

  if (team.error || canvasF.error) {
    return (
      <div className="card p-6 flex flex-col gap-3 items-start">
        <p className="text-[#B42318] m-0 font-medium" role="alert">{team.error || canvasF.error}</p>
        <button type="button" onClick={() => { team.reload(); canvasF.reload(); }} className="btn-primary">Coba lagi</button>
      </div>
    );
  }
  if (!texts || !pid) return <CreateSkeleton />;
  const m = CANVAS_META[active];
  const filled = texts.map(isFilled); // terisi = ada isi & tak ada placeholder template tersisa
  const done = filled.filter(Boolean).length;
  const fb = ai[active];
  const setText = (v: string, i = active) => { setTexts(texts.map((t, j) => (j === i ? v : t))); dirtyIdx.current.add(i); setSave("dirty"); };
  const go = (i: number) => { abort.current?.abort(); setAiBusy(false); setAiErr(""); setActive(Math.max(0, Math.min(5, i))); flush(); };

  /** Tempel template; jika sudah ada isi, ditaruh di bawahnya. Lalu sorot placeholder pertama agar tinggal diketik. */
  function insertTemplate(t: string) {
    const cur = texts![active];
    const next = cur.trim() ? cur.replace(/\s+$/, "") + "\n\n" + t : t;
    setText(next);
    setTimeout(() => {
      const el = taRef.current; if (!el) return;
      const from = cur.trim() ? cur.replace(/\s+$/, "").length + 2 : 0;
      const m = PLACEHOLDER.exec(next.slice(from));
      el.focus();
      if (m) el.setSelectionRange(from + m.index, from + m.index + m[0].length);
    }, 0);
  }

  async function askAI() {
    await flush(); // server membaca kanvas dari DB, bukan dari klien
    abort.current?.abort(); const ac = (abort.current = new AbortController());
    setAiBusy(true); setAiErr("");
    try { const r = await api<Fb>("/api/ai/feedback", { method: "POST", json: { projectId: pid, section: m.key }, signal: ac.signal }); setAi((a) => ({ ...a, [active]: r })); }
    catch (e: any) { if (e.name !== "AbortError") setAiErr(e.message); } finally { setAiBusy(false); }
  }
  const statusTxt = { idle: "", dirty: "Belum tersimpan…", saving: "Nyimpen…", saved: "Tersimpan", error: "Gagal nyimpen — coba lagi" }[save];

  return (
    <>
      <div className="flex flex-wrap justify-between items-end gap-5">
        <div className="flex flex-col gap-2 max-w-[720px]">
          <BackLink href="/connect">Kembali ke CONNECT</BackLink>
          <span className="label-caps text-create-fg text-[13px]">STEP 4 DARI 5 · CREATE</span>
          <h1 className="m-0 text-[28px] sm:text-4xl leading-[1.15] font-extrabold tracking-[-0.025em]">Rancang solusimu, step by step</h1>
          <p className="m-0 text-base leading-relaxed text-ink-2">Isi 6 bagian kanvas berurutan, dari masalah sampai dampak. Tiap bagian ada pertanyaan pemandu, plus AI Coach yang siap kasih masukan.</p>
        </div>
        <div className="px-[18px] py-3 rounded-[14px] bg-white border border-line"><div className="text-xs font-semibold text-ink-3">Progres kanvas</div><div className="text-xl font-extrabold">{done} / 6 bagian · {Math.round((done / 6) * 100)}%</div></div>
      </div>

      <div className="flex flex-wrap gap-6 items-start">
        <nav aria-label="Bagian kanvas" className="flex-[1_1_220px] min-w-0 bg-white border border-line rounded-[20px] p-3 flex lg:flex-col gap-1 overflow-x-auto">
          {CANVAS_META.map((c, i) => (
            <button key={c.key} type="button" aria-current={i === active ? "step" : undefined} onClick={() => go(i)} className={`flex items-center gap-3 min-h-[52px] px-3 py-2 rounded-xl text-left cursor-pointer flex-none lg:w-full ${i === active ? "bg-create-tint" : "bg-transparent"}`}>
              {i === active ? <span className="w-7 h-7 flex-none rounded-full bg-create text-white text-[13px] font-bold grid place-items-center bg-[#7C3AED]">{i + 1}</span>
                : filled[i] ? <DoneDot size={28} label="Terisi" /> : <span className="w-7 h-7 flex-none rounded-full border-[1.5px] border-[#C3C9DA] text-ink-3 text-[13px] font-bold grid place-items-center">{i + 1}</span>}
              <span className={`text-[15px] whitespace-nowrap ${i === active ? "font-bold text-[#4C1D95]" : "font-medium"}`}>{c.title}</span>
            </button>
          ))}
        </nav>

        <section aria-labelledby="ed-h" className="card flex-[999_1_460px] min-w-0 p-5 sm:p-8 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between gap-2"><span className="label-caps text-create-fg text-[13px]">BAGIAN {active + 1} DARI 6</span><span className="text-xs text-ink-3" role="status" aria-live="polite">{statusTxt}</span></div>
            <h2 id="ed-h" className="m-0 text-2xl font-bold">{m.title}</h2>
            <p className="m-0 text-base leading-relaxed text-ink-2">{m.question}</p>
          </div>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold flex items-center justify-between">
              <span>Jawabanmu <span className="text-[#B42318]">*</span></span>
              <span className="text-xs font-normal text-ink-3">Wajib diisi</span>
            </span>
            <textarea ref={taRef} value={texts[active]} onChange={(e) => setText(e.target.value)} placeholder={m.placeholder} rows={7} maxLength={4000} className="w-full resize-y p-4 rounded-[14px] border-[1.5px] border-line-2 bg-[#FCFCFE] text-base leading-relaxed" />
          </label>
          {countPlaceholders(texts[active]) > 0 && <p role="status" className="m-0 -mt-2 text-sm font-semibold text-impact-fg">Masih ada {countPlaceholders(texts[active])} bagian dalam [kurung siku] yang perlu kamu ganti. Bagian ini baru dihitung terisi setelah semuanya diganti.</p>}
          <div className="flex gap-3 p-4 rounded-[14px] bg-bg"><Icon name="bulb" className="flex-none mt-0.5 text-create-fg" /><p className="m-0 text-sm leading-relaxed text-ink-2"><strong className="text-ink">Tips:</strong> {m.tip}</p></div>
          <TemplatePanel key={m.key} section={m.key as SectionKey} empty={!texts[active].trim()} onInsert={insertTemplate} />

          <div className="border border-[#C7D2FE] bg-[#F5F7FF] rounded-2xl p-[18px] flex flex-col gap-3.5">
            <div className="flex justify-between items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-[38px] h-[38px] rounded-[11px] bg-primary text-white grid place-items-center"><Icon name="spark" sw={1.8} /></div>
                <div><div className="flex items-center gap-2"><span className="text-[15px] font-bold">AI Coach</span><span className="text-[11px] font-bold text-primary bg-[#E0E7FF] px-2 py-0.5 rounded-full">BETA</span></div><div className="text-[13px] text-ink-2">Baca jawabanmu, terus kasih masukan</div></div>
              </div>
              {aiBusy ? <button type="button" className="btn-secondary h-11 px-4 text-sm" onClick={() => { abort.current?.abort(); setAiBusy(false); }}>Batal</button>
                : fb ? <button type="button" className="btn-secondary h-11 px-3.5 text-[13px] rounded-[10px]" onClick={() => setAi((a) => ({ ...a, [active]: null }))}>Tutup</button>
                : <button type="button" className="btn-primary h-11 px-4 text-sm" onClick={askAI}>Minta masukan AI</button>}
            </div>
            {aiBusy && <p role="status" className="m-0 text-sm text-ink-2">AI Coach lagi baca jawabanmu…</p>}
            {aiErr && <p role="alert" className="m-0 text-sm font-semibold text-[#B42318]">{aiErr}</p>}
            {fb && (
              <div className="flex flex-col gap-3" aria-live="polite">
                {fb.good && <div className="flex gap-2.5 items-start text-sm leading-relaxed"><DoneDot size={18} /><span><strong>Udah oke:</strong> {fb.good}</span></div>}
                <div className="flex gap-2.5 items-start text-sm leading-relaxed"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="flex-none mt-0.5"><circle cx="12" cy="12" r="11" fill="#2450E6" /><path d="M12 7v6M12 16.5v.5" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" /></svg><span><strong>{fb.good ? "Bisa ditingkatin:" : "Ide dari AI:"}</strong> {fb.improve}</span></div>
                {fb.rewrite && (
                  <div className="bg-white border border-[#DCE3FB] rounded-xl p-3.5 flex flex-col gap-2.5">
                    <span className="label-caps text-primary tracking-[0.06em]">SARAN VERSI BARU</span>
                    <p className="m-0 text-sm leading-relaxed">{fb.rewrite}</p>
                    <button type="button" className="btn self-start h-11 px-3.5 text-[13px] rounded-[10px] bg-primary-tint text-primary-dark" onClick={() => setText(fb.rewrite)}>Pakai saran ini</button>
                  </div>
                )}
                {fb.ideas.length > 0 && <div className="flex flex-wrap gap-2">{fb.ideas.map((idea) => (
                  <button key={idea} type="button" className="inline-flex items-center gap-1.5 min-h-11 px-3.5 rounded-full border border-[#C7D2FE] bg-white text-primary-dark text-[13px] font-semibold cursor-pointer" onClick={() => setText((texts[active].trim() ? texts[active].trim() + "\n" : "") + "- " + idea)}><Icon name="plus" size={14} sw={2.6} />{idea}</button>
                ))}</div>}
                <AiNote />
              </div>
            )}
          </div>

          <div className="flex justify-between gap-3 flex-wrap pt-4 border-t border-[#EEF0F6]">
            <button type="button" className="btn-secondary" disabled={active === 0} onClick={() => go(active - 1)}>Sebelumnya</button>
            {active < 5 ? <button type="button" className="btn-primary" onClick={() => go(active + 1)}>Simpan &amp; lanjut <Icon name="arrow" size={18} sw={2.2} /></button>
              : <Link href="/impact" onClick={() => flush()} className="btn-primary">Cek kesiapan di IMPACT <Icon name="arrow" size={18} sw={2.2} /></Link>}
          </div>
        </section>

        <aside aria-labelledby="proj-h" className="flex-[1_1_270px] min-w-0 flex flex-col gap-4">
          <div className="card flex flex-col gap-4">
            <div>
              <span className="label-caps text-ink-3">PROYEK</span>
              <label className="sr-only" htmlFor="ptitle">Judul proyek</label>
              <input id="ptitle" className="input mt-1 h-11 text-lg font-extrabold" value={title} maxLength={80} placeholder="Judul proyek" onChange={(e) => { setTitle(e.target.value); dirtyMeta.current = true; setSave("dirty"); }} />
              <label className="sr-only" htmlFor="ptag">Deskripsi singkat</label>
              <input id="ptag" className="input mt-2 h-11 text-sm" value={tagline} maxLength={160} placeholder="Deskripsi singkat (opsional)" onChange={(e) => { setTagline(e.target.value); dirtyMeta.current = true; setSave("dirty"); }} />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-[13px] font-semibold"><span className="text-ink-2">Progres</span><span>{Math.round((done / 6) * 100)}%</span></div>
              <div className="grid grid-cols-6 gap-1">{filled.map((f, i) => <div key={i} className={`h-1.5 rounded-full ${f ? "bg-[#7C3AED]" : "bg-[#EEE8FB]"}`} />)}</div>
            </div>
            <div className="border-t border-[#EEF0F6] pt-3.5 flex flex-col gap-2.5">
              <div className="flex justify-between items-center"><span className="text-[13px] font-semibold text-ink-2">Tim · dari CONNECT</span><Link href="/connect" className="text-[13px] font-semibold text-primary">Atur</Link></div>
              {team.data?.members.filter((x) => x.status === "accepted").map((x) => <div key={x.userId} className="flex items-center gap-2.5"><Avatar name={x.name} size={32} /><span className="text-sm"><strong>{x.name.split(" ")[0]}</strong> · {x.role}</span></div>)}
            </div>
          </div>
          <Bridge tone="amber"><strong>Lanjut kepake di IMPACT:</strong> kanvas yang udah lengkap bakal dinilai dari 5 indikator kesiapan.</Bridge>
        </aside>
      </div>
    </>
  );
}


/** Panel "Template & contoh" per bagian kanvas. */
function TemplatePanel({ section, empty, onInsert }: { section: SectionKey; empty: boolean; onInsert: (t: string) => void }) {
  const profile = useFetch<{ interests?: string[] }>("/api/profile");
  const [open, setOpen] = useState(empty);
  const [tab, setTab] = useState<"template" | "contoh">("template");
  const [ex, setEx] = useState<number | null>(null);
  const idx = ex ?? defaultExampleFor(profile.data?.interests ?? []);
  const example = EXAMPLES[idx];
  return (
    <div className="rounded-2xl border border-[#DDD3F7] bg-[#FBF9FF]">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-3 px-4 min-h-14 bg-transparent border-0 text-left cursor-pointer text-ink">
        <span className="flex items-center gap-2.5"><span className="w-8 h-8 rounded-lg bg-create-tint text-create-fg grid place-items-center"><Icon name="bulb" size={18} /></span><span><span className="block text-[15px] font-bold">Template &amp; contoh</span><span className="block text-xs text-ink-3">Bingung mulai dari mana? Pakai kerangka atau lihat contohnya.</span></span></span>
        <Icon name="arrow" size={18} className={`text-ink-3 transition-transform ${open ? "-rotate-90" : "rotate-90"}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 flex flex-col gap-3.5">
          <div role="tablist" aria-label="Template atau contoh" className="flex gap-2">
            {(["template", "contoh"] as const).map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`h-11 px-4 rounded-full border-[1.5px] text-sm cursor-pointer ${tab === t ? "border-create-fg bg-create-fg text-white font-semibold" : "border-line-2 bg-white font-medium"}`}>{t === "template" ? "Template isian" : "Contoh proyek"}</button>
            ))}
          </div>

          {tab === "template" ? (
            <div className="flex flex-col gap-2.5">
              {TEMPLATES[section].map((t) => (
                <div key={t.title} className="bg-white border border-line rounded-xl p-3.5 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3 flex-wrap"><div><div className="text-sm font-bold">{t.title}</div><div className="text-xs text-ink-3">{t.hint}</div></div>
                    <button type="button" className="btn h-11 px-3.5 text-[13px] rounded-[10px] bg-create-tint text-create-fg" onClick={() => onInsert(t.text)}>{empty ? "Pakai template" : "Tambahkan di bawah"}</button></div>
                  <p className="m-0 text-[13px] leading-relaxed text-ink-2 whitespace-pre-line">{t.text.split(/(\[[^\]]+\])/).map((part, i) => /^\[.+\]$/.test(part) ? <mark key={i} className="bg-[#FFF1C2] text-ink rounded px-0.5">{part}</mark> : part)}</p>
                </div>
              ))}
              <p className="m-0 text-xs text-ink-3">Ganti semua teks <mark className="bg-[#FFF1C2] rounded px-0.5">[dalam kurung siku]</mark> dengan jawabanmu. Bagian baru dihitung terisi kalau tidak ada yang tersisa.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div role="group" aria-label="Tema contoh" className="flex gap-2 overflow-x-auto pb-1">
                {EXAMPLES.map((e, i) => <button key={e.theme} type="button" aria-pressed={i === idx} onClick={() => setEx(i)} className={`flex-none h-11 px-3.5 rounded-full border-[1.5px] text-[13px] cursor-pointer whitespace-nowrap ${i === idx ? "border-primary bg-primary-tint text-primary font-semibold" : "border-line-2 bg-white font-medium"}`}>{e.theme}</button>)}
              </div>
              <div className="bg-white border border-line rounded-xl p-3.5 flex flex-col gap-1.5">
                <div className="text-xs font-bold tracking-wide text-ink-3">{example.project.toUpperCase()} · {example.field.toUpperCase()}</div>
                <p className="m-0 text-sm leading-relaxed text-ink whitespace-pre-line">{example.text[section]}</p>
              </div>
              <p className="m-0 text-xs text-ink-3">Contoh ilustrasi: nama, lokasi, dan angkanya karangan untuk menunjukkan format. Tulis jawabanmu sendiri berdasarkan masalah yang benar-benar kamu amati.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
