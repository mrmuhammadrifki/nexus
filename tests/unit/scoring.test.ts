import { describe, expect, it } from "vitest";
import { clamp, gapAnalysis, levelOf, matchScore, roleFit, weightedScore } from "../../src/lib/scoring";
import { INDICATORS, ROLE_SEEDS } from "../../src/lib/catalog";

describe("prioritas belajar = max(0, target − level) × bobot", () => {
  const req = [{ name: "UI/UX", level: 4, weight: 2 }, { name: "SQL", level: 4, weight: 3 }, { name: "Python", level: 3, weight: 1 }];
  it("menghitung gap dan prioritas sesuai rumus PRD", () => {
    const g = gapAnalysis([{ name: "UI/UX", level: 2 }, { name: "SQL", level: 4 }, { name: "Python", level: 5 }], req);
    const by = Object.fromEntries(g.map((x) => [x.name, x]));
    expect(by["UI/UX"]).toMatchObject({ cur: 2, target: 4, gap: 2, priority: 4 });
    expect(by.SQL).toMatchObject({ gap: 0, priority: 0 }); // on target
    expect(by.Python).toMatchObject({ gap: 0, priority: 0 }); // melebihi target tidak negatif
  });
  it("terurut dari prioritas tertinggi", () => {
    const g = gapAnalysis([], req);
    const p = g.map((x) => x.priority);
    expect(p).toEqual([...p].sort((a, b) => b - a));
    expect(g[0].name).toBe("SQL"); // (4-0)*3 = 12
  });
  it("skill yang tidak dipilih dihitung level 0 (bukan 1); level null = 0", () => {
    const g = gapAnalysis([{ name: "SQL", level: null }], req);
    expect(g.find((x) => x.name === "SQL")!.cur).toBe(0);
    expect(g.find((x) => x.name === "UI/UX")!.cur).toBe(0);
  });
});

describe("skor match CONNECT", () => {
  const me = { skills: [{ name: "Analisis Data", level: 4 }], interests: ["Teknologi", "Pendidikan"] };
  const gaps = [
    { name: "UI/UX", cur: 2, target: 4, weight: 2, gap: 2, priority: 4 },
    { name: "Public Speaking", cur: 2, target: 4, weight: 1, gap: 2, priority: 2 },
  ];
  it("menutup seluruh gap + minat identik → 100", () => {
    const r = matchScore(me, { skills: [{ name: "UI/UX", level: 5 }, { name: "Public Speaking", level: 5 }], interests: ["Teknologi", "Pendidikan"] }, gaps);
    expect(r.match).toBe(100);
  });
  it("tidak menutup gap & tanpa minat sama → 0", () => {
    expect(matchScore(me, { skills: [{ name: "Python", level: 5 }], interests: ["Pertanian"] }, gaps).match).toBe(0);
  });
  it("kontribusi dibatasi oleh gap (level kandidat berlebih tidak menambah)", () => {
    const a = matchScore(me, { skills: [{ name: "UI/UX", level: 4 }], interests: [] }, gaps).match;
    const b = matchScore(me, { skills: [{ name: "UI/UX", level: 5 }], interests: [] }, gaps).match;
    expect(a).toBe(b);
  });
  it("skill 80% + minat 20%: Jaccard dihitung benar", () => {
    // menutup UI/UX penuh (bobot 2 dari total 2+1=3 → 80*2/3≈53.3) + irisan 1 dari gabungan 3 → 20/3≈6.7 → 60
    const r = matchScore(me, { skills: [{ name: "UI/UX", level: 4 }], interests: ["Teknologi", "Sosial"] }, gaps);
    expect(r.match).toBe(60);
    expect(r.contrib[0].skill).toBe("UI/UX");
    expect(r.sharedInterests).toEqual(["Teknologi"]);
  });
  it("tanpa gap sama sekali → hanya komponen minat", () => {
    expect(matchScore(me, { skills: [], interests: ["Teknologi", "Pendidikan"] }, []).match).toBe(20);
  });
});

describe("skor kesiapan IMPACT = Σ(bobot × nilai)", () => {
  it("dihitung dari bobot tetap dan dibulatkan", () => {
    const v = { problem_clarity: 85, solution_relevance: 80, user_need: 55, collaboration: 90, sustainability: 50 };
    // 0.25*85 + 0.25*80 + 0.2*55 + 0.15*90 + 0.15*50 = 21.25+20+11+13.5+7.5 = 73.25
    expect(weightedScore(v)).toEqual({ score: 73, level: "Udah lumayan siap", weightsVersion: "v1" });
  });
  it("bisa dihitung ulang manual dari bobot", () => {
    const v = Object.fromEntries(INDICATORS.map((i, n) => [i.key, 40 + n * 10]));
    const manual = Math.round(INDICATORS.reduce((a, i) => a + i.weight * v[i.key], 0));
    expect(weightedScore(v).score).toBe(manual);
  });
  it("batas kategori 60 dan 80", () => {
    expect([levelOf(0), levelOf(59), levelOf(60), levelOf(79), levelOf(80), levelOf(100)]).toEqual(["Masih perlu digodok", "Masih perlu digodok", "Udah lumayan siap", "Udah lumayan siap", "Siap diuji coba", "Siap diuji coba"]);
  });
  it("nilai di luar 0–100 atau bukan angka dibatasi; indikator hilang = 0", () => {
    expect(clamp(150)).toBe(100); expect(clamp(-5)).toBe(0); expect(clamp(NaN)).toBe(0);
    expect(weightedScore({}).score).toBe(0);
    expect(weightedScore(Object.fromEntries(INDICATORS.map((i) => [i.key, 999]))).score).toBe(100);
  });
});

describe("kecocokan peran (roleFit)", () => {
  const role = { tags: ["Teknologi", "Pendidikan"], requiredSkills: [{ name: "Backend", level: 4, weight: 3 }, { name: "SQL", level: 4, weight: 1 }] };
  it("level lebih tinggi → lebih cocok; level 0 → 0 untuk skill itu", () => {
    const lo = roleFit(role, [{ name: "Backend", level: 1 }], []).fit;
    const hi = roleFit(role, [{ name: "Backend", level: 4 }], []).fit;
    expect(hi).toBeGreaterThan(lo);
    expect(roleFit(role, [], []).fit).toBe(0);
  });
  it("kredit dibatasi di level yang dituntut", () => {
    expect(roleFit(role, [{ name: "Backend", level: 5 }], []).fit).toBe(roleFit(role, [{ name: "Backend", level: 4 }], []).fit);
  });
  it("70% skill + 30% minat", () => {
    const full = roleFit(role, [{ name: "Backend", level: 4 }, { name: "SQL", level: 4 }], ["Teknologi", "Pendidikan"]).fit;
    expect(full).toBeCloseTo(1, 10);
    expect(roleFit(role, [{ name: "Backend", level: 4 }, { name: "SQL", level: 4 }], []).fit).toBeCloseTo(0.7, 10);
    expect(roleFit(role, [], ["Teknologi", "Pendidikan"]).fit).toBeCloseTo(0.3, 10);
  });
  it("menjelaskan skill yang cocok dan yang kurang", () => {
    const r = roleFit(role, [{ name: "Backend", level: 4 }], ["Teknologi"]);
    expect(r.matched).toEqual(["Backend"]); expect(r.missing).toEqual(["SQL"]); expect(r.matchedTags).toEqual(["Teknologi"]);
  });
  it("untuk 12 bidang, pengguna ber-5 skill teratas bidang itu mendapat peran yang bertag bidang tersebut", async () => {
    const { FIELDS } = await import("../../src/lib/catalog");
    for (const f of FIELDS) {
      const skills = f.skills.slice(0, 5).map((name) => ({ name, level: 4 }));
      const best = [...ROLE_SEEDS].sort((a, b) => roleFit(b, skills, [f.name]).fit - roleFit(a, skills, [f.name]).fit)[0];
      expect(best.tags, `${f.name} → ${best.name}`).toContain(f.name);
    }
  });
});
