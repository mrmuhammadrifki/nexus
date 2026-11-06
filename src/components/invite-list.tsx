"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { Avatar } from "./ui";

export type Invite = { id: string; projectTitle: string; owner: string; role?: string; invitedAt: string };

export function InviteList({ invites }: { invites: Invite[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  async function respond(id: string, accept: boolean) {
    setBusy(id); setErr("");
    try { await api(`/api/invites/${id}/respond`, { method: "POST", json: { accept } }); router.refresh(); }
    catch (e: any) { setErr(e.message); } finally { setBusy(""); }
  }
  return (
    <section id="undangan" aria-labelledby="inv-h" className="card p-5 border-connect/40 bg-[#F4FBFB] flex flex-col gap-3.5 scroll-mt-4">
      <h2 id="inv-h" className="m-0 text-base font-bold">Undangan masuk ({invites.length})</h2>
      {invites.map((i) => (
        <div key={i.id} className="flex flex-wrap items-center gap-3 bg-white border border-line rounded-2xl p-3.5">
          <Avatar name={i.owner} size={40} />
          <div className="flex-1 min-w-[180px]"><div className="text-sm"><b>{i.owner}</b> ngajak kamu gabung proyek <b>{i.projectTitle}</b></div><div className="text-xs text-ink-3">Berlaku 7 hari sejak diajak</div></div>
          <div className="flex gap-2">
            <button className="btn-secondary h-11 px-4 text-sm" disabled={busy === i.id} onClick={() => respond(i.id, false)}>Tolak</button>
            <button className="btn-primary h-11 px-4 text-sm" disabled={busy === i.id} onClick={() => respond(i.id, true)}>Terima</button>
          </div>
        </div>
      ))}
      {err && <p role="alert" className="m-0 text-sm font-semibold text-[#B42318]">{err}</p>}
    </section>
  );
}
