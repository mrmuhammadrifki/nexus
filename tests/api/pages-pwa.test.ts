import { beforeAll, describe, expect, it } from "vitest";
import { Api, BASE, newUser, completeKnow } from "../support/client";
import { resetDb } from "../support/db";

beforeAll(resetDb);
const get = (p: string) => fetch(BASE() + p, { redirect: "manual" });

describe("halaman publik & penjaga halaman", () => {
  it.each(["/", "/masuk", "/daftar", "/offline"])("%s → 200 HTML", async (p) => {
    const r = await get(p); expect(r.status).toBe(200); expect(r.headers.get("content-type")).toMatch(/text\/html/);
  });
  it.each(["/dashboard", "/know", "/know/skills", "/know/peran", "/grow", "/connect", "/create", "/impact", "/pengaturan", "/onboarding"])("%s tanpa login → 307 ke /masuk", async (p) => {
    const r = await get(p); expect(r.status).toBe(307); expect(r.headers.get("location")).toMatch(/\/masuk$/);
  });
  it("sudah login tapi profil belum lengkap → diarahkan ke /onboarding; setelah lengkap → 200", async () => {
    const u = await newUser("Onboard", { onboard: false });
    for (const p of ["/dashboard", "/know", "/create"]) { const r = await u.req("GET", p); expect(r.status, p).toBe(307); }
    expect((await u.patch("/api/me", { campus: "Kampus Uji", major: "Informatika", semester: 3 })).status).toBe(200);
    expect((await u.req("GET", "/dashboard")).status).toBe(200);
    expect((await u.req("GET", "/masuk")).status).toBe(307); // sudah login → /dashboard
  });
  it("landing: judul, CTA ke /daftar untuk tamu dan ke /dashboard untuk yang sudah login", async () => {
    const html = await (await get("/")).text();
    expect(html).toContain("Dari “aku bisa apa, ya?” jadi proyek yang beneran berdampak.");
    expect(html).toContain("Gas, mulai sekarang"); expect(html).toContain('href="/daftar"');
    const u = await newUser("Login"); const authed = (await u.req("GET", "/")).text;
    expect(authed).toContain('href="/dashboard"'); expect(authed).toContain("Buka dashboard");
  });
  it("halaman tidak membocorkan teknologi (tanpa X-Powered-By)", async () => {
    expect((await get("/")).headers.get("x-powered-by")).toBeNull();
  });
  it("halaman terautentikasi merender konten inti", async () => {
    const u = await newUser("Isi"); await completeKnow(u);
    const dash = (await u.req("GET", "/dashboard")).text.replace(/<!--.*?-->/g, ""); // buang penanda hidrasi React
    expect(dash).toContain("Hai Isi, welcome back!"); expect(dash).toContain("Perjalananmu");
    for (const p of ["/know", "/know/skills", "/know/peran", "/grow", "/connect", "/create", "/impact", "/pengaturan"]) expect((await u.req("GET", p)).status, p).toBe(200);
  });
});

describe("PWA", () => {
  it("manifest valid: nama, mode standalone, tema, ikon 192/512 + maskable", async () => {
    const r = await get("/manifest.webmanifest"); expect(r.status).toBe(200);
    const m = await r.json();
    expect(m).toMatchObject({ short_name: "NEXUS", display: "standalone", start_url: "/dashboard", scope: "/", lang: "id", theme_color: "#2450e6", background_color: "#f7f8fc" });
    const sizes = m.icons.map((i: any) => `${i.sizes}:${i.purpose}`);
    expect(sizes).toEqual(expect.arrayContaining(["192x192:any", "512x512:any", "512x512:maskable"]));
  });
  it.each([["/icons/icon-192.png", 192], ["/icons/icon-512.png", 512], ["/icons/maskable-512.png", 512], ["/icons/apple-touch-icon.png", 180]])("%s adalah PNG %ipx", async (p, size) => {
    const r = await get(p); expect(r.status).toBe(200); expect(r.headers.get("content-type")).toBe("image/png");
    const b = Buffer.from(await r.arrayBuffer());
    expect(b.subarray(1, 4).toString()).toBe("PNG");
    expect(b.readUInt32BE(16)).toBe(size); expect(b.readUInt32BE(20)).toBe(size);
  });
  it("landing menautkan manifest, theme-color, dan ikon Apple", async () => {
    const h = await (await get("/")).text();
    expect(h).toContain('rel="manifest" href="/manifest.webmanifest"'); expect(h).toContain('name="theme-color" content="#2450e6"');
    expect(h).toContain("apple-touch-icon");
  });
  it("service worker: tidak di-cache browser, scope /, tidak menyimpan /api, ada fallback /offline", async () => {
    const r = await get("/sw.js"); expect(r.status).toBe(200);
    expect(r.headers.get("cache-control")).toMatch(/no-cache|no-store/); expect(r.headers.get("service-worker-allowed")).toBe("/");
    const js = await r.text();
    expect(js).toContain('addEventListener("fetch"'); expect(js).toContain('"/offline"');
    expect(js).toMatch(/pathname\.startsWith\("\/api\/"\)/); // /api dilewatkan, tidak di-cache
  });
});
