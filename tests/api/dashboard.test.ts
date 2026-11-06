import { beforeAll, describe, expect, it } from "vitest";
import { Api, fillCanvas, newPartner, newUser, completeKnow } from "../support/client";
import { resetDb, withDb } from "../support/db";

beforeAll(resetDb);
const dash = async (u: Api) => (await u.get("/api/dashboard")).json;
const status = (d: any) => d.steps.map((s: any) => `${s.key}:${s.status}`).join(" ");

describe("DB-1/DB-2 status step & next step mengikuti progres", () => {
  it("pengguna baru: KNOW 'active', sisanya 'next', 0%", async () => {
    const u = await newUser("Baru"); const d = await dash(u);
    expect(status(d)).toBe("KNOW:active GROW:next CONNECT:next CREATE:next IMPACT:next");
    expect(d.pct).toBe(0); expect(d.next.href).toBe("/know");
  });
  it("KNOW selesai → GROW active; GROW ditinjau → CONNECT active", async () => {
    const u = await newUser("Maju"); await completeKnow(u);
    let d = await dash(u);
    expect(status(d)).toBe("KNOW:done GROW:active CONNECT:next CREATE:next IMPACT:next"); expect(d.pct).toBe(20); expect(d.next.href).toBe("/grow");
    await u.put("/api/profile", { growReviewed: true });
    d = await dash(u); expect(status(d)).toBe("KNOW:done GROW:done CONNECT:active CREATE:next IMPACT:next"); expect(d.next.href).toBe("/connect");
  });
  it("tim terbentuk → CREATE active; next step menunjuk bagian kanvas pertama yang belum terisi", async () => {
    const u = await newUser("Tim"); await completeKnow(u); await u.put("/api/profile", { growReviewed: true });
    const p = await newPartner("Rekan", { "UI/UX": 5 });
    const t = (await u.get("/api/team")).json;
    const pid = await withDb(async (db) => String((await db.collection("users").findOne({ email: p.email }))!._id));
    await u.post(`/api/projects/${t.projectId}/invites`, { userId: pid }); await p.post(`/api/invites/${t.projectId}/respond`, { accept: true });
    let d = await dash(u);
    expect(status(d)).toBe("KNOW:done GROW:done CONNECT:done CREATE:active IMPACT:next"); expect(d.next.href).toBe("/create?s=0");

    await u.patch(`/api/projects/${t.projectId}/canvas`, { section: "problem", text: "Masalah nyata di kantin." });
    await u.patch(`/api/projects/${t.projectId}/canvas`, { section: "rootCause", text: "Penyebab utamanya jelas." });
    await u.patch(`/api/projects/${t.projectId}/canvas`, { section: "solution", text: "Solusi berupa aplikasi web." });
    d = await dash(u); expect(d.next.href).toBe("/create?s=3"); expect(d.next.title).toMatch(/Teknologi/); expect(d.canvasFilled).toBe(3);

    await fillCanvas(u, t.projectId);
    d = await dash(u); expect(d.next.href).toBe("/impact"); expect(d.canvasFilled).toBe(6);
    await u.post(`/api/projects/${t.projectId}/assess`);
    d = await dash(u); expect(status(d)).toBe("KNOW:done GROW:done CONNECT:done CREATE:done IMPACT:done"); expect(d.pct).toBe(100); expect(d.score.score).toBeGreaterThanOrEqual(0);
  });
});

describe("DB-3 feed aktivitas & rekap", () => {
  it("memuat peristiwa penting, terbaru dulu, maksimal 10", async () => {
    const u = await newUser("Aktif"); await completeKnow(u); await u.get("/api/grow/plan");
    await u.patch("/api/grow/plan/items/0", { done: true });
    const t = (await u.get("/api/team")).json;
    for (const k of ["problem", "rootCause", "solution", "technology", "features", "impact"]) await u.patch(`/api/projects/${t.projectId}/canvas`, { section: k, text: `isi ${k} lengkap` });
    const a = (await dash(u)).activities;
    expect(a.length).toBeLessThanOrEqual(10); expect(a.length).toBeGreaterThan(0);
    expect(a.map((x: any) => x.type)).toEqual(expect.arrayContaining(["know_done", "plan_done", "canvas_saved"]));
    const times = a.map((x: any) => new Date(x.at).getTime()); expect(times).toEqual([...times].sort((x: number, y: number) => y - x));
  });
  it("kanvas disimpan ulang pada bagian yang sama tidak membanjiri feed", async () => {
    const u = await newUser("Revisi"); await completeKnow(u); const t = (await u.get("/api/team")).json;
    for (let i = 0; i < 5; i++) await u.patch(`/api/projects/${t.projectId}/canvas`, { section: "problem", text: `revisi ${i}` });
    expect((await dash(u)).activities.filter((x: any) => x.type === "canvas_saved")).toHaveLength(1);
  });
  it("rekap: profil, 3 gap teratas, tim, dan undangan masuk", async () => {
    const owner = await newUser("Pemilik"); await completeKnow(owner);
    const p = await newPartner("Calon", { "UI/UX": 5 });
    const t = (await owner.get("/api/team")).json;
    const pid = await withDb(async (db) => String((await db.collection("users").findOne({ email: p.email }))!._id));
    await owner.post(`/api/projects/${t.projectId}/invites`, { userId: pid });
    const od = await dash(owner), pd = await dash(p);
    expect(od.profile).toMatchObject({ label: "Si analis pemecah masalah" }); expect(od.topGaps.length).toBeLessThanOrEqual(3);
    expect(od.team.some((m: any) => m.status === "invited")).toBe(true);
    expect(pd.invites).toHaveLength(1); expect(pd.invites[0].owner).toBe("Pemilik");
  });
  it("anggota tim melihat proyek & kanvas yang sama dengan pemilik", async () => {
    const owner = await newUser("Ketua"); await completeKnow(owner); const t = (await owner.get("/api/team")).json;
    const p = await newPartner("Anggota", { "UI/UX": 5 });
    const pid = await withDb(async (db) => String((await db.collection("users").findOne({ email: p.email }))!._id));
    await owner.post(`/api/projects/${t.projectId}/invites`, { userId: pid }); await p.post(`/api/invites/${t.projectId}/respond`, { accept: true });
    await fillCanvas(owner, t.projectId);
    expect((await dash(p)).canvasFilled).toBe(6);
  });
});
