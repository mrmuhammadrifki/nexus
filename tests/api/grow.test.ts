import { beforeAll, describe, expect, it } from "vitest";
import { newUser, completeKnow } from "../support/client";
import { resetDb } from "../support/db";

beforeAll(resetDb);

async function growUser(skills: Record<string, number> = { "Analisis Data": 4, Python: 4, SQL: 3 }, role = "product-data-analyst") {
  const u = await newUser("Grow"); await completeKnow(u, { skills });
  await u.put("/api/profile", { targetRole: role });
  return u;
}

describe("GROW: skill gap & prioritas", () => {
  it("ditolak (409) sebelum KNOW selesai", async () => {
    const u = await newUser("BelumKnow");
    const r = await u.get("/api/grow/plan");
    expect(r.status).toBe(409);
  });
  it("prioritas = max(0, target − level) × bobot dan terurut menurun", async () => {
    const u = await growUser(); const { json: p } = await u.get("/api/grow/plan");
    expect(p.role.slug).toBe("product-data-analyst");
    for (const g of p.gaps) expect(g.priority, g.name).toBe(Math.max(0, g.target - g.cur) * g.weight);
    const pr = p.gaps.map((g: any) => g.priority);
    expect(pr).toEqual([...pr].sort((a: number, b: number) => b - a));
    expect(p.gaps.find((g: any) => g.name === "SQL")).toMatchObject({ cur: 3, target: 4, gap: 1, priority: 3 });
  });
  it("skill yang tidak dipilih dihitung level 0 (belum punya)", async () => {
    const u = await growUser(); const { json: p } = await u.get("/api/grow/plan");
    const ui = p.gaps.find((g: any) => g.name === "UI/UX");
    expect(ui.cur).toBe(0); expect(ui.gap).toBe(4);
  });
  it("skill yang sudah mencapai target ditandai tanpa gap dan tanpa materi belajar", async () => {
    const u = await growUser(); const { json: p } = await u.get("/api/grow/plan");
    expect(p.gaps.find((g: any) => g.name === "Python")!.gap).toBe(0);
    expect(p.items.some((i: any) => i.skill === "Python")).toBe(false);
  });
});

describe("GROW: rencana belajar (checklist)", () => {
  it("butir hanya untuk skill yang kurang; maksimal 2 per skill; urut prioritas", async () => {
    const u = await growUser(); const { json: p } = await u.get("/api/grow/plan");
    expect(p.items.length).toBeGreaterThan(0);
    const per: Record<string, number> = {}; p.items.forEach((i: any) => (per[i.skill] = (per[i.skill] ?? 0) + 1));
    for (const [s, n] of Object.entries(per)) { expect(n, s).toBeLessThanOrEqual(2); expect(p.gaps.find((g: any) => g.name === s).gap, s).toBeGreaterThan(0); }
    const pr = p.items.map((i: any) => i.priority);
    expect(pr).toEqual([...pr].sort((a: number, b: number) => b - a));
  });
  it("centang tersimpan, bisa dibatalkan, dan bertahan saat rencana dihitung ulang", async () => {
    const u = await growUser(); await u.get("/api/grow/plan"); // rencana dibuat saat halaman GROW dimuat
    expect((await u.patch("/api/grow/plan/items/0", { done: true })).status).toBe(200);
    const title = (await u.get("/api/grow/plan")).json.items[0].title;
    expect((await u.get("/api/grow/plan")).json.items[0].done).toBe(true);
    // ubah level skill lain → rencana dihitung ulang, centang tetap
    await u.put("/api/profile", { levels: [{ name: "SQL", level: 4 }] });
    const after = (await u.get("/api/grow/plan")).json.items.find((i: any) => i.title === title);
    expect(after?.done).toBe(true);
    await u.patch("/api/grow/plan/items/0", { done: false });
    expect((await u.get("/api/grow/plan")).json.items[0].done).toBe(false);
  });
  it("validasi: indeks di luar rentang → 404; done bukan boolean → 400", async () => {
    const u = await growUser(); await u.get("/api/grow/plan");
    expect((await u.patch("/api/grow/plan/items/999", { done: true })).status).toBe(404);
    expect((await u.patch("/api/grow/plan/items/abc", { done: true })).status).toBe(404);
    expect((await u.patch("/api/grow/plan/items/0", { done: "ya" })).status).toBe(400);
  });
  it("centang pengguna lain tidak memengaruhi rencana saya", async () => {
    const a = await growUser(), b = await growUser();
    await a.get("/api/grow/plan"); await b.get("/api/grow/plan");
    await a.patch("/api/grow/plan/items/0", { done: true });
    expect((await b.get("/api/grow/plan")).json.items[0].done).toBe(false);
  });
});

describe("GROW: PATCH sebelum rencana ada", () => {
  it("→ 404 (rencana dibuat saat GET /api/grow/plan)", async () => {
    const u = await growUser();
    expect((await u.patch("/api/grow/plan/items/0", { done: true })).status).toBe(404);
  });
});

describe("GROW: peran target & saran", () => {
  it("memberi 3 saran peran lain (tanpa peran saat ini) terurut menurun", async () => {
    const u = await growUser(); const { json: p } = await u.get("/api/grow/plan");
    expect(p.suggestions).toHaveLength(3);
    expect(p.suggestions.some((s: any) => s.slug === p.role.slug)).toBe(false);
    const f = p.suggestions.map((s: any) => s.fit); expect(f).toEqual([...f].sort((a: number, b: number) => b - a));
  });
  it("mengganti peran mengubah tuntutan skill & rencana", async () => {
    const u = await growUser(); const before = (await u.get("/api/grow/plan")).json;
    await u.put("/api/profile", { targetRole: "frontend-developer" });
    const after = (await u.get("/api/grow/plan")).json;
    expect(after.role.slug).toBe("frontend-developer");
    expect(after.gaps.map((g: any) => g.name).sort()).not.toEqual(before.gaps.map((g: any) => g.name).sort());
    expect(after.gaps.some((g: any) => g.name === "Frontend")).toBe(true);
  });
  it("menilai ulang level mengubah gap", async () => {
    const u = await growUser();
    await u.put("/api/profile", { levels: [{ name: "SQL", level: 4 }] });
    expect((await u.get("/api/grow/plan")).json.gaps.find((g: any) => g.name === "SQL")).toMatchObject({ cur: 4, gap: 0 });
  });
});

describe("GROW: status 'Beres' butuh tinjauan pengguna", () => {
  it("GROW belum Beres otomatis; Beres setelah growReviewed", async () => {
    const u = await growUser();
    expect((await u.get("/api/dashboard")).json.steps[1].status).not.toBe("done");
    expect((await u.put("/api/profile", { growReviewed: true })).status).toBe(200);
    expect((await u.get("/api/dashboard")).json.steps[1].status).toBe("done");
  });
});
