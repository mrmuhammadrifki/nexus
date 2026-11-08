"use client";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { api, useFetch } from "@/lib/client";
import { Field } from "./auth-form";
import { Icon } from "./ui";
import { SettingsSkeleton } from "./skeletons";

type Me = { name: string; email: string; campus: string; major: string; semester: number | null; visibility: "public" | "private" };

export function SettingsView() {
  const router = useRouter();
  const { data, setData } = useFetch<Me>("/api/me");
  const [msg, setMsg] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState("");
  if (!data) return <SettingsSkeleton />;

  const set = (p: Partial<Me>) => setData({ ...data, ...p });
  async function save(patch: Partial<Me>, ok = "Tersimpan") {
    setBusy(true); setErr(""); setMsg("");
    try { await api("/api/me", { method: "PATCH", json: patch }); setMsg(ok); router.refresh(); } catch (e: any) { setErr(e.message === "Input tidak valid" ? "Cek kembali data yang Anda masukkan" : e.message); } finally { setBusy(false); }
  }

  function handleSaveProfile() {
    if (!data) return;
    setErr("");
    const errors: Record<string, string> = {};

    const name = data.name?.trim();
    if (!name) errors.name = "Nama wajib diisi";
    else if (name.length < 2) errors.name = "Nama minimal 2 karakter";

    const campus = data.campus?.trim();
    if (!campus) errors.campus = "Nama kampus wajib diisi";
    else if (campus.length < 2) errors.campus = "Nama kampus minimal 2 karakter";

    const major = data.major?.trim();
    if (!major) errors.major = "Nama jurusan wajib diisi";
    else if (major.length < 2) errors.major = "Nama jurusan minimal 2 karakter";

    const sem = data.semester;
    if (sem === null || sem === undefined || isNaN(sem)) errors.semester = "Semester wajib diisi";
    else if (sem < 1 || sem > 14) errors.semester = "Semester harus antara 1 sampai 14";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErr("Mohon lengkapi isian wajib di bawah");
      return;
    }

    setFieldErrors({});
    save({ name, campus, major, semester: sem });
  }

  async function exportData() {
    const d = await api("/api/me?export=1");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(d, null, 2)], { type: "application/json" }));
    a.download = "nexus-data-saya.json"; a.click(); URL.revokeObjectURL(a.href);
  }
  async function del() {
    setBusy(true);
    try { await api("/api/me", { method: "DELETE" }); await signOut({ callbackUrl: "/" }); } catch (e: any) { setErr(e.message); setBusy(false); }
  }
  const pub = data.visibility === "public";

  return (
    <>
      <h1 className="m-0 text-[28px] sm:text-4xl font-extrabold tracking-[-0.025em]">Pengaturan</h1>
      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <section className="card flex flex-col gap-4" aria-labelledby="p-h">
          <h2 id="p-h" className="m-0 text-lg font-bold">Profil</h2>
          <Field
            label="Nama"
            value={data.name}
            onChange={(v) => { set({ name: v }); if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: "" }); }}
            required
            error={fieldErrors.name}
          />
          <Field
            label="Kampus"
            value={data.campus}
            onChange={(v) => { set({ campus: v }); if (fieldErrors.campus) setFieldErrors({ ...fieldErrors, campus: "" }); }}
            required
            error={fieldErrors.campus}
          />
          <Field
            label="Jurusan"
            value={data.major}
            onChange={(v) => { set({ major: v }); if (fieldErrors.major) setFieldErrors({ ...fieldErrors, major: "" }); }}
            required
            error={fieldErrors.major}
          />
          <Field
            label="Semester"
            type="number"
            min={1}
            max={14}
            inputMode="numeric"
            value={String(data.semester ?? "")}
            onChange={(v) => { set({ semester: Number(v) || null }); if (fieldErrors.semester) setFieldErrors({ ...fieldErrors, semester: "" }); }}
            required
            error={fieldErrors.semester}
          />
          <button className="btn-primary self-start" disabled={busy} onClick={handleSaveProfile}>Simpan profil</button>
        </section>

        <div className="flex flex-col gap-6">
          <section className="card flex flex-col gap-3.5" aria-labelledby="v-h">
            <h2 id="v-h" className="m-0 text-lg font-bold">Privasi</h2>
            <div className="flex items-start gap-4 justify-between">
              <div><div className="text-[15px] font-bold flex items-center gap-2"><Icon name={pub ? "eye" : "lock"} size={18} />{pub ? "Profil publik" : "Profil privat"}</div>
                <p className="mt-1.5 mb-0 text-sm leading-relaxed text-ink-2">{pub ? "Nama, jurusan, skill, dan minatmu bisa muncul di rekomendasi partner pengguna lain." : "Kamu tidak muncul di pencarian partner. Nyalakan kalau mau ditemukan dan diajak ke tim."}</p></div>
              <button role="switch" aria-checked={pub} aria-label="Profil publik" disabled={busy} onClick={() => { set({ visibility: pub ? "private" : "public" }); save({ visibility: pub ? "private" : "public" }, pub ? "Profilmu sekarang privat" : "Profilmu sekarang publik"); }}
                className="flex-none w-16 h-11 grid place-items-center bg-transparent border-0 p-0 cursor-pointer"><span className={`relative block w-14 h-8 rounded-full transition-colors ${pub ? "bg-primary" : "bg-line-2"}`}><span className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${pub ? "left-7" : "left-1"}`} /></span></button>
            </div>
            <p className="m-0 text-xs text-ink-3">Ke AI Coach hanya dikirim isi kanvas dan peran anggota — tanpa nama, email, atau kampus.</p>
          </section>

          <section className="card flex flex-col gap-3.5" aria-labelledby="d-h">
            <h2 id="d-h" className="m-0 text-lg font-bold">Akun & data</h2>
            <p className="m-0 text-sm text-ink-2">Masuk sebagai <b>{data.email}</b></p>
            <div className="flex flex-wrap gap-2.5">
              <button className="btn-secondary" onClick={exportData}>Unduh datamu (JSON)</button>
              <button className="btn-secondary" onClick={() => signOut({ callbackUrl: "/" })}>Keluar</button>
            </div>
            <details className="rounded-xl border border-[#FDA29B] bg-[#FFFBFA] p-3.5">
              <summary className="cursor-pointer text-sm font-bold text-[#B42318] min-h-11 flex items-center">Hapus akun</summary>
              <p className="mt-2.5 mb-3 text-sm leading-relaxed text-ink-2">Profil, rencana belajar, proyek milikmu beserta kanvas dan penilaiannya dihapus permanen. Keanggotaanmu di tim lain dilepas. Tidak bisa dibatalkan.</p>
              <label className="flex flex-col gap-1.5 text-sm font-semibold">Ketik <code>HAPUS</code> untuk lanjut<input className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></label>
              <button className="btn mt-3 bg-[#B42318] text-white" disabled={confirm !== "HAPUS" || busy} onClick={del}>Hapus akun saya</button>
            </details>
          </section>
          <div role="status" aria-live="polite">{msg && <p className="m-0 text-sm font-semibold text-grow-fg">{msg}</p>}{err && <p role="alert" className="m-0 text-sm font-semibold text-[#B42318]">{err}</p>}</div>
        </div>
      </div>
    </>
  );
}
