import { Types } from "mongoose";
import { Activity, Assessment, CANVAS_KEYS, LearningPlan, Profile, Project, Role, User } from "./models";
import { GOALS, LEARNING, ROLE_SEEDS, WORK_STYLES } from "./catalog";
import { gapAnalysis, matchScore, roleFit, type LeveledSkill } from "./scoring";
import { isFilled } from "./templates";
import { HttpError } from "./api";

export const MAX_TEAM = 5;
export const INVITE_TTL_MS = 7 * 24 * 3600 * 1000;
export const oid = (id: string) => new Types.ObjectId(id);

/* ---------- Roles (data referensi) ---------- */
export async function ensureRoles() {
  if ((await Role.estimatedDocumentCount()) === 0) await Role.insertMany(ROLE_SEEDS).catch(() => {});
  return Role.find().lean<any[]>();
}

/** Tebak peran target dari skill (berlevel) + minat (KN-2). Bisa dipilih ulang pengguna di KNOW/GROW. */
export async function inferTargetRole(skills: LeveledSkill[], interests: string[]) {
  const roles = await ensureRoles();
  return [...roles].sort((x, y) => roleFit(y, skills, interests).fit - roleFit(x, skills, interests).fit)[0].slug as string;
}

/**
 * Peran + kecocokan + alasan, urut dari yang paling cocok. `limit` = berapa teratas; peran yang sedang dipilih
 * pengguna selalu disertakan walau di luar teratas. Dipakai panel KNOW (limit 3) dan halaman "Semua peran" (semua).
 */
export async function roleOptions(profile: any, limit = 3) {
  const roles = await ensureRoles();
  const all = roles
    .map((r) => { const f = roleFit(r, profile.skills ?? [], profile.interests ?? []); return { slug: r.slug, name: r.name, fields: r.tags as string[], fit: Math.round(f.fit * 100), matched: f.matched.slice(0, 3), missing: f.missing.slice(0, 2), tags: f.matchedTags, skills: r.requiredSkills.map((x: any) => x.name) as string[] }; })
    .sort((a, b) => b.fit - a.fit);
  const top = all.slice(0, limit);
  const chosen = all.find((r) => r.slug === profile.targetRole);
  return chosen && !top.some((r) => r.slug === chosen.slug) ? [...top, chosen] : top;
}

/* ---------- Profil ---------- */
export async function getProfile(userId: string) {
  const p = await Profile.findOne({ userId: oid(userId) }).lean<any>();
  if (!p) return p;
  const role = p.targetRole ? (await ensureRoles()).find((r) => r.slug === p.targetRole) : null;
  return { ...p, targetRoleName: role?.name ?? null };
}

const rated = (sk: any) => Number.isInteger(sk?.level) && sk.level >= 1 && sk.level <= 5;

/** `patch.skills` = [{name, level|null}] (null = belum dinilai). `infer` = hitung ulang peran target. */
export async function saveProfile(userId: string, patch: any, infer = false) {
  const { targetRoleName: _n, ...cur } = ((await getProfile(userId)) ?? {}) as any;
  const next: any = { ...cur, ...patch };
  const style = WORK_STYLES.find((w) => w.id === next.workStyle);
  next.profileLabel = style?.label ?? cur.profileLabel;
  const skills: any[] = next.skills ?? [];
  // Data lama hanya punya `goal` tunggal.
  next.goals = (next.goals?.length ? next.goals : next.goal ? [next.goal] : []) as string[];
  next.goal = next.goals[0] ?? null; // null (bukan undefined) agar benar-benar terhapus di database
  next.levelsRated = skills.length > 0 && skills.every(rated);
  // KNOW selesai hanya bila SEMUA skill terpilih sudah dinilai pengguna (tanpa level default).
  next.knowDone = !!(next.interests?.length && next.levelsRated && next.goals.length > 0 && next.workStyle);
  if (!next.knowDone) next.targetRole = null; // jangan menampilkan peran basi saat KNOW belum lengkap
  else if ((!next.targetRole || infer) && !patch.targetRole) next.targetRole = await inferTargetRole(skills.filter(rated), next.interests);
  const { _id, userId: _u, __v, ...set } = next;
  const saved = await Profile.findOneAndUpdate({ userId: oid(userId) }, { $set: set }, { upsert: true, returnDocument: "after" }).lean<any>();
  const role = (await ensureRoles()).find((r) => r.slug === saved.targetRole);
  return { ...saved, targetRoleName: role?.name ?? null, roleOptions: saved.knowDone ? await roleOptions(saved) : [] };
}

/* ---------- GROW ---------- */
export async function getPlan(userId: string) {
  const profile = await getProfile(userId);
  if (!profile?.knowDone) throw new HttpError(409, "Selesaikan KNOW dulu");
  const roles = await ensureRoles();
  const role = roles.find((r) => r.slug === profile.targetRole) ?? roles[0];

  // Skill yang dibutuhkan tapi belum dipilih di KNOW dianggap level 1 (belum dikuasai).
  const levels = profile.skills as { name: string; level: number }[];
  const gaps = gapAnalysis(levels, role.requiredSkills);

  const old = await LearningPlan.findOne({ userId: oid(userId) }).lean<any>();
  const doneByTitle = new Map<string, boolean>((old?.items ?? []).map((i: any) => [i.title, i.done]));
  const items: any[] = [];
  for (const g of gaps.filter((x) => x.gap > 0)) {
    const cat = LEARNING[g.name] ?? [];
    cat.slice(0, g.gap >= 2 ? 2 : 1).forEach((c) =>
      items.push({ skill: g.name, title: c.title, meta: c.meta, priority: g.priority, done: doneByTitle.get(c.title) ?? false }),
    );
  }
  await LearningPlan.findOneAndUpdate({ userId: oid(userId) }, { $set: { items, generatedAt: new Date() } }, { upsert: true });
  const suggestions = roles.filter((r) => r.slug !== role.slug)
    .map((r) => ({ slug: r.slug, name: r.name, fit: Math.round(roleFit(r, levels, profile.interests ?? []).fit * 100) }))
    .sort((a, b) => b.fit - a.fit).slice(0, 3);
  return {
    role: { slug: role.slug, name: role.name },
    roles: roles.map((r) => ({ slug: r.slug, name: r.name })),
    gaps, suggestions, items, levelsRated: !!profile.levelsRated,
  };
}

/* ---------- Proyek & tim ---------- */
export async function ensureProject(userId: string) {
  const mine = await Project.findOne({ ownerId: oid(userId) });
  if (mine) return mine;
  const profile = await getProfile(userId);
  // Upsert atomik: request paralel (layout + halaman + API) tidak boleh saling bentrok di indeks unik ownerId.
  return Project.findOneAndUpdate(
    { ownerId: oid(userId) },
    { $setOnInsert: { ownerId: oid(userId), title: "Proyek tanpa judul", members: [{ userId: oid(userId), role: profile?.targetRoleName ?? "Anggota", status: "accepted", invitedAt: new Date() }] } },
    { upsert: true, returnDocument: "after" },
  );
}

/** Proyek tempat pengguna menjadi anggota yang sudah menerima (bisa proyek miliknya atau milik orang lain). */
export async function activeProjectFor(userId: string) {
  const u = oid(userId);
  const joined = await Project.findOne({ ownerId: { $ne: u }, members: { $elemMatch: { userId: u, status: "accepted" } } });
  return joined ?? ensureProject(userId);
}

export async function assertMember(projectId: string, userId: string) {
  const p = await Project.findById(projectId);
  if (!p) throw new HttpError(404, "Proyek tidak ditemukan");
  if (!p.members.some((m: any) => String(m.userId) === userId && m.status === "accepted")) throw new HttpError(403, "Bukan anggota tim");
  return p;
}

export const isExpired = (m: any) => m.status === "invited" && Date.now() - new Date(m.invitedAt).getTime() > INVITE_TTL_MS;
/** Bagian terisi = ada isi dan tidak lagi memuat placeholder [..] dari template. */
export const canvasFilled = (c: any) => CANVAS_KEYS.filter((k) => isFilled(c?.[k])).length;

export async function candidates(userId: string, roleFilter?: string) {
  const me = await getProfile(userId);
  if (!me?.knowDone) throw new HttpError(409, "Selesaikan KNOW dulu");
  const plan = await getPlan(userId);
  const project = await activeProjectFor(userId);

  const exclude = new Set<string>([userId]);
  project.members.forEach((m: any) => { if (m.status !== "declined" && !isExpired(m)) exclude.add(String(m.userId)); });

  // Pernah menolak undangan dari pengguna ini → jangan tampilkan lagi.
  const declinedMe = await Project.find({ ownerId: oid(userId), "members.status": "declined" }).lean<any[]>();
  declinedMe.forEach((p) => p.members.forEach((m: any) => m.status === "declined" && exclude.add(String(m.userId))));

  const publicUsers = await User.find({ visibility: "public", _id: { $nin: [...exclude].map(oid) } }).lean<any[]>();
  const profs = await Profile.find({ userId: { $in: publicUsers.map((u) => u._id) }, knowDone: true }).lean<any[]>();
  const uById = new Map(publicUsers.map((u) => [String(u._id), u]));

  // Sudah di tim lain yang penuh → sembunyikan.
  const teams = await Project.find({ "members.userId": { $in: profs.map((p) => p.userId) } }).lean<any[]>();
  const full = new Set<string>();
  for (const t of teams) {
    const n = t.members.filter((m: any) => m.status === "accepted").length;
    if (n >= MAX_TEAM) t.members.forEach((m: any) => full.add(String(m.userId)));
  }

  const out = profs
    .filter((p) => !full.has(String(p.userId)))
    .map((p) => {
      const u = uById.get(String(p.userId));
      const { match, contrib, sharedInterests } = matchScore(me, p, plan.gaps);
      const top = contrib[0];
      const reason = top
        ? `jago ${top.skill} (level ${top.candLevel}), pas buat nutup skill yang masih kurang di kamu${contrib[1] ? ` — plus ${contrib[1].skill}` : ""}.`
        : sharedInterests.length ? `punya minat yang sama di ${sharedInterests.join(", ")}.` : "profilnya melengkapi timmu.";
      const best = top?.skill ?? p.skills?.[0]?.name ?? "Anggota";
      return {
        userId: String(p.userId), name: u?.name ?? "Pengguna", major: u?.major ?? "", campus: u?.campus ?? "",
        role: best, skills: (p.skills ?? []).slice().sort((a: any, b: any) => b.level - a.level).slice(0, 3).map((s: any) => s.name),
        match, reason, tags: contrib.map((c) => c.skill),
      };
    })
    .filter((c) => !roleFilter || roleFilter === "all" || c.tags.includes(roleFilter))
    .sort((a, b) => b.match - a.match);
  return { candidates: out, gapSkills: plan.gaps.filter((g) => g.gap > 0).map((g) => g.name) };
}

export async function teamView(userId: string) {
  const project = await activeProjectFor(userId);
  const ids = project.members.map((m: any) => m.userId);
  const users = await User.find({ _id: { $in: ids } }).lean<any[]>();
  const profs = await Profile.find({ userId: { $in: ids } }).lean<any[]>();
  const uBy = new Map(users.map((u) => [String(u._id), u]));
  const pBy = new Map(profs.map((p) => [String(p.userId), p]));
  const members = project.members
    .filter((m: any) => m.status !== "declined" && !isExpired(m))
    .map((m: any) => {
      const u = uBy.get(String(m.userId));
      const top = (pBy.get(String(m.userId))?.skills ?? []).slice().sort((a: any, b: any) => b.level - a.level)[0]?.name;
      const skills = (pBy.get(String(m.userId))?.skills ?? []) as { name: string; level: number }[];
      return { userId: String(m.userId), name: u?.name ?? "Pengguna", role: m.role || top || "Anggota", status: m.status, isOwner: String(m.userId) === String(project.ownerId), skills };
    });
  return { projectId: String(project._id), title: project.title, tagline: project.tagline, members, isOwner: String(project.ownerId) === userId };
}

export async function pendingInvites(userId: string) {
  const u = oid(userId);
  const ps = await Project.find({ members: { $elemMatch: { userId: u, status: "invited" } } }).lean<any[]>();
  const owners = await User.find({ _id: { $in: ps.map((p) => p.ownerId) } }).lean<any[]>();
  const oBy = new Map(owners.map((o) => [String(o._id), o]));
  return ps.flatMap((p) => {
    const m = p.members.find((x: any) => String(x.userId) === userId);
    if (!m || isExpired(m)) return [];
    return [{ id: String(p._id), projectTitle: p.title, owner: oBy.get(String(p.ownerId))?.name ?? "Pengguna", role: m.role, invitedAt: m.invitedAt }];
  });
}

export async function logActivity(actorId: string, type: string, projectId?: any, payload: any = {}) {
  await Activity.create({ actorId: oid(actorId), projectId, type, payload });
}

/* ---------- Dashboard ---------- */
const STEP_LABELS = ["KNOW", "GROW", "CONNECT", "CREATE", "IMPACT"] as const;

export async function dashboard(userId: string) {
  const user = await User.findById(userId).lean<any>();
  const profile = await getProfile(userId);
  const project = await activeProjectFor(userId);
  const filled = canvasFilled(project.canvas);
  const last = await Assessment.findOne({ projectId: project._id }).sort({ createdAt: -1 }).lean<any>();
  const team = await teamView(userId);
  const accepted = team.members.filter((m: any) => m.status === "accepted").length;

  const done = [
    !!profile?.knowDone,
    !!profile?.knowDone && !!profile?.growReviewed,
    accepted >= 2,
    filled === 6,
    !!last,
  ];
  const firstOpen = done.indexOf(false);
  const steps = STEP_LABELS.map((key, i) => ({ key, done: done[i], status: done[i] ? "done" : i === firstOpen ? "active" : "next" }));

  let next: { title: string; href: string; cta: string };
  if (!profile?.knowDone) next = { title: "Kenalan dulu sama dirimu lewat 4 pertanyaan", href: "/know", cta: "Mulai KNOW" };
  else if (!profile.growReviewed) next = { title: "Lihat gap skill dan rencana belajarmu di GROW", href: "/grow", cta: "Buka GROW" };
  else if (accepted < 2) next = { title: "Ajak minimal satu partner ke timmu", href: "/connect", cta: "Cari partner" };
  else if (filled < 6) {
    const k = CANVAS_KEYS.findIndex((key) => !isFilled(project.canvas?.[key]));
    next = { title: `Tinggal isi bagian ${["Masalah", "Akar Masalah", "Solusi", "Teknologi", "Fitur", "Dampak"][k]} di kanvas proyekmu`, href: `/create?s=${k}`, cta: "Buka kanvas" };
  } else if (!last) next = { title: "Kanvas lengkap! Cek skor kesiapan proyekmu", href: "/impact", cta: "Buka IMPACT" };
  else next = { title: "Upgrade bagian yang masih lemah, lalu nilai ulang", href: "/create", cta: "Buka kanvas" };

  const mine = (await Project.find({ "members.userId": oid(userId) }).select("_id").lean<any[]>()).map((p) => p._id);
  const acts = await Activity.find({ $or: [{ projectId: { $in: mine } }, { actorId: oid(userId) }] }).sort({ createdAt: -1 }).limit(10).lean<any[]>();
  const actors = await User.find({ _id: { $in: acts.map((a) => a.actorId) } }).lean<any[]>();
  const aBy = new Map(actors.map((a) => [String(a._id), a.name]));

  const plan = profile?.knowDone ? await getPlan(userId).catch(() => null) : null;
  return {
    user: { name: user?.name ?? "", major: user?.major ?? "" },
    steps, pct: Math.round((done.filter(Boolean).length / 5) * 100),
    next, canvasFilled: filled, projectTitle: project.title, tagline: project.tagline,
    canvasKeys: CANVAS_KEYS.map((k) => ({ key: k, filled: isFilled(project.canvas?.[k]) })),
    profile: profile?.knowDone ? { label: profile.profileLabel, interests: profile.interests, skills: profile.skills.map((s: any) => s.name), goal: (profile.goals?.length ? profile.goals : [profile.goal]).map((id: string) => GOALS.find((g) => g.id === id)?.title).filter(Boolean).join(" · ") } : null,
    topGaps: plan?.gaps.filter((g) => g.gap > 0).slice(0, 3) ?? [],
    team: team.members, score: last ? { score: last.score, level: last.level } : null,
    invites: await pendingInvites(userId),
    activities: acts.map((a) => ({ type: a.type, actor: aBy.get(String(a.actorId)) ?? "Seseorang", payload: a.payload, at: a.createdAt })),
  };
}
