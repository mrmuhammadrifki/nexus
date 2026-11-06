import { z } from "zod";
import { route, requireUser } from "@/lib/api";
import { User, Profile, LearningPlan, Project, Activity, Assessment, AiFeedback } from "@/lib/models";
import { oid } from "@/lib/services";
import { signOut } from "@/auth";

const patch = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  campus: z.string().trim().min(2).max(120).optional(),
  major: z.string().trim().min(2).max(120).optional(),
  semester: z.number().int().min(1).max(14).optional(),
  visibility: z.enum(["public", "private"]).optional(),
});

export const GET = route(async (req: Request) => {
  const id = await requireUser();
  const u = await User.findById(id).lean<any>();
  const base = { name: u.name, email: u.email, campus: u.campus ?? "", major: u.major ?? "", semester: u.semester ?? null, visibility: u.visibility, profileComplete: !!(u.campus && u.major && u.semester) };
  // Unduh semua data (privasi): ?export=1
  if (new URL(req.url).searchParams.get("export")) {
    const projects = await Project.find({ ownerId: oid(id) }).lean();
    const pids = projects.map((p: any) => p._id);
    return {
      user: base, profile: await Profile.findOne({ userId: oid(id) }).lean(), learningPlan: await LearningPlan.findOne({ userId: oid(id) }).lean(),
      projects, assessments: await Assessment.find({ projectId: { $in: pids } }).lean(), activities: await Activity.find({ actorId: oid(id) }).lean(),
    };
  }
  return base;
});

export const PATCH = route(async (req: Request) => {
  const id = await requireUser();
  const d = patch.parse(await req.json());
  await User.updateOne({ _id: oid(id) }, { $set: d });
  return { ok: true };
});

/** Hapus akun beserta datanya. Proyek milik pengguna dihapus; keanggotaan di proyek lain dilepas. */
export const DELETE = route(async () => {
  const id = await requireUser();
  const u = oid(id);
  const mine = await Project.find({ ownerId: u }).select("_id").lean<any[]>();
  const pids = mine.map((p) => p._id);
  await Promise.all([
    Profile.deleteOne({ userId: u }), LearningPlan.deleteOne({ userId: u }), Project.deleteMany({ ownerId: u }),
    Project.updateMany({ "members.userId": u }, { $pull: { members: { userId: u } } }),
    Assessment.deleteMany({ projectId: { $in: pids } }), AiFeedback.deleteMany({ projectId: { $in: pids } }),
    Activity.deleteMany({ $or: [{ actorId: u }, { projectId: { $in: pids } }] }), User.deleteOne({ _id: u }),
  ]);
  await signOut({ redirect: false });
  return { ok: true };
});
