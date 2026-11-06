import { INDICATORS, WEIGHTS_VERSION } from "./catalog";

export type SkillLevel = { name: string; level: number | null };
export type RoleSkill = { name: string; level: number; weight: number };

/** prioritas_s = max(0, target_s − level_s) × w_s  (PRD: Prioritas belajar) */
export function gapAnalysis(userSkills: SkillLevel[], required: RoleSkill[]) {
  const lv = new Map(userSkills.map((s) => [s.name, s.level]));
  return required
    .map((s) => {
      const cur = lv.get(s.name) ?? 0; // tidak dipilih = belum punya (0)
      const gap = Math.max(0, s.level - cur);
      return { name: s.name, cur, target: s.level, weight: s.weight, gap, priority: gap * s.weight };
    })
    .sort((a, b) => b.priority - a.priority || b.weight - a.weight);
}

type Cand = { skills: SkillLevel[]; interests: string[] };

/**
 * match = 80 · Σ_G w·min(gap, max(0, lvl_c − lvl_u)) / Σ_G w·gap  +  20 · |I_u ∩ I_c| / |I_u ∪ I_c|
 * Mengembalikan juga kontribusi per skill untuk kalimat "Kenapa klop".
 */
export function matchScore(me: Cand, cand: Cand, gaps: ReturnType<typeof gapAnalysis>) {
  const G = gaps.filter((g) => g.gap > 0);
  const cl = new Map(cand.skills.map((s) => [s.name, s.level]));
  let num = 0, den = 0;
  const contrib: { skill: string; value: number; candLevel: number }[] = [];
  for (const g of G) {
    const c = cl.get(g.name) ?? 0;
    const covered = Math.min(g.gap, Math.max(0, c - g.cur));
    num += g.weight * covered;
    den += g.weight * g.gap;
    if (covered > 0) contrib.push({ skill: g.name, value: g.weight * covered, candLevel: c });
  }
  const skillPart = den > 0 ? 80 * (num / den) : 0;
  const a = new Set(me.interests), b = new Set(cand.interests);
  const inter = [...a].filter((x) => b.has(x)).length;
  const uni = new Set([...a, ...b]).size;
  const interestPart = uni > 0 ? 20 * (inter / uni) : 0;
  contrib.sort((x, y) => y.value - x.value);
  return { match: Math.round(skillPart + interestPart), contrib, sharedInterests: [...a].filter((x) => b.has(x)) };
}

/** skor = Σ b_i · v_i, Σ b_i = 1  (PRD: Skor kesiapan) */
export function weightedScore(values: Record<string, number>) {
  const score = Math.round(INDICATORS.reduce((acc, i) => acc + i.weight * clamp(values[i.key] ?? 0), 0));
  return { score, level: levelOf(score), weightsVersion: WEIGHTS_VERSION };
}
export const levelOf = (s: number) => (s >= 80 ? "Siap diuji coba" : s >= 60 ? "Udah lumayan siap" : "Masih perlu digodok");
export const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));

export type LeveledSkill = { name: string; level: number | null };

/**
 * Kecocokan pengguna dengan sebuah peran (0–1): 70% skill, 30% minat.
 * Skill dihitung berbobot dan berdasarkan level: kredit = bobot × min(1, level / level yang dituntut).
 * Skill yang tidak dipilih = 0. Mengembalikan juga rincian untuk penjelasan.
 */
export function roleFit(role: any, skills: LeveledSkill[], interests: string[]) {
  const lv = new Map(skills.map((s) => [s.name, s.level ?? 0]));
  const total = role.requiredSkills.reduce((a: number, s: any) => a + s.weight, 0) || 1;
  let got = 0;
  const matched: { name: string; weight: number }[] = [], missing: { name: string; weight: number }[] = [];
  for (const s of role.requiredSkills) {
    const l = lv.get(s.name) ?? 0;
    got += s.weight * Math.min(1, l / s.level);
    (l >= s.level - 1 && l > 0 ? matched : missing).push({ name: s.name, weight: s.weight });
  }
  const matchedTags = role.tags.filter((t: string) => interests.includes(t));
  const tg = role.tags.length ? matchedTags.length / role.tags.length : 0;
  return {
    fit: 0.7 * (got / total) + 0.3 * tg,
    matched: matched.sort((x, y) => y.weight - x.weight).map((m) => m.name),
    missing: missing.sort((x, y) => y.weight - x.weight).map((m) => m.name),
    matchedTags,
  };
}

