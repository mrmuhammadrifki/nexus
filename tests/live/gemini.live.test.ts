/**
 * Opt-in: memanggil Gemini SUNGGUHAN lewat server uji (mongod sementara). Memakai kuota API.
 *   npm run test:ai-live          (butuh GEMINI_API_KEY di .env.local atau lingkungan)
 */
import { beforeAll, describe, expect, it } from "vitest";
import { Api, CANVAS_KEYS, FULL_CANVAS, completeKnow, fillCanvas, newUser } from "../support/client";
import { resetDb, withDb } from "../support/db";

const pause = (ms = 7000) => new Promise((r) => setTimeout(r, ms)); // hormati batas laju free-tier
beforeAll(resetDb);

async function proj(name: string) { const u = await newUser(name); await completeKnow(u); return { u, pid: (await u.get("/api/team")).json.projectId as string }; }

describe("AI Coach dengan Gemini (live)", () => {
  it("masukan CREATE: terstruktur, tercatat model Gemini, lalu di-cache", async () => {
    const { u, pid } = await proj("Live1");
    await fillCanvas(u, pid);
    const a = await u.post("/api/ai/feedback", { projectId: pid, section: "problem" });
    expect(a.status, a.text).toBe(200);
    expect(a.json.cached).toBe(false); expect(a.json.improve.length).toBeGreaterThan(5);
    const m = await withDb((db) => db.collection("aiFeedback").findOne({ section: "problem" }));
    expect(m?.model).toMatch(/^gemini-.*@p1$/);
    const b = await u.post("/api/ai/feedback", { projectId: pid, section: "problem" });
    expect(b.json.cached).toBe(true); // tidak memanggil Gemini lagi
  });
  it("bagian kosong → hanya ide; placeholder → pesan deterministik tanpa pujian", async () => {
    const { u, pid } = await proj("Live2");
    await u.patch(`/api/projects/${pid}/canvas`, { section: "problem", text: FULL_CANVAS.problem });
    await pause();
    const empty = await u.post("/api/ai/feedback", { projectId: pid, section: "technology" });
    expect(empty.status, empty.text).toBe(200);
    expect(empty.json).toMatchObject({ good: "", rewrite: "" }); expect(empty.json.ideas.length).toBeGreaterThanOrEqual(2);
    await u.patch(`/api/projects/${pid}/canvas`, { section: "solution", text: "[Nama solusi] adalah [jenis] untuk [siapa]." });
    const ph = await u.post("/api/ai/feedback", { projectId: pid, section: "solution" });
    expect(ph.json.improve).toMatch(/belum kamu isi/); expect(ph.json.good).toBe("");
  });
  it("penilaian IMPACT: 5 indikator 0–100, skor = Σ bobot×nilai dihitung server, model Gemini tercatat", async () => {
    const { u, pid } = await proj("Live3");
    await fillCanvas(u, pid); await pause();
    const r = await u.post(`/api/projects/${pid}/assess`);
    expect(r.status, r.text).toBe(200);
    expect(r.json.model).toMatch(/^gemini-/);
    expect(r.json.indicators).toHaveLength(5);
    for (const i of r.json.indicators) { expect(Number.isInteger(i.value)).toBe(true); expect(i.value).toBeGreaterThanOrEqual(0); expect(i.value).toBeLessThanOrEqual(100); expect(i.why.length).toBeGreaterThan(5); }
    expect(r.json.score).toBe(Math.round(r.json.indicators.reduce((a: number, i: any) => a + i.weight * i.value, 0)));
  });
  it("kanvas jelas & terukur dinilai lebih tinggi daripada kanvas asal-asalan", async () => {
    const good = await proj("LiveBagus"), bad = await proj("LiveBuruk");
    await fillCanvas(good.u, good.pid);
    await fillCanvas(bad.u, bad.pid, Object.fromEntries(CANVAS_KEYS.map((k) => [k, "bagus ya"])) as any);
    await pause();
    const g = await good.u.post(`/api/projects/${good.pid}/assess`); await pause();
    const b = await bad.u.post(`/api/projects/${bad.pid}/assess`);
    expect(g.status, g.text).toBe(200); expect(b.status, b.text).toBe(200);
    expect(g.json.score).toBeGreaterThan(b.json.score + 15);
  });
});
void Api;
