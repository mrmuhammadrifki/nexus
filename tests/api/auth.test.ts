import { beforeAll, describe, expect, it } from "vitest";
import { Api, newUser, completeKnow } from "../support/client";
import { resetDb, withDb } from "../support/db";

beforeAll(resetDb);
const uniq = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

describe("AU-1 daftar & login", () => {
  it("daftar valid → 200; email sama (huruf berbeda) → 409; input tidak valid → 400", async () => {
    const e = `a.${uniq()}@test.local`;
    expect((await new Api().register("Dina Uji", e)).status).toBe(200);
    expect((await new Api().register("Dina Dua", e.toUpperCase())).status).toBe(409);
    const bad = new Api();
    for (const body of [{ name: "x", email: e, password: "password123" }, { name: "Dina", email: "bukan-email", password: "password123" }, { name: "Dina", email: `b.${uniq()}@t.id`, password: "1234567" }, {}]) {
      expect((await bad.post("/api/register", body)).status).toBe(400);
    }
  });
  it("login benar → sesi aktif; password salah / email tak dikenal → tanpa sesi", async () => {
    const u = new Api(); const e = `b.${uniq()}@test.local`;
    await u.register("Budi Uji", e); await u.login();
    const me = await u.get("/api/me");
    expect(me.status).toBe(200); expect(me.json.email).toBe(e);

    const wrong = new Api(); await wrong.login(e, "salahsalah");
    expect((await wrong.get("/api/me")).status).toBe(401);
    const ghost = new Api(); await ghost.login(`tak.ada.${uniq()}@t.id`, "password123");
    expect((await ghost.get("/api/me")).status).toBe(401);
  });
  it("sesi berlaku 30 hari (maxAge cookie)", async () => {
    const u = new Api(); const e = `c.${uniq()}@test.local`; await u.register("Cici", e);
    const { json } = await u.get("/api/auth/csrf");
    const res = await fetch(`${process.env.TEST_BASE_URL}/api/auth/callback/credentials`, { method: "POST", redirect: "manual",
      headers: { "content-type": "application/x-www-form-urlencoded", cookie: Object.entries(u.jar).map(([k, v]) => `${k}=${v}`).join("; ") },
      body: new URLSearchParams({ csrfToken: json.csrfToken, email: e, password: "password123", json: "true" }) });
    const sess = res.headers.getSetCookie().find((c) => /session-token/.test(c))!;
    const exp = new Date(/expires=([^;]+)/i.exec(sess)![1]).getTime();
    expect((exp - Date.now()) / 86400000).toBeGreaterThan(29); expect((exp - Date.now()) / 86400000).toBeLessThan(31);
  });
  it("password tidak pernah dikembalikan API", async () => {
    const u = await newUser("Sandi");
    const t = (await u.get("/api/me")).text + (await u.get("/api/me?export=1")).text;
    expect(t).not.toMatch(/passwordHash|\$2[aby]\$/);
  });
});

describe("semua endpoint terlindungi tanpa login", () => {
  const anon = new Api();
  it.each([
    ["GET", "/api/me"], ["PATCH", "/api/me"], ["DELETE", "/api/me"], ["GET", "/api/profile"], ["PUT", "/api/profile"], ["GET", "/api/dashboard"], ["GET", "/api/team"],
    ["GET", "/api/grow/plan"], ["PATCH", "/api/grow/plan/items/0"], ["GET", "/api/roles"], ["GET", "/api/connect/candidates"],
    ["POST", "/api/ai/feedback"], ["POST", "/api/projects/aaaaaaaaaaaaaaaaaaaaaaaa/assess"], ["GET", "/api/projects/aaaaaaaaaaaaaaaaaaaaaaaa/canvas"],
    ["POST", "/api/projects/aaaaaaaaaaaaaaaaaaaaaaaa/invites"], ["POST", "/api/invites/aaaaaaaaaaaaaaaaaaaaaaaa/respond"],
  ])("%s %s → 401", async (m, p) => expect((await anon.req(m, p, m === "GET" || m === "DELETE" ? undefined : {})).status).toBe(401));
});

describe("AU-2 lengkapi profil", () => {
  it("profil belum lengkap → lengkap setelah kampus/jurusan/semester terisi", async () => {
    const u = await newUser("Onboard", { onboard: false });
    expect((await u.get("/api/me")).json.profileComplete).toBe(false);
    expect((await u.patch("/api/me", { campus: "STMIK Widya Utama", major: "Informatika", semester: 5 })).status).toBe(200);
    expect((await u.get("/api/me")).json).toMatchObject({ profileComplete: true, campus: "STMIK Widya Utama", semester: 5 });
  });
  it("validasi: semester di luar 1–14 dan teks terlalu pendek ditolak", async () => {
    const u = await newUser("Valid");
    for (const b of [{ semester: 0 }, { semester: 15 }, { semester: 2.5 }, { campus: "x" }, { major: "" }, { visibility: "rahasia" }]) expect((await u.patch("/api/me", b)).status, JSON.stringify(b)).toBe(400);
  });
});

describe("PR-1 privasi & hak data", () => {
  it("profil default privat; bisa dijadikan publik dan kembali privat", async () => {
    const u = await newUser("Privat");
    expect((await u.get("/api/me")).json.visibility).toBe("private");
    await u.patch("/api/me", { visibility: "public" }); expect((await u.get("/api/me")).json.visibility).toBe("public");
    await u.patch("/api/me", { visibility: "private" }); expect((await u.get("/api/me")).json.visibility).toBe("private");
  });
  it("ekspor data berisi profil & proyek milik sendiri", async () => {
    const u = await newUser("Ekspor"); await completeKnow(u); await u.get("/api/team");
    const r = await u.get("/api/me?export=1");
    expect(r.status).toBe(200);
    expect(r.json.profile.skills.length).toBeGreaterThan(0); expect(r.json.projects).toHaveLength(1); expect(r.json.user.email).toBe(u.email);
  });
  it("hapus akun: data terhapus, sesi lama ditolak, tidak bisa login lagi", async () => {
    const u = await newUser("Hapus"); await completeKnow(u); await u.get("/api/team");
    const before = await withDb(async (db) => ({ users: await db.collection("users").countDocuments({ email: u.email }) }));
    expect(before.users).toBe(1);
    const old = { ...u.jar };
    expect((await u.del("/api/me")).status).toBe(200);
    const after = await withDb(async (db) => ({
      users: await db.collection("users").countDocuments({ email: u.email }),
      profiles: await db.collection("profiles").countDocuments({ skills: { $exists: true }, "skills.name": "Python", userId: { $exists: true } }),
    }));
    expect(after.users).toBe(0);
    const ghost = new Api(); ghost.jar = old;
    expect((await ghost.get("/api/me")).status).toBe(401); // JWT lama tidak lagi valid
    const again = new Api(); await again.login(u.email, u.password);
    expect((await again.get("/api/me")).status).toBe(401);
    void after.profiles;
  });
  it("hapus akun melepas keanggotaan dari proyek orang lain", async () => {
    const owner = await newUser("Pemilik", { visibility: "public" }); await completeKnow(owner);
    const member = await newUser("Anggota", { visibility: "public" }); await completeKnow(member);
    const t = (await owner.get("/api/team")).json;
    const mid = await withDb(async (db) => String((await db.collection("users").findOne({ email: member.email }))!._id));
    await owner.post(`/api/projects/${t.projectId}/invites`, { userId: mid, role: "X" });
    await member.post(`/api/invites/${t.projectId}/respond`, { accept: true });
    expect((await owner.get("/api/team")).json.members).toHaveLength(2);
    await member.del("/api/me");
    expect((await owner.get("/api/team")).json.members).toHaveLength(1);
  });
});
