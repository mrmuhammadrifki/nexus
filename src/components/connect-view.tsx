"use client";
import { useState } from "react";
import Link from "next/link";
import { api, useFetch } from "@/lib/client";
import { Avatar, BackLink, Bridge, Icon } from "./ui";
import { InviteList, type Invite } from "./invite-list";

type Team = { projectId: string; title: string; isOwner: boolean; invites: Invite[]; members: { userId: string; name: string; role: string; status: "accepted" | "invited"; isOwner: boolean; skills: { name: string; level: number }[] }[] };
type Cands = { gapSkills: string[]; candidates: { userId: string; name: string; major: string; role: string; skills: string[]; match: number; reason: string }[] };

export function ConnectView() {
  const [role, setRole] = useState("all");
  const team = useFetch<Team>("/api/team");
  const cands = useFetch<Cands>(`/api/connect/candidates?role=${encodeURIComponent(role)}`);
  const me = useFetch<{ visibility: string }>("/api/me");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  async function act(id: string, fn: () => Promise<unknown>) {
    setBusy(id); setMsg("");
    try { await fn(); team.reload(); cands.reload(); } catch (e: any) { setMsg(e.message); } finally { setBusy(""); }
  }
  const t = team.data;
  const invited = new Set(t?.members.filter((m) => m.status === "invited").map((m) => m.userId));
  const accepted = t?.members.filter((m) => m.status === "accepted") ?? [];
  const isMember = (id: string) => t?.members.some((m) => m.userId === id);

  if (cands.error.includes("KNOW")) return <div className="card flex flex-col gap-3 items-start"><p className="m-0">Selesaikan KNOW dan GROW dulu biar rekomendasinya pas.</p><Link href="/know" className="btn-primary">Ke KNOW</Link></div>;

  const gaps = cands.data?.gapSkills ?? [];
  return (
    <>
      <div className="flex flex-col gap-2 max-w-[760px]">
        <BackLink href="/grow">Kembali ke GROW</BackLink>
        <span className="label-caps text-connect-fg text-[13px]">STEP 3 DARI 5 · CONNECT</span>
        <h1 className="m-0 text-[28px] sm:text-4xl leading-[1.15] font-extrabold tracking-[-0.025em]">Temuin partner yang ngelengkapin kamu</h1>
        <p className="m-0 text-base leading-relaxed text-ink-2">Rekomendasinya diambil dari skill yang masih kurang di GROW. Kami cariin orang yang justru jago di bagian yang belum kamu kuasai.</p>
      </div>

      {t && t.invites.length > 0 && <InviteList invites={t.invites} />}
      {me.data?.visibility === "private" && (
        <div className="rounded-2xl border border-line bg-white p-4 flex flex-wrap items-center gap-3 justify-between text-sm">
          <span className="text-ink-2 flex-1 basis-60"><Icon name="lock" size={16} className="inline mr-1.5 -mt-0.5" />Profilmu masih <b>privat</b>, jadi orang lain belum bisa nemuin dan ngajak kamu. Kamu tetap bisa ngajak orang.</span>
          <Link href="/pengaturan" className="btn-secondary h-11 px-4 text-sm">Atur privasi</Link>
        </div>
      )}

      <div className="flex flex-wrap gap-7 items-start">
        <section aria-label="Rekomendasi rekan" className="flex-[999_1_540px] min-w-0 flex flex-col gap-[18px]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="group" aria-label="Filter peran" className="flex flex-wrap gap-2">
              {["all", ...gaps].map((f) => (
                <button key={f} type="button" aria-pressed={role === f} onClick={() => setRole(f)} className={`h-11 px-4 rounded-full border-[1.5px] text-sm cursor-pointer ${role === f ? "border-connect-fg bg-connect-fg text-white font-semibold" : "border-line-2 bg-white font-medium"}`}>{f === "all" ? "Semua" : f}</button>
              ))}
            </div>
            <span className="text-sm text-ink-3" aria-live="polite">{cands.data?.candidates.length ?? 0} rekomendasi · paling klop di atas</span>
          </div>

          {cands.loading && !cands.data && <p role="status" className="text-ink-2">Mencari partner…</p>}
          {cands.data && cands.data.candidates.length < 3 && (
            <div className="rounded-2xl border border-dashed border-connect/50 bg-[#F4FBFB] p-5 text-sm text-ink-2">
              <strong className="text-ink">Kandidatnya masih sedikit.</strong> Ajak temanmu dari jurusan lain buat daftar dan nyalain profil publik — rekomendasinya makin banyak begitu mereka gabung.
              <button className="btn-secondary h-11 px-4 text-sm mt-3 block" onClick={() => { const url = location.origin; navigator.share ? navigator.share({ title: "NEXUS", url }).catch(() => {}) : navigator.clipboard?.writeText(url).then(() => setMsg("Link NEXUS disalin")); }}>Bagikan NEXUS</button>
            </div>
          )}
          {cands.data?.candidates.map((p) => (
            <article key={p.userId} className="card p-5 sm:p-6 flex flex-wrap gap-5 items-start">
              <Avatar name={p.name} size={56} />
              <div className="flex-[1_1_260px] min-w-0 flex flex-col gap-2.5">
                <div><div className="text-[17px] font-bold">{p.name}</div><div className="text-sm text-ink-3">{p.role}{p.major && ` · ${p.major}`}</div></div>
                <div className="flex flex-wrap gap-1.5">{p.skills.map((s) => <span key={s} className="text-[13px] font-semibold px-[11px] py-[5px] rounded-full bg-[#F2F4F8]">{s}</span>)}</div>
                <div className="flex gap-2 items-start text-sm leading-normal text-[#134E4A] bg-[#EAF7F8] rounded-xl px-3 py-2.5"><Icon name="check" size={18} sw={2.2} className="flex-none mt-px text-connect-fg" /><span><strong>Kenapa klop:</strong> {p.reason}</span></div>
              </div>
              <div className="flex flex-col items-end gap-3 ml-auto">
                <div className="text-right"><div className="text-[28px] font-extrabold text-connect-fg leading-none">{p.match}%</div><div className="text-xs font-semibold text-ink-3 mt-1">match</div></div>
                {invited.has(p.userId)
                  ? <button className="btn h-11 px-4 text-sm bg-[#EAF7F8] border border-[#A7DDE3] text-connect-fg" disabled={busy === p.userId} onClick={() => act(p.userId, () => api(`/api/projects/${t!.projectId}/invites?userId=${p.userId}`, { method: "DELETE" }))}><Icon name="check" size={16} sw={2.6} />Udah diajak · batalkan</button>
                  : <button className="btn-primary h-11 px-[18px] text-sm" disabled={!t || busy === p.userId || !t.isOwner || isMember(p.userId)} onClick={() => act(p.userId, () => api(`/api/projects/${t!.projectId}/invites`, { method: "POST", json: { userId: p.userId, role: p.role } }))}>Ajak ke tim</button>}
              </div>
            </article>
          ))}
          {msg && <p role="alert" className="m-0 text-sm font-semibold text-[#B42318]">{msg}</p>}
        </section>

        <aside aria-labelledby="team-h" className="flex-[1_1_330px] min-w-0 flex flex-col gap-4">
          <div className="card flex flex-col gap-4">
            <div className="flex justify-between items-center gap-2"><h2 id="team-h" className="m-0 text-lg font-bold truncate">Tim {t?.title ?? ""}</h2><span className="text-[13px] font-bold text-connect-fg bg-connect-tint px-2.5 py-1 rounded-full whitespace-nowrap">{accepted.length} orang</span></div>
            {t?.members.map((m) => (
              <div key={m.userId} className="flex items-center gap-3 p-3 rounded-[14px] bg-bg">
                <Avatar name={m.name} size={40} />
                <div className="flex-1 min-w-0"><div className="text-sm font-bold truncate">{m.name}</div><div className="text-[13px] text-ink-3 truncate">{m.role}</div></div>
                {m.status === "invited" && (
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs font-semibold text-ink-3 text-right">Nunggu konfirmasi</span>
                    {t.isOwner && <button type="button" aria-label={`Batalkan ajakan ke ${m.name}`} disabled={busy === m.userId} onClick={() => act(m.userId, () => api(`/api/projects/${t.projectId}/invites?userId=${m.userId}`, { method: "DELETE" }))} className="min-h-11 px-2 text-xs font-bold text-primary bg-transparent border-0 cursor-pointer">Batalkan</button>}
                  </div>
                )}
              </div>
            ))}
            <div className="border-t border-[#EEF0F6] pt-3.5 flex flex-col gap-2">
              <span className="text-[13px] font-semibold text-ink-2">Skill yang dibutuhin proyek</span>
              <div className="flex flex-wrap gap-1.5">
                {(cands.data ? [...gaps] : []).map((s) => {
                  const filled = accepted.some((m) => m.skills.some((x) => x.name === s && x.level >= 3));
                  return filled
                    ? <span key={s} className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-[11px] py-[5px] rounded-full bg-grow-tint text-grow-fg"><Icon name="check" size={14} sw={2.8} />{s}</span>
                    : <span key={s} className="text-[13px] font-semibold px-[11px] py-[5px] rounded-full bg-white border border-dashed border-impact-fg text-impact-fg">{s}</span>;
                })}
                {cands.data && gaps.length === 0 && <span className="text-[13px] text-ink-3">Semua skill on target</span>}
              </div>
            </div>
            <p className="m-0 text-xs text-ink-3">Maksimal 5 anggota. Undangan berlaku 7 hari.</p>
          </div>
          <Bridge tone="violet"><strong>Lanjut kepake di CREATE:</strong> anggota tim yang menerima otomatis bisa melihat dan mengedit kanvas proyek.</Bridge>
          <Link href="/create" className="btn-primary h-[50px] rounded-[14px]">Lanjut ke CREATE <Icon name="arrow" size={18} sw={2.2} /></Link>
        </aside>
      </div>
    </>
  );
}
