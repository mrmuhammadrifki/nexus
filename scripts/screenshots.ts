/**
 * Membuat screenshot untuk README dari aplikasi yang BENAR-BENAR berjalan.
 * Memakai stack uji sementara (mongod lokal + build terpisah) dan data FIKTIF; tidak menyentuh database `.env.local`.
 *   npm run docs:screenshots
 */
import { chromium, type BrowserContext, type Page } from "@playwright/test";
import path from "node:path";
import { startStack } from "../tests/support/stack";

const OUT = path.resolve(process.cwd(), "docs/screenshots");

(async () => {
  const stack = await startStack();
  process.env.TEST_BASE_URL = stack.baseUrl; process.env.TEST_MONGO_URI = stack.mongoUri;
  const { Api, newUser, newPartner, completeKnow } = await import("../tests/support/client");
  const browser = await chromium.launch({ channel: "chrome" });
  try {
    /* ---------- data fiktif: persona Dina + calon partner ---------- */
    const dina = await newUser("Dina Pratama", { visibility: "public" });
    await dina.patch("/api/me", { campus: "STMIK Widya Utama", major: "Informatika", semester: 5 });
    await completeKnow(dina, { interests: ["Teknologi", "Lingkungan", "Pendidikan"], goals: ["lomba", "proyek"], workStyle: "analitis",
      skills: { "Analisis Data": 4, Python: 4, SQL: 3, Riset: 3, Menulis: 3, "Manajemen Proyek": 3 } });
    await dina.put("/api/profile", { targetRole: "product-data-analyst" });
    await dina.get("/api/grow/plan"); await dina.patch("/api/grow/plan/items/0", { done: true });
    await dina.put("/api/profile", { growReviewed: true });

    const raka = await newPartner("Raka Pratama", { "UI/UX": 5, "Desain Grafis": 4, Frontend: 3 }, ["Teknologi", "Lingkungan"]);
    const salsa = await newPartner("Salsa Nabila", { "Public Speaking": 5, "Model Bisnis": 5, Riset: 4 }, ["Pendidikan", "Lingkungan"]);
    await newPartner("Bima Aditya", { "Public Speaking": 4, Menulis: 4, "Desain Grafis": 3 }, ["Pendidikan"]);
    await newPartner("Nadia Putri", { "UI/UX": 4, Frontend: 5, "Manajemen Proyek": 4 }, ["Teknologi"]);
    for (const p of [raka, salsa]) await p.patch("/api/me", { major: p === raka ? "DKV" : "Manajemen" });

    const idOf = async (u: InstanceType<typeof Api>) => (await (await import("../tests/support/db")).withDb(async (db) => String((await db.collection("users").findOne({ email: u.email }))!._id)));
    const t = (await dina.get("/api/team")).json; const pid = t.projectId as string;
    await dina.post(`/api/projects/${pid}/invites`, { userId: await idOf(raka), role: "UI/UX Designer" });
    await dina.post(`/api/projects/${pid}/invites`, { userId: await idOf(salsa), role: "Bisnis & Pitching" });
    await raka.post(`/api/invites/${pid}/respond`, { accept: true }); // Salsa dibiarkan "Nunggu konfirmasi"
    const put = (section: string, text: string) => dina.patch(`/api/projects/${pid}/canvas`, { section, text });
    await dina.patch(`/api/projects/${pid}/canvas`, { title: "SiPilah", tagline: "Aplikasi pemilahan sampah kampus" });
    await put("problem", "Tiap hari sampah di kantin kampus tercampur antara organik, plastik, dan kertas, sehingga sulit didaur ulang dan menumpuk di TPS. Dari observasi kami selama seminggu, sebagian besar sampah tidak terpilah.");
    await put("rootCause", "Penyebab utama: mahasiswa tidak tahu sampah harus dibuang ke tempat yang mana. Penyebab pendukung: 1) label tempat sampah tidak jelas, 2) tidak ada umpan balik saat memilah dengan benar.");
    await put("solution", "SiPilah adalah aplikasi web untuk memindai sampah dengan kamera HP agar pengguna langsung tahu harus membuangnya ke mana. Setiap memilah dengan benar, pengguna mendapat poin sehingga memilah menjadi kebiasaan.");
    await put("technology", "Aplikasi web responsif (PWA) agar tanpa instal, kamera HP untuk pengenalan jenis sampah, database sederhana untuk menyimpan poin pengguna.");

    const shot = async (ctx: BrowserContext, file: string, url: string, o: { w?: number; h?: number; full?: boolean; scale?: number; act?: (p: Page) => Promise<void> } = {}) => {
      const page = await ctx.newPage();
      await page.setViewportSize({ width: o.w ?? 1440, height: o.h ?? 900 });
      await page.goto(stack.baseUrl + url); await page.waitForLoadState("networkidle");
      await o.act?.(page); await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(OUT, file), fullPage: o.full ?? false });
      console.log("✓", file); await page.close();
    };
    const mk = async (api?: InstanceType<typeof Api>, mobile = false) => {
      const ctx = await browser.newContext({ reducedMotion: "reduce", deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile, locale: "id-ID" });
      if (api) await ctx.addCookies(Object.entries(api.jar).map(([name, value]) => ({ name, value, url: stack.baseUrl })));
      return ctx;
    };

    /* ---------- desktop ---------- */
    const pub = await mk(); const ctx = await mk(dina);
    await shot(pub, "01-landing.png", "/", { h: 900 });
    await shot(ctx, "02-dashboard.png", "/dashboard", { full: true });
    await shot(ctx, "03-know-skill.png", "/know?step=1", { h: 900 });
    await shot(ctx, "04-know-level.png", "/know?step=2", { full: true });
    await shot(ctx, "05-know-peran.png", "/know?step=4", { full: true });
    await shot(ctx, "06-semua-skill.png", "/know/skills", { h: 900, act: async (p) => { await p.getByLabel("Cari skill").fill("data"); } });
    await shot(ctx, "07-grow.png", "/grow", { full: true });
    await shot(ctx, "08-connect.png", "/connect", { full: true });
    await shot(ctx, "09-create-template.png", "/create?s=4", { full: true });

    /* lengkapi kanvas → nilai → IMPACT */
    await put("features", "1) Pindai sampah dengan kamera — supaya tahu tempat yang benar\n2) Panduan jenis sampah — supaya paham alasannya\n3) Poin & progres kebiasaan — supaya mau memakai terus");
    await put("impact", "Persentase sampah terpilah dengan benar di kantin naik dari 20% menjadi 60% dalam satu semester, diukur lewat audit mingguan. Pengelola setelah lomba: BEM bersama pengelola kantin.");
    await dina.post(`/api/projects/${pid}/assess`);
    await shot(ctx, "10-impact.png", "/impact", { full: true, act: async (p) => { await p.getByRole("button", { name: /Kebutuhan pengguna/ }).click(); } });

    /* ---------- mobile (390×844) ---------- */
    const m = await mk(dina, true); const mp = await mk(undefined, true);
    await shot(mp, "m1-landing.png", "/", { w: 390, h: 844 });
    await shot(m, "m2-dashboard.png", "/dashboard", { w: 390, h: 844 });
    await shot(m, "m3-know-level.png", "/know?step=2", { w: 390, h: 844 });
    await shot(m, "m4-create.png", "/create?s=0", { w: 390, h: 844 });
  } finally { await browser.close(); await stack.stop(); }
})().catch((e) => { console.error(e); process.exit(1); });
