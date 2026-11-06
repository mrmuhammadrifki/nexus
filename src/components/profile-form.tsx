"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { Field } from "./auth-form";

export function ProfileForm({ initial }: { initial: { campus: string; major: string; semester: number | null } }) {
  const router = useRouter();
  const [f, setF] = useState({ campus: initial.campus, major: initial.major, semester: initial.semester ? String(initial.semester) : "" });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      await api("/api/me", { method: "PATCH", json: { campus: f.campus, major: f.major, semester: Number(f.semester) } });
      router.push("/know"); router.refresh();
    } catch (e: any) { setErr(e.message === "Input tidak valid" ? "Cek lagi isianmu (semester 1–14)" : e.message); setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field label="Kampus" value={f.campus} onChange={(v) => setF({ ...f, campus: v })} placeholder="mis. STMIK Widya Utama" autoComplete="organization" />
      <Field label="Jurusan" value={f.major} onChange={(v) => setF({ ...f, major: v })} placeholder="mis. Informatika" />
      <Field label="Semester" type="number" inputMode="numeric" min={1} max={14} value={f.semester} onChange={(v) => setF({ ...f, semester: v })} />
      {err && <p role="alert" className="m-0 text-sm font-semibold text-[#B42318] bg-[#FEF3F2] rounded-xl px-3.5 py-2.5">{err}</p>}
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Nyimpen…" : "Lanjut ke KNOW"}</button>
    </form>
  );
}
