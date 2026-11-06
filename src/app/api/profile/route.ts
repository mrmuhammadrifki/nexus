import { z } from "zod";
import { route, requireUser, HttpError } from "@/lib/api";
import { getProfile, saveProfile, logActivity, ensureRoles, roleOptions } from "@/lib/services";
import { GOALS, MAX_GOALS, INTERESTS, MAX_INTERESTS, MAX_SKILLS, SKILLS, WORK_STYLES, onlyKnown } from "@/lib/catalog";

const tag = z.string().min(1).max(60);
const lvl = z.object({ name: tag, level: z.number().int().min(1).max(5) });
const schema = z.object({
  interests: z.array(tag).max(40).optional(),
  skillNames: z.array(tag).max(60).optional(),
  goal: z.enum(GOALS.map((g) => g.id) as [string, ...string[]]).optional(), // kompatibilitas: = goals [goal]
  goals: z.array(z.enum(GOALS.map((g) => g.id) as [string, ...string[]])).max(MAX_GOALS).optional(),
  workStyle: z.enum(WORK_STYLES.map((g) => g.id) as [string, ...string[]]).optional(),
  targetRole: z.string().max(60).optional(),
  growReviewed: z.boolean().optional(),
  levels: z.array(lvl).max(20).optional(), // GR-1: pengguna menilai level skill sendiri
});

export const GET = route(async () => {
  const p = await getProfile(await requireUser());
  if (!p) return {};
  // Data lama yang di luar katalog tidak ditampilkan lagi.
  const clean = { ...p, goals: p.goals?.length ? p.goals : p.goal ? [p.goal] : [], interests: onlyKnown(p.interests ?? [], INTERESTS, 99), skills: (p.skills ?? []).filter((s: any) => SKILLS.includes(s.name)) };
  return { ...clean, roleOptions: p.knowDone ? await roleOptions(clean) : [] };
});

export const PUT = route(async (req: Request) => {
  const id = await requireUser();
  const { levels, interests, skillNames, goal, goals, workStyle, targetRole, growReviewed } = schema.parse(await req.json());
  const before = await getProfile(id);
  const patch: any = {};
  // Urutan = prioritas: yang pertama jadi target utama. Tanpa duplikat, maksimal MAX_GOALS.
  if (goals) {
    patch.goals = [...new Set(goals)].slice(0, MAX_GOALS);
    patch.goal = patch.goals[0] ?? null; // kosongkan `goal` lama juga, agar fallback data lama tidak menghidupkannya lagi
  } else if (goal) patch.goals = [goal];
  if (workStyle) patch.workStyle = workStyle;
  if (targetRole) {
    if (!(await ensureRoles()).some((r) => r.slug === targetRole)) throw new HttpError(400, "Peran tidak dikenal");
    patch.targetRole = targetRole;
  }
  if (growReviewed !== undefined) patch.growReviewed = growReviewed;
  if (interests) patch.interests = onlyKnown(interests, INTERESTS, MAX_INTERESTS);

  let skills: { name: string; level: number | null }[] = (before?.skills ?? []).map((s: any) => ({ name: s.name, level: s.level ?? null }));
  if (skillNames) {
    // Skill baru TIDAK diberi level bawaan: pengguna harus menilai sendiri (langkah "Seberapa mahir?").
    const keep = new Map(skills.map((s) => [s.name, s.level]));
    skills = onlyKnown(skillNames, SKILLS, MAX_SKILLS).map((name) => ({ name, level: keep.get(name) ?? null }));
  }
  if (levels) for (const l of levels) {
    const [name] = onlyKnown([l.name], SKILLS, 1);
    if (!name) continue;
    const hit = skills.find((s) => s.name === name);
    hit ? (hit.level = l.level) : skills.push({ name, level: l.level });
  }
  if (skillNames || levels) patch.skills = skills;

  const saved = await saveProfile(id, patch, !!(skillNames || interests));
  if (!before?.knowDone && saved?.knowDone) await logActivity(id, "know_done");
  return saved;
});
