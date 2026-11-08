"use client";
import { useState } from "react";
import Link from "next/link";
import { api, useFetch } from "@/lib/client";
import { INDICATORS } from "@/lib/catalog";
import { AiNote, BackLink, Icon } from "./ui";
import { ImpactSkeleton } from "./skeletons";

type Ind = { key: string; weight: number; value: number; why: string; tip: string };
type Res = { id: string; score: number; level: string; weightsVersion: string; model: string; createdAt: string; indicators: Ind[] };
type Data = { filled: number; history: Res[] };
const NAME = Object.fromEntries(INDICATORS.map((i) => [i.key, i.name]));

export function ImpactView() {
  const team = useFetch<{ projectId: string; title: string }>("/api/team");
  const pid = team.data?.projectId;
  const d = useFetch<Data>(pid ? `/api/projects/${pid}/assess` : null);
  const [open, setOpen] = useState(-1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [sel, setSel] = useState(0);

  async function run() {
    setBusy(true); setErr("");
    try { await api(`/api/projects/${pid}/assess`, { method: "POST" }); setSel(0); d.reload(); }
    catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }
  if (team.error || d.error) {
    return (
      <div className="card p-6 flex flex-col gap-3 items-start">
        <p className="text-[#B42318] m-0 font-medium" role="alert">{team.error || d.error}</p>
        <button type="button" onClick={() => { team.reload(); d.reload(); }} className="btn-primary">Coba lagi</button>
      </div>
    );
  }
  if (!d.data || !pid) return <ImpactSkeleton />;

  const cur = d.data.history[sel];
  const locked = d.data.filled < 6;
  const C = 2 * Math.PI * 70;
  const worst = cur ? [...cur.indicators].sort((a, b) => a.value - b.value).slice(0, 2) : [];
  const bar = (v: number) => (v >= 80 ? "#16A34A" : v >= 60 ? "#D97706" : "#DC6B19");
  const fmt = (s: string) => new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(s));
  const prev = d.data.history[sel + 1];

  return (
    <>
      <div className="flex flex-col gap-2 max-w-[760px]">
        <BackLink href="/create">Kembali ke CREATE</BackLink>
        <span className="label-caps text-impact-fg text-[13px]">STEP 5 DARI 5 · IMPACT</span>
        <h1 className="m-0 text-[28px] sm:text-4xl leading-[1.15] font-extrabold tracking-[-0.025em]">Proyekmu udah siap bikin dampak belum?</h1>
        <p className="m-0 text-base leading-relaxed text-ink-2">AI Coach baca kanvas {team.data?.title}, terus skornya dihitung dari 5 indikator. Anggap skor ini kaca buat ngecek proyekmu, bukan ramalan bakal menang atau kalah.</p>
      </div>

      {locked && (
        <section className="card flex flex-col gap-3 items-start" aria-live="polite">
          <div className="flex items-center gap-3"><div className="w-11 h-11 rounded-xl bg-bg border border-line grid place-items-center text-ink-3"><Icon name="lock" /></div><h2 className="m-0 text-lg font-bold">Kebuka setelah 6 bagian kanvas terisi</h2></div>
          <p className="m-0 text-ink-2">Baru {d.data.filled} dari 6 bagian yang terisi. Lengkapi dulu biar AI Coach punya bahan buat dinilai.</p>
          <Link href="/create" className="btn-primary">Lengkapi kanvas</Link>
        </section>
      )}

      {!locked && (
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn-primary" onClick={run} disabled={busy}>{busy ? "AI lagi menilai…" : cur ? "Nilai ulang proyek" : "Nilai proyekku"}</button>
          <AiNote />
          {err && <p role="alert" className="m-0 text-sm font-semibold text-[#B42318] basis-full">{err}</p>}
        </div>
      )}

      {cur && (
        <div className="flex flex-wrap gap-7 items-start">
          <div className="flex-[999_1_540px] min-w-0 flex flex-col gap-6">
            <section aria-labelledby="score-h" className="card p-5 sm:p-7 flex flex-wrap gap-8 items-center">
              <div className="relative w-[168px] h-[168px] flex-none">
                <svg width="168" height="168" viewBox="0 0 168 168" role="img" aria-label={`Skor kesiapan ${cur.score} dari 100`}>
                  <circle cx="84" cy="84" r="70" fill="none" stroke="#FFF1DA" strokeWidth="16" />
                  <circle cx="84" cy="84" r="70" fill="none" stroke="#D97706" strokeWidth="16" strokeLinecap="round" strokeDasharray={`${((C * cur.score) / 100).toFixed(1)} ${C.toFixed(1)}`} transform="rotate(-90 84 84)" />
                </svg>
                <div className="absolute inset-0 grid place-content-center text-center"><span className="text-[44px] font-extrabold leading-none">{cur.score}</span><span className="text-[13px] font-semibold text-ink-3 mt-1">dari 100</span></div>
              </div>
              <div className="flex-[1_1_260px] min-w-0 flex flex-col gap-3">
                <span className="self-start text-[13px] font-bold text-impact-fg bg-impact-tint px-3 py-1.5 rounded-full">{cur.level}{prev && <> · {cur.score - prev.score >= 0 ? "+" : ""}{cur.score - prev.score} dari penilaian sebelumnya</>}</span>
                <h2 id="score-h" className="m-0 text-[22px] font-bold">{cur.score >= 80 ? "Siap diuji coba! Tinggal poles detail." : cur.score >= 60 ? `Fondasinya udah kuat! Tinggal upgrade ${worst.length} bagian.` : "Masih perlu digodok, tapi arahnya jelas."}</h2>
                <p className="m-0 text-[15px] leading-relaxed text-ink-2">Paling perlu perhatian: {worst.map((w) => NAME[w.key]).join(" dan ")}.</p>
                <div className="flex gap-1.5 flex-wrap text-xs font-semibold text-ink-3">
                  {[["0–59", "Masih perlu digodok"], ["60–79", "Udah lumayan siap"], ["80–100", "Siap diuji coba"]].map(([r, l]) => <span key={l} className={`px-2.5 py-1 rounded-lg ${l === cur.level ? "bg-impact-tint text-impact-fg" : "bg-[#F2F4F8]"}`}>{r} {l}</span>)}
                </div>
              </div>
            </section>

            <section aria-labelledby="ind-h" className="card p-5 sm:p-7 flex flex-col gap-2">
              <div className="flex justify-between items-center gap-3 flex-wrap mb-2">
                <h2 id="ind-h" className="m-0 text-lg font-bold">Breakdown 5 indikator</h2>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary-tint px-2.5 py-1.5 rounded-full"><Icon name="spark" size={14} />{cur.model.startsWith("heuristic") ? "Penilai heuristik (tanpa LLM)" : "Dinilai AI"} · dihitung pakai rumus</span>
              </div>
              {cur.indicators.map((it, i) => (
                <div key={it.key} className="rounded-[14px] border border-[#EEF0F6]">
                  <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex flex-wrap items-center gap-x-5 gap-y-3 p-4 bg-transparent border-0 text-left cursor-pointer text-ink min-h-14">
                    <span className="flex-[1_1_190px] min-w-0"><span className="block text-[15px] font-bold">{NAME[it.key]}</span><span className="block text-[13px] text-ink-3 mt-0.5">Bobot {Math.round(it.weight * 100)}%</span></span>
                    <span className="flex-[2_1_200px] h-2.5 rounded-full bg-[#F2F4F8] block"><span className="block h-2.5 rounded-full" style={{ width: `${it.value}%`, background: bar(it.value) }} /></span>
                    <span className="flex-none w-14 text-right text-[17px] font-extrabold">{it.value}</span>
                  </button>
                  {open === i && <div className="px-4 pb-4 flex flex-col gap-2.5"><p className="m-0 text-sm leading-relaxed text-ink-2"><strong className="text-ink">Kata AI Coach:</strong> {it.why}</p><p className="m-0 text-sm leading-relaxed text-ink-2"><strong className="text-ink">Saran:</strong> {it.tip}</p></div>}
                </div>
              ))}
              <div className="mt-3 p-4 rounded-[14px] bg-bg text-sm leading-relaxed text-ink-2">
                <strong className="text-ink">Cara ngitungnya:</strong> tiap indikator dinilai 0–100, lalu skor = Σ (bobot × nilai) = {cur.indicators.map((i) => `${i.weight}×${i.value}`).join(" + ")} = <b className="text-ink">{cur.score}</b> (bobot {cur.weightsVersion}, dihitung server). Bobotnya tetap dan sama buat semua proyek, jadi bisa kamu cek ulang. Saran AI bisa keliru, keputusan akhir tetap di kamu.
              </div>
            </section>
          </div>

          <aside aria-labelledby="fix-h" className="flex-[1_1_330px] min-w-0 flex flex-col gap-4">
            <div className="card flex flex-col gap-3.5">
              <h2 id="fix-h" className="m-0 text-lg font-bold">Yang perlu di-upgrade dulu</h2>
              {worst.map((w, i) => (
                <div key={w.key} className="p-4 rounded-[14px] border border-[#F5DFB8] bg-[#FFFBF4] flex flex-col gap-1.5">
                  <span className="label-caps text-impact-fg tracking-[0.06em]">{i + 1} · {NAME[w.key].toUpperCase()} ({w.value})</span>
                  <span className="text-[15px] font-semibold">{w.tip}</span>
                </div>
              ))}
              <Link href="/create" className="btn-primary h-12">Upgrade di kanvas</Link>
              <button type="button" className="btn-secondary" onClick={() => window.print()}>Download rekap (PDF)</button>
              <p className="m-0 text-xs text-ink-3">Di dialog cetak, pilih “Simpan sebagai PDF”.</p>
            </div>
            {d.data.history.length > 1 && (
              <div className="card flex flex-col gap-2.5">
                <h2 className="m-0 text-base font-bold">Riwayat penilaian</h2>
                {d.data.history.map((h, i) => (
                  <button key={h.id} onClick={() => { setSel(i); setOpen(-1); }} aria-pressed={i === sel} className={`flex justify-between items-center text-left px-3.5 min-h-11 rounded-xl border cursor-pointer text-sm ${i === sel ? "border-impact bg-impact-tint" : "border-line bg-white"}`}>
                    <span>{fmt(h.createdAt)}</span><b>{h.score}</b>
                  </button>
                ))}
              </div>
            )}
            <div className="bg-ink text-white rounded-[20px] p-6 flex flex-col gap-2.5">
              <span className="label-caps text-[#FCD34D]">YEAY, SEMUA STEP BERES!</span>
              <p className="m-0 text-[15px] leading-relaxed text-[#C9D1E8]">Habis upgrade, nilai ulang proyekmu buat lihat skornya naik berapa.</p>
              <Link href="/dashboard" className="self-start text-sm font-bold underline">Balik ke dashboard</Link>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
