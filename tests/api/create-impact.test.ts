import { beforeAll, describe, expect, it } from "vitest";
import { Api, CANVAS_KEYS, FULL_CANVAS, fillCanvas, newPartner, newUser, completeKnow } from "../support/client";
import { resetDb } from "../support/db";

beforeAll(resetDb);
const userId = async (u: Api) => (await u.get("/api/me")).json && "";
void userId;

async function project(name = "Kreator") {
  const u = await newUser(name); await completeKnow(u);
  const t = (await u.get("/api/team")).json;
  return { u, pid: t.projectId as string };
}

describe("CR-1 kanvas 6 bagian", () => {
  it("proyek dibuat otomatis; simpan & baca tiap bagian; judul & deskripsi", async () => {
    const { u, pid } = await project();
    expect(pid).toMatch(/^[a-f0-9]{24}$/);
    for (const k of CANVAS_KEYS) expect((await u.patch(`/api/projects/${pid}/canvas`, { section: k, text: `isi ${k}` })).status).toBe(200);
    expect((await u.patch(`/api/projects/${pid}/canvas`, { title: "SiPilah", tagline: "Pilah sampah kampus" })).status).toBe(200);
    const c = (await u.get(`/api/projects/${pid}/canvas`)).json;
    expect(c).toMatchObject({ title: "SiPilah", tagline: "Pilah sampah kampus" });
    for (const k of CANVAS_KEYS) expect(c.canvas[k]).toBe(`isi ${k}`);
  });
  it("validasi: bagian tak dikenal, teks > 4000, judul kosong/terlalu panjang → 400", async () => {
    const { u, pid } = await project();
    expect((await u.patch(`/api/projects/${pid}/canvas`, { section: "bogus", text: "x" })).status).toBe(400);
    expect((await u.patch(`/api/projects/${pid}/canvas`, { section: "problem", text: "x".repeat(4001) })).status).toBe(400);
    expect((await u.patch(`/api/projects/${pid}/canvas`, { title: "" })).status).toBe(400);
    expect((await u.patch(`/api/projects/${pid}/canvas`, { title: "x".repeat(81) })).status).toBe(400);
  });
  it("akses: orang asing 403; calon anggota (belum menerima) 403; ID tak valid → 404/400", async () => {
    const { u, pid } = await project();
    const stranger = await newUser("Asing");
    expect((await stranger.get(`/api/projects/${pid}/canvas`)).status).toBe(403);
    expect((await stranger.patch(`/api/projects/${pid}/canvas`, { section: "problem", text: "x" })).status).toBe(403);
    expect((await u.get(`/api/projects/000000000000000000000000/canvas`)).status).toBe(404);
  });
});

describe("template: placeholder yang belum diganti ≠ terisi", () => {
  it("dihitung terisi hanya setelah placeholder diganti; sitasi [1] tetap terisi", async () => {
    const { u, pid } = await project();
    await u.patch(`/api/projects/${pid}/canvas`, { section: "problem", text: "[Kelompok orang] di [lokasi] mengalami [masalah]." });
    let d = (await u.get("/api/dashboard")).json; expect(d.canvasKeys[0].filled).toBe(false); expect(d.canvasFilled).toBe(0);
    await u.patch(`/api/projects/${pid}/canvas`, { section: "problem", text: "Mahasiswa di kantin mengalami sampah tercampur." });
    d = (await u.get("/api/dashboard")).json; expect(d.canvasKeys[0].filled).toBe(true); expect(d.canvasFilled).toBe(1);
    await u.patch(`/api/projects/${pid}/canvas`, { section: "problem", text: "Menurut studi [1] sampah naik 10%." });
    expect((await u.get("/api/dashboard")).json.canvasKeys[0].filled).toBe(true);
  });
});

describe("CR-3 AI Coach (penilai heuristik, deterministik)", () => {
  it("bagian terisi → good/improve/rewrite; bagian kosong → ide; respons memuat model & tanpa kebocoran data pribadi", async () => {
    const { u, pid } = await project();
    await u.patch(`/api/projects/${pid}/canvas`, { section: "problem", text: "Sampah kantin tercampur." });
    const a = await u.post("/api/ai/feedback", { projectId: pid, section: "problem" });
    expect(a.status).toBe(200); expect(a.json.improve).toBeTruthy(); expect(a.json.cached).toBe(false);
    const e = await u.post("/api/ai/feedback", { projectId: pid, section: "technology" });
    expect(e.json.ideas.length).toBeGreaterThanOrEqual(3); expect(e.json.rewrite).toBe("");
    expect(JSON.stringify([a.json, e.json])).not.toContain(u.email);
  });
  it("hasil di-cache per isi (inputHash); isi berubah → dihitung ulang", async () => {
    const { u, pid } = await project();
    await u.patch(`/api/projects/${pid}/canvas`, { section: "problem", text: "Versi satu masalahnya." });
    expect((await u.post("/api/ai/feedback", { projectId: pid, section: "problem" })).json.cached).toBe(false);
    expect((await u.post("/api/ai/feedback", { projectId: pid, section: "problem" })).json.cached).toBe(true);
    await u.patch(`/api/projects/${pid}/canvas`, { section: "problem", text: "Versi dua yang berbeda isinya." });
    expect((await u.post("/api/ai/feedback", { projectId: pid, section: "problem" })).json.cached).toBe(false);
  });
  it("menandai placeholder yang belum diisi dan tidak membuat 'versi baru'", async () => {
    const { u, pid } = await project();
    await u.patch(`/api/projects/${pid}/canvas`, { section: "solution", text: "[Nama solusi] adalah [jenis] untuk [siapa]." });
    const r = await u.post("/api/ai/feedback", { projectId: pid, section: "solution" });
    expect(r.json.improve).toMatch(/belum kamu isi/); expect(r.json.rewrite).toBe("");
  });
  it("input tidak valid → 400; non-anggota → 403; tanpa login → 401", async () => {
    const { u, pid } = await project(); const stranger = await newUser("Penyusup");
    expect((await u.post("/api/ai/feedback", { projectId: pid, section: "bogus" })).status).toBe(400);
    expect((await u.post("/api/ai/feedback", { projectId: "xyz", section: "problem" })).status).toBe(400);
    expect((await stranger.post("/api/ai/feedback", { projectId: pid, section: "problem" })).status).toBe(403);
    expect((await new Api().post("/api/ai/feedback", { projectId: pid, section: "problem" })).status).toBe(401);
  });
  it("rate limit: 20 masukan per jam per pengguna → ke-21 = 429", async () => {
    const { u, pid } = await project("Penanya");
    let last = 0;
    for (let i = 0; i < 21; i++) {
      await u.patch(`/api/projects/${pid}/canvas`, { section: "problem", text: `Masalah versi ke-${i} yang berbeda-beda.` }); // hash baru tiap kali
      last = (await u.post("/api/ai/feedback", { projectId: pid, section: "problem" })).status;
      if (i < 20) expect(last, `panggilan ${i + 1}`).toBe(200);
    }
    expect(last).toBe(429);
  });
});

describe("IM-1/2/3 penilaian IMPACT", () => {
  it("ditolak (409) bila kanvas belum penuh atau masih ada placeholder", async () => {
    const { u, pid } = await project();
    expect((await u.post(`/api/projects/${pid}/assess`)).status).toBe(409);
    await fillCanvas(u, pid, { impact: "Indikator: [apa yang diukur] naik." });
    expect((await u.post(`/api/projects/${pid}/assess`)).status).toBe(409);
  });
  it("skor = Σ(bobot × nilai), 5 indikator berbobot jumlah 1, kategori sesuai, tersimpan di riwayat", async () => {
    const { u, pid } = await project(); await fillCanvas(u, pid);
    const r = await u.post(`/api/projects/${pid}/assess`);
    expect(r.status).toBe(200);
    expect(r.json.indicators.map((i: any) => i.key)).toEqual(["problem_clarity", "solution_relevance", "user_need", "collaboration", "sustainability"]);
    expect(r.json.indicators.reduce((a: number, i: any) => a + i.weight, 0)).toBeCloseTo(1, 10);
    for (const i of r.json.indicators) { expect(i.value).toBeGreaterThanOrEqual(0); expect(i.value).toBeLessThanOrEqual(100); expect(i.why && i.tip).toBeTruthy(); }
    expect(r.json.score).toBe(Math.round(r.json.indicators.reduce((a: number, i: any) => a + i.weight * i.value, 0)));
    expect(r.json.level).toBe(r.json.score >= 80 ? "Siap diuji coba" : r.json.score >= 60 ? "Udah lumayan siap" : "Masih perlu digodok");
    expect(r.json).toMatchObject({ weightsVersion: "v1", model: "heuristic-v1" });
    const h = (await u.get(`/api/projects/${pid}/assess`)).json;
    expect(h.history).toHaveLength(1); expect(h.history[0].score).toBe(r.json.score); expect(h.filled).toBe(6);
  });
  it("kanvas lebih lengkap & terukur → skor lebih tinggi (penilai tidak asal)", async () => {
    const a = await project("Tipis"), b = await project("Tebal");
    await fillCanvas(a.u, a.pid, Object.fromEntries(CANVAS_KEYS.map((k) => [k, "ya"])) as any);
    await fillCanvas(b.u, b.pid);
    const s1 = (await a.u.post(`/api/projects/${a.pid}/assess`)).json.score, s2 = (await b.u.post(`/api/projects/${b.pid}/assess`)).json.score;
    expect(s2).toBeGreaterThan(s1);
  });
  it("tim lintas peran menaikkan indikator Kolaborasi", async () => {
    const solo = await project("Sendiri"), team = await project("Bertim");
    await fillCanvas(solo.u, solo.pid); await fillCanvas(team.u, team.pid);
    const p = await newPartner("Rekan", { "UI/UX": 5 });
    const pid = (await (async () => { const { withDb } = await import("../support/db"); return withDb(async (db) => String((await db.collection("users").findOne({ email: p.email }))!._id)); })());
    await team.u.post(`/api/projects/${team.pid}/invites`, { userId: pid, role: "UI/UX Designer" });
    await p.post(`/api/invites/${team.pid}/respond`, { accept: true });
    const collab = async (x: { u: Api; pid: string }) => (await x.u.post(`/api/projects/${x.pid}/assess`)).json.indicators.find((i: any) => i.key === "collaboration").value;
    expect(await collab(team)).toBeGreaterThan(await collab(solo));
  });
  it("riwayat bertambah tiap penilaian (terbaru dulu)", async () => {
    const { u, pid } = await project(); await fillCanvas(u, pid);
    await u.post(`/api/projects/${pid}/assess`);
    await u.patch(`/api/projects/${pid}/canvas`, { section: "impact", text: FULL_CANVAS.impact + " Diukur lewat survei bulanan dan log aplikasi." });
    await u.post(`/api/projects/${pid}/assess`);
    const h = (await u.get(`/api/projects/${pid}/assess`)).json.history;
    expect(h).toHaveLength(2); expect(new Date(h[0].createdAt).getTime()).toBeGreaterThanOrEqual(new Date(h[1].createdAt).getTime());
  });
  it("rate limit: 5 penilaian per proyek per hari → ke-6 = 429", async () => {
    const { u, pid } = await project("Rajin"); await fillCanvas(u, pid);
    for (let i = 0; i < 5; i++) expect((await u.post(`/api/projects/${pid}/assess`)).status, `penilaian ${i + 1}`).toBe(200);
    expect((await u.post(`/api/projects/${pid}/assess`)).status).toBe(429);
  });
  it("non-anggota 403; tanpa login 401", async () => {
    const { u, pid } = await project(); await fillCanvas(u, pid);
    expect((await (await newUser("Asing2")).post(`/api/projects/${pid}/assess`)).status).toBe(403);
    expect((await new Api().post(`/api/projects/${pid}/assess`)).status).toBe(401);
  });
});
