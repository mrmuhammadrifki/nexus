"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { Field } from "./auth-form";

export function ProfileForm({ initial }: { initial: { campus: string; major: string; semester: number | null } }) {
  const router = useRouter();
  const [f, setF] = useState({ campus: initial.campus, major: initial.major, semester: initial.semester ? String(initial.semester) : "" });
  const [err, setErr] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const errors: Record<string, string> = {};

    const campus = f.campus.trim();
    if (!campus) errors.campus = "Nama kampus wajib diisi";
    else if (campus.length < 2) errors.campus = "Nama kampus minimal 2 karakter";

    const major = f.major.trim();
    if (!major) errors.major = "Nama jurusan wajib diisi";
    else if (major.length < 2) errors.major = "Nama jurusan minimal 2 karakter";

    const sem = Number(f.semester);
    if (!f.semester || isNaN(sem)) errors.semester = "Semester wajib diisi";
    else if (sem < 1 || sem > 14) errors.semester = "Semester harus antara 1 sampai 14";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setBusy(true);
    try {
      await api("/api/me", { method: "PATCH", json: { campus, major, semester: sem } });
      router.push("/know"); router.refresh();
    } catch (e: any) { setErr(e.message === "Input tidak valid" ? "Cek lagi isianmu (semester 1–14)" : e.message); setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <Field
        label="Kampus"
        value={f.campus}
        onChange={(v) => { setF({ ...f, campus: v }); if (fieldErrors.campus) setFieldErrors({ ...fieldErrors, campus: "" }); }}
        placeholder="mis. STMIK Widya Utama"
        autoComplete="organization"
        required
        error={fieldErrors.campus}
      />
      <Field
        label="Jurusan"
        value={f.major}
        onChange={(v) => { setF({ ...f, major: v }); if (fieldErrors.major) setFieldErrors({ ...fieldErrors, major: "" }); }}
        placeholder="mis. Informatika"
        required
        error={fieldErrors.major}
      />
      <Field
        label="Semester"
        type="number"
        inputMode="numeric"
        min={1}
        max={14}
        value={f.semester}
        onChange={(v) => { setF({ ...f, semester: v }); if (fieldErrors.semester) setFieldErrors({ ...fieldErrors, semester: "" }); }}
        required
        error={fieldErrors.semester}
        hint="Pilih semester 1 sampai 14"
      />
      {err && <p role="alert" className="m-0 text-sm font-semibold text-[#B42318] bg-[#FEF3F2] rounded-xl px-3.5 py-2.5">{err}</p>}
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Nyimpen…" : "Lanjut ke KNOW"}</button>
    </form>
  );
}
