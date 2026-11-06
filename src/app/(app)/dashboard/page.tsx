import Link from "next/link";
import { Avatar, Bridge, DoneDot, Icon, Pill, STEPS } from "@/components/ui";
import { getDash, getSession } from "@/lib/dash";
import { InviteList } from "@/components/invite-list";
import { CANVAS_META } from "@/lib/catalog";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const ACT: Record<string, (a: any) => React.ReactNode> = {
  invite_sent: (a) => <><b>{a.actor}</b> ngajak {a.payload?.to ?? "seseorang"}</>,
  invite_accepted: (a) => <><b>{a.actor}</b> join tim</>,
  invite_declined: (a) => <><b>{a.actor}</b> menolak undangan</>,
  canvas_saved: (a) => <>Bagian <b>{CANVAS_META.find((m) => m.key === a.payload?.section)?.title ?? "kanvas"}</b> disimpan</>,
  plan_done: (a) => <>Modul <b>{a.payload?.title}</b> beres</>,
  know_done: () => <>Profil potensi terbentuk</>,
  assessed: (a) => <>Skor kesiapan: <b>{a.payload?.score}</b></>,
};
const rel = (d: Date | string) => {
  const m = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "Baru saja"; if (m < 60) return `${m} menit lalu`;
  const h = Math.round(m / 60); if (h < 24) return `${h} jam lalu`;
  const dd = Math.round(h / 24); return dd === 1 ? "Kemarin" : `${dd} hari lalu`;
};

export default async function Dashboard() {
  const { id, user } = await getSession();
  const d = await getDash(id);
  const date = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const BADGE = { done: <Pill tone="green">Beres</Pill>, active: <Pill tone="violet">Lagi jalan</Pill>, next: <Pill>Next</Pill> } as const;
  const SUB = ["Profil potensi", "Prioritas belajar", "Tim proyek", `Kanvas proyek · ${d.canvasFilled}/6`, "Skor kesiapan"];

  return (
    <>
      <div className="flex flex-wrap justify-between items-end gap-5">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-ink-3 first-letter:uppercase">{date}</span>
          <h1 className="m-0 text-[28px] sm:text-4xl leading-[1.15] font-extrabold tracking-[-0.025em]">Hai {user.name?.split(" ")[0]}, welcome back!</h1>
          <p className="m-0 text-base text-ink-2">{d.steps.filter((s) => s.done).length} dari 5 step udah beres.{d.pct === 100 ? " Mantap, perjalananmu lengkap!" : " Dikit lagi proyekmu siap bikin dampak!"}</p>
        </div>
        <Link href={d.next.href} className="btn-primary h-[50px] rounded-[14px]">{d.next.cta} <Icon name="arrow" size={18} sw={2.2} /></Link>
      </div>

      {d.invites.length > 0 && <InviteList invites={d.invites as any} />}

      <section aria-labelledby="journey-h" className="card p-5 sm:p-7">
        <div className="flex justify-between items-center gap-3 flex-wrap mb-6">
          <h2 id="journey-h" className="m-0 text-lg font-bold">Perjalananmu</h2>
          <div className="flex items-center gap-3 min-w-[220px]">
            <div className="flex-1 h-2 rounded-full bg-[#EEF0F6]" role="progressbar" aria-valuenow={d.pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progres perjalanan"><div className="h-2 rounded-full bg-primary" style={{ width: `${d.pct}%` }} /></div>
            <span className="text-sm font-bold text-primary">{d.pct}%</span>
          </div>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3">
          {STEPS.map((s, i) => {
            const st = d.steps[i].status as "done" | "active" | "next";
            return (
              <Link key={s.key} href={s.href} className={`flex flex-col gap-3 p-[18px] rounded-2xl ${st === "active" ? "border-2 border-create bg-[#FAF7FF]" : st === "next" ? "border border-dashed border-line-2" : "border border-line"}`}>
                <div className="flex justify-between items-center"><div className={`w-10 h-10 rounded-xl grid place-items-center ${s.tint} ${s.fg}`}><Icon name={s.icon} /></div>{BADGE[st]}</div>
                <div><div className={`label-caps ${s.fg}`}>{s.n} · {s.key}</div><div className="text-[15px] font-bold mt-1">{SUB[i]}</div></div>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="flex flex-wrap gap-7 items-start">
        <div className="flex-[999_1_560px] min-w-0 flex flex-col gap-7">
          <section aria-labelledby="next-h" className="card p-5 sm:p-7 flex flex-col gap-5">
            <div className="flex justify-between gap-4 flex-wrap items-start">
              <div>
                <span className="label-caps text-create-fg">NEXT STEP</span>
                <h2 id="next-h" className="mt-1.5 mb-0 text-[22px] font-bold">{d.next.title}</h2>
                {d.canvasFilled > 0 || d.steps[2].done ? <p className="mt-1.5 mb-0 text-[15px] text-ink-2">Proyek: <strong className="text-ink">{d.projectTitle}</strong>{d.tagline && <> · {d.tagline}</>}</p> : null}
                <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary-dark bg-primary-tint px-3 py-1.5 rounded-full"><Icon name="spark" size={14} />AI Coach siap kasih masukan di tiap bagian kanvas</span>
              </div>
              <Link href={d.next.href} className="btn bg-create-tint text-create-fg h-11 rounded-xl text-sm">{d.next.cta}</Link>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] gap-2">
              {d.canvasKeys.map((k, i) => (
                <Link key={k.key} href={`/create?s=${i}`} className="p-3 rounded-xl bg-bg flex flex-col gap-1.5">
                  {k.filled ? <DoneDot size={18} /> : <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="#C3C9DA" strokeWidth="2" /></svg>}
                  <span className={`text-[13px] font-semibold ${k.filled ? "" : "text-ink-3"}`}>{CANVAS_META[i].title}</span>
                </Link>
              ))}
            </div>
          </section>

          <section aria-labelledby="sum-h" className="flex flex-col gap-4">
            <h2 id="sum-h" className="m-0 text-lg font-bold">Rekap hasilmu</h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
              <div className="card flex flex-col gap-3.5">
                <div className="flex justify-between items-center"><span className="label-caps text-know-fg">PROFIL POTENSI · KNOW</span><Link href="/know" className="text-[13px] font-semibold text-primary">Detail</Link></div>
                {d.profile ? <>
                  <div className="text-[17px] font-bold">{d.profile.label}</div>
                  {d.profile.goal && <div className="text-sm text-ink-2">Target: <strong className="text-ink">{d.profile.goal}</strong></div>}
                  <div className="flex flex-wrap gap-2">{d.profile.skills.slice(0, 4).concat(d.profile.interests.slice(0, 2)).map((t: string) => <span key={t} className="text-[13px] font-semibold px-3 py-1.5 rounded-full bg-know-tint text-know-fg">{t}</span>)}</div>
                </> : <p className="m-0 text-sm text-ink-2">Belum diisi. <Link className="text-primary font-semibold" href="/know">Mulai KNOW</Link></p>}
              </div>
              <div className="card flex flex-col gap-3.5">
                <div className="flex justify-between items-center"><span className="label-caps text-grow-fg">PRIORITAS BELAJAR · GROW</span><Link href="/grow" className="text-[13px] font-semibold text-primary">Detail</Link></div>
                {d.topGaps.length ? d.topGaps.map((g: any, i: number) => (
                  <div key={g.name}><div className="flex justify-between text-sm font-semibold mb-1.5"><span>{i + 1}. {g.name}</span><span className="text-ink-3">{g.cur}/5 → {g.target}/5</span></div>
                    <div className="h-1.5 rounded-full bg-grow-tint"><div className="h-1.5 rounded-full bg-[#16A34A]" style={{ width: `${(g.cur / g.target) * 100}%` }} /></div></div>
                )) : <p className="m-0 text-sm text-ink-2">{d.profile ? "Semua skill on target 🎉" : "Kebuka setelah KNOW selesai."}</p>}
              </div>
              <div className="card flex flex-col gap-3.5">
                <div className="flex justify-between items-center"><span className="label-caps text-connect-fg">TIM PROYEK · CONNECT</span><Link href="/connect" className="text-[13px] font-semibold text-primary">Detail</Link></div>
                <div className="flex flex-col gap-2.5">{d.team.map((m: any) => (
                  <div key={m.userId} className="flex items-center gap-3"><Avatar name={m.name} /><div className="flex-1 min-w-0"><div className="text-sm font-bold truncate">{m.name}{m.userId === id ? " (kamu)" : ""}</div><div className="text-[13px] text-ink-3">{m.status === "invited" ? "Nunggu konfirmasi" : m.role}</div></div></div>
                ))}</div>
              </div>
              <div className={`rounded-[20px] p-6 flex flex-col gap-3.5 ${d.score ? "bg-white border border-line" : "bg-bg border border-dashed border-line-2"}`}>
                <span className="label-caps text-ink-3">SKOR KESIAPAN · IMPACT</span>
                {d.score ? <><div className="text-4xl font-extrabold">{d.score.score}<span className="text-base font-semibold text-ink-3"> / 100</span></div><Pill tone="amber">{d.score.level}</Pill><Link href="/impact" className="text-[13px] font-semibold text-primary">Lihat detail</Link></>
                  : <><div className="flex items-center gap-3"><div className="w-11 h-11 rounded-xl bg-white border border-line grid place-items-center text-ink-3"><Icon name="lock" /></div><div className="text-[15px] font-semibold text-ink-2">Kebuka setelah kanvas proyek lengkap</div></div></>}
              </div>
            </div>
          </section>
        </div>

        <aside className="flex-[1_1_320px] min-w-0 flex flex-col gap-5">
          <section aria-labelledby="flow-h" className="bg-ink text-white rounded-[20px] p-6 flex flex-col gap-4">
            <h2 id="flow-h" className="m-0 text-base font-bold">Gimana hasilmu nyambung</h2>
            <div className="flex flex-col gap-3 text-sm leading-normal text-[#C9D1E8]">
              {[["#3B82F6", "KNOW", "jadi patokan target skill di GROW."], ["#22C55E", "GROW", "jadi peran yang dicari di CONNECT."], ["#14B8A6", "CONNECT", "otomatis masuk ke kolom tim di CREATE."], ["#8B5CF6", "CREATE", "dibaca AI Coach dan dinilai di IMPACT."]].map(([c, k, t]) => (
                <div key={k} className="flex gap-2.5"><span className="flex-none w-2 h-2 mt-[7px] rounded-full" style={{ background: c }} /><span>Hasil <strong className="text-white">{k}</strong> {t}</span></div>
              ))}
            </div>
          </section>
          <section aria-labelledby="act-h" className="card flex flex-col gap-4">
            <h2 id="act-h" className="m-0 text-base font-bold">Aktivitas terbaru</h2>
            {d.activities.length === 0 ? <p className="m-0 text-sm text-ink-3">Belum ada aktivitas. Mulai dari KNOW!</p> :
              <ul className="m-0 p-0 list-none flex flex-col gap-3.5">{d.activities.map((a: any, i: number) => (
                <li key={i} className="flex gap-3"><Avatar name={a.actor} size={32} /><div><div className="text-sm">{ACT[a.type]?.(a) ?? a.type}</div><div className="text-xs text-ink-3 mt-0.5">{rel(a.at)}</div></div></li>
              ))}</ul>}
          </section>
          <Bridge tone="amber"><strong>Tips:</strong> pasang NEXUS ke layar utama HP lewat menu browser biar buka-nya secepat aplikasi biasa.</Bridge>
        </aside>
      </div>
    </>
  );
}
