"use client";
import { useState } from "react";
import Link from "next/link";
import { api, useFetch } from "@/lib/client";
import { BackLink, Bridge, Icon, Progress } from "./ui";
import { LEVELS, levelLabel } from "@/lib/catalog";
import { useRouter } from "next/navigation";

type Plan = { role: { slug: string; name: string }; roles: { slug: string; name: string }[]; gaps: { name: string; cur: number; target: number; weight: number; gap: number; priority: number }[]; items: { skill: string; title: string; meta: string; priority: number; done: boolean }[]; levelsRated: boolean; suggestions: { slug: string; name: string; fit: number }[] };

export function GrowView() {
  const router = useRouter();
  const { data, error, loading, setData, reload } = useFetch<Plan>("/api/grow/plan");
  const [why, setWhy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  if (loading && !data) return <p className="text-ink-2" role="status">Memuat…</p>;
  if (error?.includes("KNOW")) return <div className="card flex flex-col gap-3 items-start"><p className="m-0">Selesaikan KNOW dulu biar kami tau target peranmu.</p><Link href="/know" className="btn-primary">Ke KNOW</Link></div>;
  if (!data) return <p role="alert" className="text-[#B42318]">{error || "Gagal memuat"}</p>;

  async function setLevel(name: string, level: number) {
    setBusy(true); setMsg("");
    try { await api("/api/profile", { method: "PUT", json: { levels: [{ name, level }] } }); reload(); } catch (e: any) { setMsg(e.message); } finally { setBusy(false); }
  }
  async function toggle(i: number) {
    const cur = data!.items[i];
    setData({ ...data!, items: data!.items.map((x, j) => (j === i ? { ...x, done: !x.done } : x)) }); // optimis
    try { await api(`/api/grow/plan/items/${i}`, { method: "PATCH", json: { done: !cur.done } }); } catch (e: any) { setMsg(e.message); reload(); }
  }
  async function changeRole(slug: string) {
    setBusy(true); try { await api("/api/profile", { method: "PUT", json: { targetRole: slug } }); reload(); } finally { setBusy(false); }
  }

  const ok = data.gaps.filter((g) => g.gap === 0).length;
  const top = data.gaps.find((g) => g.gap > 0);
  const done = data.items.filter((i) => i.done).length;

  return (
    <>
      <div className="flex flex-wrap justify-between items-end gap-5">
        <div className="flex flex-col gap-2 max-w-[720px]">
          <BackLink href="/know?step=2">Kembali ke KNOW</BackLink>
          <span className="label-caps text-grow-fg text-[13px]">STEP 2 DARI 5 · GROW</span>
          <h1 className="m-0 text-[28px] sm:text-4xl leading-[1.15] font-extrabold tracking-[-0.025em]">Tau persis harus belajar apa</h1>
          <p className="m-0 text-base leading-relaxed text-ink-2">Kami bandingin skill kamu sekarang sama yang dibutuhin buat target peranmu, terus diurutin mana yang paling penting dikejar duluan.</p>
        </div>
        <label className="flex items-center gap-3 px-4 py-3 rounded-[14px] bg-white border border-line">
          <span><span className="block text-xs font-semibold text-ink-3">Target peran · dari KNOW</span>
            <select className="mt-0.5 -ml-1 min-h-11 text-[15px] font-bold bg-transparent cursor-pointer" value={data.role.slug} disabled={busy} onChange={(e) => changeRole(e.target.value)} aria-label="Ubah target peran">
              {data.roles.map((r) => <option key={r.slug} value={r.slug}>{r.name}</option>)}
            </select></span>
        </label>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-4">
        <Stat label="Skill yang udah on target" v={<>{ok} <small>dari {data.gaps.length}</small></>} />
        <Stat label="Paling perlu di-upgrade" v={<span className="text-[22px]">{top?.name ?? "Semua on target 🎉"}</span>} />
        <Stat label="Rencana belajar beres" v={<>{done} <small>dari {data.items.length}</small></>} />
      </div>

      <div className="flex flex-wrap gap-7 items-start">
        <section aria-labelledby="gap-h" className="card flex-[999_1_540px] min-w-0 p-5 sm:p-7 flex flex-col gap-[22px]">
          <div className="flex justify-between items-center gap-3 flex-wrap">
            <h2 id="gap-h" className="m-0 text-lg font-bold">Skill kamu sekarang vs target</h2>
            <div className="flex gap-4 text-[13px] text-ink-2 font-medium">
              <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#16A34A]" />Sekarang</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-white border-[1.5px] border-dashed border-impact-fg" />Yang masih kurang</span>
            </div>
          </div>
          <div className="flex flex-col gap-[18px]">
            {data.gaps.map((g) => (
              <div key={g.name} className="flex flex-wrap items-center gap-x-5 gap-y-3">
                <div className="flex-[1_1_170px] min-w-0"><div className="text-[15px] font-bold">{g.name}</div><div className="text-[13px] text-ink-3">{g.cur ? `Level ${g.cur} · ${levelLabel(g.cur)}` : "Belum punya"} → target {g.target} · bobot {g.weight}</div></div>
                <div role="radiogroup" aria-label={`Level ${g.name}`} title={LEVELS.map((l) => `${l.n} ${l.label}`).join(" · ")} className="flex-[2_1_250px] grid grid-cols-5 gap-1">
                  {[1, 2, 3, 4, 5].map((i) => {
                    const have = i <= g.cur, gap = !have && i <= g.target;
                    return (
                      <button key={i} role="radio" aria-checked={g.cur === i} aria-label={`Level ${i}`} disabled={busy} onClick={() => setLevel(g.name, i)}
                        className="h-11 grid place-items-end cursor-pointer bg-transparent border-0 p-0 pb-[15px] group">
                        <span className={`block w-full h-3.5 rounded ${have ? "bg-[#16A34A]" : gap ? "bg-[#FFF8EC] border-[1.5px] border-dashed border-impact-fg" : "bg-[#EEF0F6]"} group-hover:opacity-80`} />
                      </button>
                    );
                  })}
                </div>
                <div className="flex-none w-24 text-right">{g.gap === 0 ? <span className="text-[13px] font-bold text-grow-fg bg-grow-tint px-2.5 py-1 rounded-full">On target</span> : <span className="text-[13px] font-bold text-impact-fg bg-impact-tint px-2.5 py-1 rounded-full">Kurang {g.gap}</span>}</div>
              </div>
            ))}
          </div>
          {msg && <p role="alert" className="m-0 text-sm font-semibold text-[#B42318]">{msg}</p>}
          <div className="border-t border-[#EEF0F6] pt-[18px] flex flex-col gap-3">
            <button type="button" className="btn-secondary self-start h-11 px-3.5 text-sm rounded-[10px]" aria-expanded={why} onClick={() => setWhy(!why)}><Icon name="help" size={18} />Kok urutannya gini?</button>
            {why && (
              <div className="bg-bg rounded-[14px] p-[18px] text-sm leading-relaxed text-ink-2">
                <strong className="text-ink">prioritas = max(0, target − level) × bobot.</strong> Bobot 1 = skill pelengkap, 3 = skill inti untuk peran {data.role.name}.
                {top && <> {top.name}: (target {top.target} − level {top.cur}) × bobot {top.weight} = <b>{top.priority}</b>, makanya nongol paling atas.</>} Aturannya sama buat semua orang, gak ada penilaian tersembunyi.
              </div>
            )}
          </div>
        </section>

        <aside aria-labelledby="plan-h" className="flex-[1_1_340px] min-w-0 flex flex-col gap-4">
          <div className="card flex flex-col gap-4">
            <div><h2 id="plan-h" className="m-0 text-lg font-bold">Rencana belajarmu</h2><p className="mt-1 mb-0 text-sm text-ink-3">Urut dari yang paling penting</p></div>
            {data.items.length > 0 && <Progress pct={Math.round((done / data.items.length) * 100)} label="Progres rencana belajar" color="bg-[#16A34A]" />}
            <div className="flex flex-col gap-2.5">
              {data.items.length === 0 && <p className="m-0 text-sm text-ink-2">Semua skill udah on target. Lanjut cari partner!</p>}
              {data.items.map((t, i) => (
                <label key={t.title} className="flex gap-3 items-start p-3.5 rounded-[14px] border border-line cursor-pointer">
                  <input type="checkbox" checked={t.done} onChange={() => toggle(i)} className="w-5 h-5 mt-0.5 accent-[#16A34A] flex-none" />
                  <span className="flex-1 min-w-0 flex flex-col gap-1"><span className={`text-[15px] font-semibold ${t.done ? "line-through text-ink-3" : ""}`}>{t.title}</span><span className="text-[13px] text-ink-3">{t.skill} · {t.meta}</span></span>
                </label>
              ))}
            </div>
          </div>
          {data.suggestions.length > 0 && (
            <div className="card flex flex-col gap-3">
              <div><h2 className="m-0 text-base font-bold">Peran lain yang cocok</h2><p className="mt-1 mb-0 text-sm text-ink-3">Berdasarkan skill dan bidang yang kamu pilih. Klik buat ganti target.</p></div>
              {data.suggestions.map((r) => (
                <button key={r.slug} type="button" disabled={busy} onClick={() => changeRole(r.slug)} className="flex items-center justify-between gap-3 text-left min-h-12 px-3.5 rounded-xl border border-line bg-white cursor-pointer hover:bg-bg">
                  <span className="text-sm font-semibold">{r.name}</span><span className="text-xs font-bold text-grow-fg bg-grow-tint px-2 py-1 rounded-full whitespace-nowrap">{r.fit}% cocok</span>
                </button>
              ))}
            </div>
          )}
          <Bridge tone="teal"><strong>Lanjut kepake di CONNECT:</strong> sambil kamu belajar, kami cariin partner yang udah jago {data.gaps.filter((g) => g.gap > 0).slice(0, 2).map((g) => g.name).join(" dan ") || "di bidang lain"}.</Bridge>
          <button type="button" disabled={busy} className="btn-primary h-[50px] rounded-[14px]" onClick={async () => { setBusy(true); try { await api("/api/profile", { method: "PUT", json: { growReviewed: true } }); } finally { router.push("/connect"); router.refresh(); } }}>Lanjut ke CONNECT <Icon name="arrow" size={18} sw={2.2} /></button>
        </aside>
      </div>
    </>
  );
}
const Stat = ({ label, v }: { label: string; v: React.ReactNode }) => (
  <div className="bg-white border border-line rounded-[18px] p-5"><div className="text-[13px] font-semibold text-ink-3">{label}</div><div className="text-[30px] font-extrabold mt-1.5 [&_small]:text-base [&_small]:font-semibold [&_small]:text-ink-3">{v}</div></div>
);
