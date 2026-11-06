import { describe, expect, it } from "vitest";
import { FIELDS, GOALS, INDICATORS, INTERESTS, LEARNING, LEVELS, MAX_GOALS, ROLE_SEEDS, SKILLS, WORK_STYLES, fieldsOfSkill, onlyKnown, popularSkillsFor, levelLabel } from "../../src/lib/catalog";

describe("katalog bidang & skill", () => {
  it("punya 12 bidang dan 33 skill unik, tanpa duplikat di dalam satu bidang", () => {
    expect(FIELDS).toHaveLength(12);
    expect(new Set(SKILLS).size).toBe(SKILLS.length);
    expect(SKILLS).toHaveLength(33);
    for (const f of FIELDS) expect(new Set(f.skills).size, f.name).toBe(f.skills.length);
  });
  it("INTERESTS = nama bidang; SKILLS = gabungan semua skill bidang", () => {
    expect(INTERESTS).toEqual(FIELDS.map((f) => f.name));
    expect([...SKILLS].sort()).toEqual([...new Set(FIELDS.flatMap((f) => f.skills))].sort());
  });
  it("SKILLS diurutkan dari yang muncul di paling banyak bidang", () => {
    const n = (s: string) => fieldsOfSkill(s).length;
    for (let i = 1; i < SKILLS.length; i++) expect(n(SKILLS[i - 1])).toBeGreaterThanOrEqual(n(SKILLS[i]));
  });
});

describe("konsistensi peran, materi belajar, dan bidang", () => {
  it("ada 22 peran dengan slug unik", () => {
    expect(ROLE_SEEDS).toHaveLength(22);
    expect(new Set(ROLE_SEEDS.map((r) => r.slug)).size).toBe(22);
  });
  it("semua skill & tag peran ada di katalog; bobot 1–3, level 1–5", () => {
    for (const r of ROLE_SEEDS) {
      for (const t of r.tags) expect(INTERESTS, `${r.slug} tag ${t}`).toContain(t);
      expect(r.requiredSkills.length, r.slug).toBeGreaterThan(0);
      for (const s of r.requiredSkills) {
        expect(SKILLS, `${r.slug} skill ${s.name}`).toContain(s.name);
        expect(s.weight).toBeGreaterThanOrEqual(1); expect(s.weight).toBeLessThanOrEqual(3);
        expect(s.level).toBeGreaterThanOrEqual(1); expect(s.level).toBeLessThanOrEqual(5);
      }
    }
  });
  it("setiap bidang punya minimal satu peran, dan setiap skill dituntut minimal satu peran", () => {
    for (const f of FIELDS) expect(ROLE_SEEDS.some((r) => r.tags.includes(f.name)), `bidang ${f.name}`).toBe(true);
    for (const s of SKILLS) expect(ROLE_SEEDS.some((r) => r.requiredSkills.some((x) => x.name === s)), `skill ${s}`).toBe(true);
  });
  it("setiap skill punya >= 2 materi belajar, dan tidak ada materi yatim", () => {
    for (const s of SKILLS) expect(LEARNING[s]?.length ?? 0, `materi ${s}`).toBeGreaterThanOrEqual(2);
    for (const k of Object.keys(LEARNING)) expect(SKILLS).toContain(k);
  });
});

describe("indikator IMPACT, level, target", () => {
  it("bobot 5 indikator berjumlah 1", () => {
    expect(INDICATORS).toHaveLength(5);
    expect(INDICATORS.reduce((a, i) => a + i.weight, 0)).toBeCloseTo(1, 10);
  });
  it("level 1–5 berlabel; level kosong = belum dinilai", () => {
    expect(LEVELS.map((l) => l.n)).toEqual([1, 2, 3, 4, 5]);
    expect(levelLabel(3)).toBe("Cukup bisa");
    expect(levelLabel(null)).toBe("Belum dinilai");
  });
  it("target (8) dan gaya kerja (4) lengkap, id unik, maksimal 3 target", () => {
    expect(GOALS).toHaveLength(8); expect(new Set(GOALS.map((g) => g.id)).size).toBe(8);
    expect(WORK_STYLES).toHaveLength(4);
    expect(MAX_GOALS).toBe(3);
  });
});

describe("skill populer per bidang", () => {
  it("menampilkan paling banyak 12 dan mengutamakan skill bidang terpilih", () => {
    const p = popularSkillsFor(["Kesehatan"]);
    expect(p.length).toBeLessThanOrEqual(12);
    expect(p[0]).toBe("Riset"); // urutan pertama di bidang Kesehatan
    expect(p).toContain("Statistika");
    expect(p).not.toContain("Mobile (Flutter/Android)"); // tidak relevan dengan Kesehatan
  });
  it("menggabungkan beberapa bidang, tanpa duplikat", () => {
    const p = popularSkillsFor(["Teknologi", "Ekonomi Kreatif"]);
    expect(new Set(p).size).toBe(p.length);
    expect(p).toEqual(expect.arrayContaining(["UI/UX", "Python", "Desain Grafis"]));
  });
  it("tanpa bidang → populer umum; bidang tak dikenal diabaikan", () => {
    expect(popularSkillsFor([])).toHaveLength(12);
    expect(popularSkillsFor(["Bidang Ngawur"])).toEqual(popularSkillsFor([]));
  });
});

describe("onlyKnown (hanya katalog yang diterima)", () => {
  it("menyamakan huruf, membuang yang tak dikenal & duplikat, membatasi jumlah", () => {
    expect(onlyKnown(["python", "Rust", "SQL", "sql", "  UI/UX "], SKILLS, 20)).toEqual(["Python", "SQL", "UI/UX"]);
    expect(onlyKnown(SKILLS.slice(), SKILLS, 5)).toHaveLength(5);
    expect(onlyKnown(["<script>alert(1)</script>"], SKILLS, 5)).toEqual([]);
  });
});
