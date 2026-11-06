/** Klien HTTP uji dengan cookie jar (mensimulasikan satu browser/pengguna). */
export const BASE = () => { const b = process.env.TEST_BASE_URL; if (!b) throw new Error("TEST_BASE_URL belum diset"); return b; };

export type Res<T = any> = { status: number; json: T; text: string };

export class Api {
  jar: Record<string, string> = {};
  email = ""; password = "password123"; name = "";

  async req<T = any>(method: string, path: string, body?: unknown, init: { form?: URLSearchParams; headers?: Record<string, string> } = {}): Promise<Res<T>> {
    const headers: Record<string, string> = { cookie: Object.entries(this.jar).map(([k, v]) => `${k}=${v}`).join("; "), ...init.headers };
    let payload: BodyInit | undefined;
    if (init.form) { payload = init.form; headers["content-type"] = "application/x-www-form-urlencoded"; }
    else if (body !== undefined) { payload = JSON.stringify(body); headers["content-type"] = "application/json"; }
    const r = await fetch(BASE() + path, { method, headers, body: payload, redirect: "manual" });
    for (const c of r.headers.getSetCookie()) { const [kv] = c.split(";"); const i = kv.indexOf("="); this.jar[kv.slice(0, i)] = kv.slice(i + 1); }
    const text = await r.text(); let json: any; try { json = JSON.parse(text); } catch { json = undefined; }
    return { status: r.status, json, text };
  }
  get = <T = any>(p: string) => this.req<T>("GET", p);
  post = <T = any>(p: string, b?: unknown) => this.req<T>("POST", p, b ?? {});
  put = <T = any>(p: string, b?: unknown) => this.req<T>("PUT", p, b ?? {});
  patch = <T = any>(p: string, b?: unknown) => this.req<T>("PATCH", p, b ?? {});
  del = <T = any>(p: string) => this.req<T>("DELETE", p);

  async register(name: string, email: string, password = "password123") {
    this.name = name; this.email = email; this.password = password;
    return this.post("/api/register", { name, email, password });
  }
  async login(email = this.email, password = this.password) {
    const { json } = await this.get("/api/auth/csrf");
    return this.req("POST", "/api/auth/callback/credentials", undefined, { form: new URLSearchParams({ csrfToken: json.csrfToken, email, password, json: "true" }) });
  }
}

let counter = 0;
const uid = () => `${Date.now().toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export type KnowInput = { interests?: string[]; skills?: Record<string, number>; goals?: string[]; workStyle?: string };

/** Pengguna baru yang sudah login dan profil dasarnya (kampus/jurusan/semester) lengkap. */
export async function newUser(name = "Uji Coba", opts: { visibility?: "public" | "private"; onboard?: boolean } = {}) {
  const u = new Api();
  const email = `${name.toLowerCase().replace(/[^a-z]/g, "")}.${uid()}@test.local`;
  await u.register(name, email);
  await u.login();
  if (opts.onboard !== false) await u.patch("/api/me", { campus: "Kampus Uji", major: "Informatika", semester: 5, ...(opts.visibility ? { visibility: opts.visibility } : {}) });
  return u;
}

/** Selesaikan KNOW (bidang, skill berlevel, target, gaya kerja). */
export async function completeKnow(u: Api, k: KnowInput = {}) {
  const skills = k.skills ?? { "Analisis Data": 4, Python: 4, SQL: 3 };
  return u.put("/api/profile", {
    interests: k.interests ?? ["Teknologi", "Pendidikan"],
    skillNames: Object.keys(skills),
    goals: k.goals ?? ["lomba"],
    workStyle: k.workStyle ?? "analitis",
    levels: Object.entries(skills).map(([name, level]) => ({ name, level })),
  });
}

/** Mitra siap diajak: publik, KNOW selesai dengan skill tertentu. */
export async function newPartner(name: string, skills: Record<string, number>, interests = ["Teknologi"]) {
  const p = await newUser(name, { visibility: "public" });
  await completeKnow(p, { skills, interests });
  return p;
}

export const CANVAS_KEYS = ["problem", "rootCause", "solution", "technology", "features", "impact"] as const;
export const FULL_CANVAS: Record<(typeof CANVAS_KEYS)[number], string> = {
  problem: "Mahasiswa di kantin kampus membuang sampah tercampur setiap hari, sekitar 300 kg per hari menurut observasi kami.",
  rootCause: "Penyebab utama: mahasiswa tidak tahu tempat sampah yang benar. Penyebab pendukung: label tidak jelas dan tidak ada umpan balik.",
  solution: "SiPilah adalah aplikasi web untuk memindai sampah dengan kamera agar tahu harus dibuang ke mana, plus poin agar menjadi kebiasaan.",
  technology: "Aplikasi web responsif (PWA), kamera HP untuk pengenalan gambar, database sederhana untuk poin.",
  features: "1) Pindai sampah 2) Panduan jenis sampah 3) Poin dan progres kebiasaan",
  impact: "Persentase sampah terpilah dengan benar naik dari 20% ke 60% dalam satu semester, dikelola BEM bersama pengelola kantin.",
};
export async function fillCanvas(u: Api, projectId: string, over: Partial<typeof FULL_CANVAS> = {}) {
  for (const k of CANVAS_KEYS) await u.patch(`/api/projects/${projectId}/canvas`, { section: k, text: over[k] ?? FULL_CANVAS[k] });
}
