import { beforeAll, describe, expect, it } from "vitest";
import { newUser, completeKnow } from "../support/client";
import { resetDb } from "../support/db";

beforeAll(resetDb);

describe("KNOW: skill tanpa level bawaan", () => {
  it("skill baru dipilih → belum dinilai, KNOW belum selesai, tanpa peran & opsi", async () => {
    const u = await newUser("Kuis");
    const r = await u.put("/api/profile", { interests: ["Teknologi"], skillNames: ["Analisis Data", "Python", "SQL"], goals: ["lomba"], workStyle: "analitis" });
    expect(r.status).toBe(200);
    expect(r.json.skills.map((s: any) => s.level)).toEqual([null, null, null]);
    expect(r.json).toMatchObject({ knowDone: false, levelsRated: false, targetRole: null, roleOptions: [] });
  });
  it("selesai hanya bila semua skill dinilai, lalu label gaya kerja & peran terisi", async () => {
    const u = await newUser("Bertahap");
    await u.put("/api/profile", { interests: ["Teknologi"], skillNames: ["Python", "SQL"], goals: ["lomba"], workStyle: "analitis" });
    let r = await u.put("/api/profile", { levels: [{ name: "Python", level: 4 }] });
    expect(r.json.knowDone).toBe(false);
    r = await u.put("/api/profile", { levels: [{ name: "SQL", level: 3 }] });
    expect(r.json).toMatchObject({ knowDone: true, levelsRated: true, profileLabel: "Si analis pemecah masalah" });
    expect(r.json.targetRole).toBeTruthy(); expect(r.json.targetRoleName).toBeTruthy();
  });
  it("level harus bilangan bulat 1–5", async () => {
    const u = await newUser("Level"); await completeKnow(u);
    for (const level of [0, 6, 2.5, -1]) expect((await u.put("/api/profile", { levels: [{ name: "Python", level }] })).status, String(level)).toBe(400);
  });
  it("menambah skill baru membuka KNOW lagi & mengosongkan peran; melepasnya menutup lagi", async () => {
    const u = await newUser("Tambah"); await completeKnow(u, { skills: { Python: 4, SQL: 3 } });
    let r = await u.put("/api/profile", { skillNames: ["Python", "SQL", "Riset"] });
    expect(r.json).toMatchObject({ knowDone: false, targetRole: null });
    expect(r.json.skills.find((s: any) => s.name === "Riset").level).toBeNull();
    expect(r.json.skills.find((s: any) => s.name === "Python").level).toBe(4); // level lama dipertahankan
    expect((await u.get("/api/profile")).json).toMatchObject({ targetRole: null, roleOptions: [] }); // tidak ada peran basi
    r = await u.put("/api/profile", { skillNames: ["Python", "SQL"] });
    expect(r.json.knowDone).toBe(true); expect(r.json.targetRole).toBeTruthy();
  });
});

describe("KNOW: katalog kurasi (tanpa input bebas)", () => {
  it("skill & bidang di luar katalog dibuang diam-diam; huruf disamakan; duplikat dibuang", async () => {
    const u = await newUser("Katalog");
    const r = await u.put("/api/profile", { interests: ["teknologi", "Bidang Ngawur", "TEKNOLOGI"], skillNames: ["python", "Hacking", "<script>x</script>", "SQL", "sql"] });
    expect(r.json.interests).toEqual(["Teknologi"]);
    expect(r.json.skills.map((s: any) => s.name)).toEqual(["Python", "SQL"]);
  });
  it("batas 12 bidang dan 20 skill", async () => {
    const u = await newUser("Batas");
    const { FIELDS, SKILLS } = await import("../../src/lib/catalog");
    const r = await u.put("/api/profile", { interests: FIELDS.map((f) => f.name), skillNames: SKILLS.slice(0, 33) });
    expect(r.json.interests).toHaveLength(12); expect(r.json.skills).toHaveLength(20);
  });
});

describe("KNOW: target (maks 3, urutan = prioritas)", () => {
  it("menyimpan urutan, target utama = pertama", async () => {
    const u = await newUser("Target");
    const r = await completeKnow(u, { goals: ["startup", "beasiswa", "lomba"] });
    expect(r.json.goals).toEqual(["startup", "beasiswa", "lomba"]); expect(r.json.goal).toBe("startup");
  });
  it("lebih dari 3 atau di luar katalog → 400; duplikat dibuang", async () => {
    const u = await newUser("TargetBatas"); await completeKnow(u);
    expect((await u.put("/api/profile", { goals: ["lomba", "magang", "riset", "proyek"] })).status).toBe(400);
    expect((await u.put("/api/profile", { goals: ["hacker"] })).status).toBe(400);
    expect((await u.put("/api/profile", { goals: ["riset", "riset", "magang"] })).json.goals).toEqual(["riset", "magang"]);
  });
  it("tanpa target KNOW belum selesai (dan target tidak 'hidup' lagi dari data lama)", async () => {
    const u = await newUser("TargetKosong"); await completeKnow(u, { goals: ["lomba"] });
    const r = await u.put("/api/profile", { goals: [] });
    expect(r.json).toMatchObject({ knowDone: false, goals: [] });
    expect((await u.get("/api/profile")).json.goals).toEqual([]);
  });
  it("kompatibel dengan `goal` tunggal", async () => {
    const u = await newUser("TargetLama"); await completeKnow(u);
    expect((await u.put("/api/profile", { goal: "proyek" })).json.goals).toEqual(["proyek"]);
  });
});

describe("KNOW: peran target (opsi, pilihan sendiri, semua peran)", () => {
  it("3 opsi terurut menurun dengan alasan; peran terpilih = teratas", async () => {
    const u = await newUser("Peran");
    const r = await completeKnow(u, { interests: ["Teknologi"], skills: { Backend: 5, SQL: 4, Java: 4 } });
    const o = r.json.roleOptions;
    expect(o).toHaveLength(3);
    expect(o.map((x: any) => x.fit)).toEqual([...o.map((x: any) => x.fit)].sort((a: number, b: number) => b - a));
    expect(r.json.targetRole).toBe(o[0].slug);
    expect(o[0].name).toBe("Backend Developer");
    expect(o[0].matched).toEqual(expect.arrayContaining(["Backend"]));
  });
  it("pilih peran sendiri tersimpan, tidak tertimpa saat menilai ulang; slug tak dikenal → 400", async () => {
    const u = await newUser("PilihPeran"); const r = await completeKnow(u);
    const pick = r.json.roleOptions[2].slug;
    expect((await u.put("/api/profile", { targetRole: pick })).json.targetRole).toBe(pick);
    expect((await u.put("/api/profile", { levels: [{ name: "SQL", level: 5 }] })).json.targetRole).toBe(pick);
    expect((await u.put("/api/profile", { targetRole: "ngawur" })).status).toBe(400);
  });
  it("/api/roles: 22 peran terurut menurun; bisa memilih yang kecocokannya 0%; peran pilihan ikut tampil di panel", async () => {
    const u = await newUser("SemuaPeran");
    expect((await u.get("/api/roles")).status).toBe(409); // sebelum KNOW selesai
    await completeKnow(u, { interests: ["Teknologi"], skills: { Backend: 4, SQL: 4 } });
    const { json } = await u.get("/api/roles");
    expect(json.roles).toHaveLength(22);
    expect(json.roles.map((r: any) => r.fit)).toEqual([...json.roles.map((r: any) => r.fit)].sort((a: number, b: number) => b - a));
    expect(json.roles.every((r: any) => r.fields.length > 0 && r.skills.length > 0)).toBe(true);
    const worst = json.roles.at(-1);
    expect(worst.fit).toBe(0);
    const p = await u.put("/api/profile", { targetRole: worst.slug });
    expect(p.json.targetRole).toBe(worst.slug);
    expect(p.json.roleOptions).toHaveLength(4); expect(p.json.roleOptions[3].slug).toBe(worst.slug);
    expect((await u.get("/api/roles")).json.current).toBe(worst.slug);
  });
  it("level lebih tinggi menaikkan kecocokan peran", async () => {
    const lo = await newUser("LevelRendah"), hi = await newUser("LevelTinggi");
    const a = await completeKnow(lo, { skills: { Backend: 1, SQL: 1, Java: 1 } }), b = await completeKnow(hi, { skills: { Backend: 5, SQL: 5, Java: 5 } });
    const fit = (r: any) => (r.json.roleOptions.find((o: any) => o.name === "Backend Developer")?.fit ?? 0);
    expect(fit(b)).toBeGreaterThan(fit(a));
  });
});
