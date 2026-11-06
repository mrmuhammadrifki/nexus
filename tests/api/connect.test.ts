import { beforeAll, describe, expect, it } from "vitest";
import { Api, newPartner, newUser, completeKnow } from "../support/client";
import { resetDb, withDb } from "../support/db";
import { ObjectId } from "mongodb";

beforeAll(resetDb);

const userId = (u: Api) => withDb(async (db) => String((await db.collection("users").findOne({ email: u.email }))!._id));

/** Pengguna dengan gap UI/UX & kawan-kawan (peran target UI/UX Designer). */
async function owner(name = "Pemilik") {
  const u = await newUser(name); await completeKnow(u, { interests: ["Teknologi"], skills: { "Analisis Data": 4, Python: 4, SQL: 3 } });
  await u.put("/api/profile", { targetRole: "ui-ux-designer" });
  return u;
}
const cands = async (u: Api, q = "") => (await u.get(`/api/connect/candidates${q}`)).json.candidates as any[];

describe("CO-1 rekomendasi partner", () => {
  it("ditolak (409) sebelum KNOW selesai", async () => {
    expect((await (await newUser("Belum")).get("/api/connect/candidates")).status).toBe(409);
  });
  it("hanya profil publik, bukan diri sendiri; urut skor match; ada alasan", async () => {
    const me = await owner();
    const raka = await newPartner("Raka", { "UI/UX": 5, "Desain Grafis": 4 }, ["Teknologi"]);
    const salsa = await newPartner("Salsa", { "Public Speaking": 5, Riset: 4 }, ["Sosial"]);
    const weak = await newPartner("Lemah", { Java: 4 }, ["Pertanian"]);
    await newUser("Rahasia", { visibility: "private" }).then((p) => completeKnow(p, { skills: { "UI/UX": 5, "Desain Grafis": 5 } }));

    const list = await cands(me);
    const names = list.map((c) => c.name);
    expect(names).not.toContain("Uji Coba");
    expect(names.some((n) => n.startsWith("Rahasia"))).toBe(false); // profil privat tak tampil (PR-1)
    expect(list.map((c) => c.match)).toEqual([...list.map((c) => c.match)].sort((a, b) => b - a));
    const by = (n: string) => list.find((c) => c.name.startsWith(n))!;
    // Raka menutup UI/UX (bobot 3) & Desain Grafis (2) dari total 32 → 80*20/32 = 50, minat identik → +20
    expect(by("Raka").match).toBe(70);
    expect(by("Salsa").match).toBe(23); // 80*9/32 = 22.5 → 23, tanpa minat sama
    expect(by("Lemah").match).toBe(0);
    expect(by("Raka").reason).toMatch(/UI\/UX/);
    expect(list[0].name.startsWith("Raka")).toBe(true);
    void raka; void salsa; void weak;
  });
  it("filter peran/skill menyaring tanpa memuat ulang (query ?role=)", async () => {
    const me = await owner();
    await newPartner("Desainer", { "UI/UX": 5 }); await newPartner("Pembicara", { "Public Speaking": 5 });
    const ui = await cands(me, "?role=UI/UX");
    expect(ui.length).toBeGreaterThan(0); expect(ui.every((c) => c.tags.includes("UI/UX"))).toBe(true);
    const all = await cands(me, "?role=all"); expect(all.length).toBeGreaterThanOrEqual(ui.length);
  });
});

describe("CO-3 ajak → terima/tolak", () => {
  it("alur ajak → undangan masuk → terima → anggota tim & bisa mengedit kanvas (CR-2)", async () => {
    const me = await owner(); const p = await newPartner("Mitra", { "UI/UX": 5 });
    const t = (await me.get("/api/team")).json; const pid = await userId(p);
    expect((await me.post(`/api/projects/${t.projectId}/invites`, { userId: pid, role: "UI/UX" })).status).toBe(200);

    const inv = (await p.get("/api/team")).json.invites;
    expect(inv).toHaveLength(1); expect(inv[0]).toMatchObject({ id: t.projectId });
    expect((await me.get("/api/team")).json.members.find((m: any) => m.userId === pid).status).toBe("invited");
    expect((await p.get(`/api/projects/${t.projectId}/canvas`)).status).toBe(403); // belum menerima ≠ anggota

    expect((await p.post(`/api/invites/${t.projectId}/respond`, { accept: true })).status).toBe(200);
    expect((await me.get("/api/team")).json.members.filter((m: any) => m.status === "accepted")).toHaveLength(2);
    expect((await p.patch(`/api/projects/${t.projectId}/canvas`, { section: "problem", text: "Dari mitra." })).status).toBe(200);
    expect((await me.get(`/api/projects/${t.projectId}/canvas`)).json.canvas.problem).toBe("Dari mitra.");
  });
  it("yang sudah diajak tidak muncul lagi; batalkan ajakan mengembalikannya", async () => {
    const me = await owner(); const p = await newPartner("Bolakbalik", { "UI/UX": 5 });
    const t = (await me.get("/api/team")).json; const pid = await userId(p);
    await me.post(`/api/projects/${t.projectId}/invites`, { userId: pid, role: "X" });
    expect((await cands(me)).some((c) => c.userId === pid)).toBe(false);
    expect((await me.del(`/api/projects/${t.projectId}/invites?userId=${pid}`)).status).toBe(200);
    expect((await cands(me)).some((c) => c.userId === pid)).toBe(true);
    expect((await p.get("/api/team")).json.invites).toHaveLength(0);
  });
  it("ajak ganda → 409; ajak diri sendiri → 400; ajak profil privat → 404; bukan pemilik → 403", async () => {
    const me = await owner(); const p = await newPartner("Ganda", { "UI/UX": 5 }); const priv = await newUser("Pribadi"); await completeKnow(priv);
    const t = (await me.get("/api/team")).json; const pid = await userId(p);
    await me.post(`/api/projects/${t.projectId}/invites`, { userId: pid });
    expect((await me.post(`/api/projects/${t.projectId}/invites`, { userId: pid })).status).toBe(409);
    expect((await me.post(`/api/projects/${t.projectId}/invites`, { userId: await userId(me) })).status).toBe(400);
    expect((await me.post(`/api/projects/${t.projectId}/invites`, { userId: await userId(priv) })).status).toBe(404);
    expect((await p.post(`/api/projects/${t.projectId}/invites`, { userId: await userId(priv) })).status).toBe(403);
    expect((await me.post(`/api/projects/${t.projectId}/invites`, { userId: "bukan-id" })).status).toBe(400);
  });
  it("menolak: tidak jadi anggota, hilang dari rekomendasi selamanya, tidak bisa diajak lagi", async () => {
    const me = await owner(); const p = await newPartner("Penolak", { "UI/UX": 5 });
    const t = (await me.get("/api/team")).json; const pid = await userId(p);
    await me.post(`/api/projects/${t.projectId}/invites`, { userId: pid });
    expect((await p.post(`/api/invites/${t.projectId}/respond`, { accept: false })).status).toBe(200);
    expect((await me.get("/api/team")).json.members.some((m: any) => m.userId === pid)).toBe(false);
    expect((await cands(me)).some((c) => c.userId === pid)).toBe(false);
    expect((await me.post(`/api/projects/${t.projectId}/invites`, { userId: pid })).status).toBe(409);
    expect((await p.post(`/api/invites/${t.projectId}/respond`, { accept: true })).status).toBe(404); // sudah dijawab
  });
});

describe("undangan kedaluwarsa 7 hari", () => {
  it("tidak tampil, tidak bisa dijawab (410), dan pemilik bisa mengajak ulang", async () => {
    const me = await owner(); const p = await newPartner("Lupa", { "UI/UX": 5 });
    const t = (await me.get("/api/team")).json; const pid = await userId(p);
    await me.post(`/api/projects/${t.projectId}/invites`, { userId: pid });
    await withDb((db) => db.collection("projects").updateOne({ _id: new ObjectId(t.projectId), "members.userId": new ObjectId(pid) }, { $set: { "members.$.invitedAt": new Date(Date.now() - 8 * 86400000) } }));

    expect((await p.get("/api/team")).json.invites).toHaveLength(0);
    expect((await me.get("/api/team")).json.members.some((m: any) => m.userId === pid)).toBe(false);
    expect((await p.post(`/api/invites/${t.projectId}/respond`, { accept: true })).status).toBe(410);
    expect((await cands(me)).some((c) => c.userId === pid)).toBe(true); // rekomendasi muncul lagi
    expect((await me.post(`/api/projects/${t.projectId}/invites`, { userId: pid })).status).toBe(200);
    expect((await p.get("/api/team")).json.invites).toHaveLength(1);
  });
});

describe("batas tim & satu tim per pengguna", () => {
  it("maksimal 5 anggota; kandidat yang sudah di tim penuh disembunyikan dari orang lain", async () => {
    const me = await owner("Ketua"); const t = (await me.get("/api/team")).json; const ps: Api[] = [];
    for (let i = 0; i < 4; i++) { const p = await newPartner(`Anggota${"abcd"[i]}`, { "UI/UX": 5 }); ps.push(p);
      expect((await me.post(`/api/projects/${t.projectId}/invites`, { userId: await userId(p) })).status).toBe(200);
      expect((await p.post(`/api/invites/${t.projectId}/respond`, { accept: true })).status).toBe(200); }
    expect((await me.get("/api/team")).json.members).toHaveLength(5);
    const extra = await newPartner("Kelebihan", { "UI/UX": 5 });
    const r = await me.post(`/api/projects/${t.projectId}/invites`, { userId: await userId(extra) });
    expect(r.status).toBe(409); expect(r.json.error).toMatch(/5/);
    const outsider = await owner("Orang Luar");
    const seen = (await cands(outsider)).map((c) => c.userId);
    for (const p of ps) expect(seen).not.toContain(await userId(p)); // tim penuh tidak ditawarkan
    expect(seen).toContain(await userId(extra));
  });
  it("satu tim per pengguna: menerima undangan kedua saat sudah di tim lain → 409", async () => {
    const a = await owner("TimA"), b = await owner("TimB"); const p = await newPartner("Rebutan", { "UI/UX": 5 });
    const ta = (await a.get("/api/team")).json, tb = (await b.get("/api/team")).json; const pid = await userId(p);
    await a.post(`/api/projects/${ta.projectId}/invites`, { userId: pid }); await b.post(`/api/projects/${tb.projectId}/invites`, { userId: pid });
    expect((await p.post(`/api/invites/${ta.projectId}/respond`, { accept: true })).status).toBe(200);
    expect((await p.post(`/api/invites/${tb.projectId}/respond`, { accept: true })).status).toBe(409);
  });
  it("anggota tim melihat kanvas milik pemilik sebagai proyek aktifnya", async () => {
    const me = await owner("Tuan Rumah"); const p = await newPartner("Tamu", { "UI/UX": 5 });
    const t = (await me.get("/api/team")).json; await me.post(`/api/projects/${t.projectId}/invites`, { userId: await userId(p) });
    await p.post(`/api/invites/${t.projectId}/respond`, { accept: true });
    expect((await p.get("/api/team")).json.projectId).toBe(t.projectId);
  });
});
