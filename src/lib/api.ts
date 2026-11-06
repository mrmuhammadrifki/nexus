import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function requireUser() {
  const s = await auth();
  if (!s?.user?.id) throw new HttpError(401, "Belum login");
  await connectDB();
  // JWT bisa lebih panjang umurnya dari akun (mis. akun sudah dihapus).
  if (!(await User.exists({ _id: s.user.id }))) throw new HttpError(401, "Akun tidak ditemukan");
  return s.user.id;
}

/** Bungkus handler: ubah error jadi JSON yang rapi, tanpa membocorkan detail internal. */
export function route<A extends unknown[]>(fn: (...a: A) => Promise<unknown>) {
  return async (...a: A) => {
    try {
      const out = await fn(...a);
      return out instanceof Response ? out : NextResponse.json(out);
    } catch (e) {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
      if (e instanceof ZodError) return NextResponse.json({ error: "Input tidak valid", issues: e.issues.map((i) => i.message) }, { status: 400 });
      console.error("[api]", e);
      return NextResponse.json({ error: "Terjadi kesalahan di server" }, { status: 500 });
    }
  };
}
