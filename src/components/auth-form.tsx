"use client";
import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";

export function AuthForm({ mode, google }: { mode: "masuk" | "daftar"; google: boolean }) {
  const router = useRouter();
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const reg = mode === "daftar";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const errors: Record<string, string> = {};

    if (reg) {
      if (!f.name.trim()) errors.name = "Nama wajib diisi";
      else if (f.name.trim().length < 2) errors.name = "Nama minimal 2 karakter";
    }

    if (!f.email.trim()) {
      errors.email = "Email wajib diisi";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) {
      errors.email = "Format email tidak valid (contoh: nama@kampus.ac.id)";
    }

    if (!f.password) {
      errors.password = "Password wajib diisi";
    } else if (reg && f.password.length < 8) {
      errors.password = "Password minimal 8 karakter";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setBusy(true);
    try {
      if (reg) await api("/api/register", { method: "POST", json: f });
      const r = await signIn("credentials", { email: f.email, password: f.password, redirect: false });
      if (r?.error) throw new Error("Email atau password salah");
      router.push("/dashboard"); router.refresh();
    } catch (e: any) { setErr(e.message); setBusy(false); }
  }

  return (
    <>
      <div>
        <h1 className="m-0 text-2xl font-extrabold tracking-tight">{reg ? "Bikin akun NEXUS" : "Masuk ke NEXUS"}</h1>
        <p className="mt-1.5 mb-0 text-sm text-ink-2">{reg ? "100% gratis. Cukup email dan password." : "Lanjutin perjalananmu dari terakhir kamu berhenti."}</p>
      </div>
      {google && (
        <>
          <button type="button" className="btn-secondary w-full" onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.4z"/><path fill="#34A853" d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.6 14.7a7.200 7.200 0 0 1 0-4.600v-3H1.800a12 12 0 0 0 0 10.600l3.800-3z"/><path fill="#EA4335" d="M12 4.800c1.700 0 3.200.6 4.400 1.700l3.300-3.300A12 12 0 0 0 1.800 7.100l3.800 3C6.500 6.800 9 4.800 12 4.800z"/></svg>
            Lanjut dengan Google
          </button>
          <div className="flex items-center gap-3 text-xs text-ink-3"><span className="flex-1 h-px bg-line" />atau pakai email<span className="flex-1 h-px bg-line" /></div>
        </>
      )}
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        {reg && (
          <Field
            label="Nama Lengkap"
            value={f.name}
            onChange={(v) => { setF({ ...f, name: v }); if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: "" }); }}
            autoComplete="name"
            required
            error={fieldErrors.name}
            placeholder="mis. Muhammad Rifki"
          />
        )}
        <Field
          label="Email"
          type="email"
          value={f.email}
          onChange={(v) => { setF({ ...f, email: v }); if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: "" }); }}
          autoComplete="email"
          required
          error={fieldErrors.email}
          placeholder="nama@email.com"
        />
        <Field
          label="Password"
          type="password"
          value={f.password}
          onChange={(v) => { setF({ ...f, password: v }); if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: "" }); }}
          autoComplete={reg ? "new-password" : "current-password"}
          required
          error={fieldErrors.password}
          hint={reg ? "Minimal 8 karakter" : undefined}
        />
        {err && <p role="alert" className="m-0 text-sm font-semibold text-[#B42318] bg-[#FEF3F2] rounded-xl px-3.5 py-2.5">{err}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Sebentar…" : reg ? "Daftar" : "Masuk"}</button>
      </form>
      <p className="m-0 text-sm text-ink-2 text-center">
        {reg ? "Udah punya akun? " : "Belum punya akun? "}
        <Link href={reg ? "/masuk" : "/daftar"} className="font-bold text-primary">{reg ? "Masuk" : "Daftar"}</Link>
      </p>
    </>
  );
}

export function Field({
  label,
  value,
  onChange,
  type = "text",
  hint,
  required,
  error,
  className,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  hint?: string;
  required?: boolean;
  error?: string;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type" | "required" | "className">) {
  return (
    <label className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <span className="text-sm font-semibold flex items-center justify-between">
        <span>
          {label}
          {required && <span className="text-[#B42318] ml-1" title="Wajib diisi">*</span>}
        </span>
        {required && <span className="text-xs font-normal text-ink-3">Wajib</span>}
      </span>
      <input
        className={`input ${error ? "input-error" : ""}`}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        aria-invalid={!!error}
        {...rest}
      />
      {error ? (
        <span role="alert" className="text-xs font-semibold text-[#B42318]">{error}</span>
      ) : hint ? (
        <span className="text-xs text-ink-3">{hint}</span>
      ) : null}
    </label>
  );
}
