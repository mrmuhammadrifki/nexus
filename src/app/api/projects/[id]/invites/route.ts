import { z } from "zod";
import { route, requireUser, HttpError } from "@/lib/api";
import { Project, User } from "@/lib/models";
import { MAX_TEAM, isExpired, logActivity, oid } from "@/lib/services";

export const POST = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const me = await requireUser();
  const { id } = await ctx.params;
  const { userId, role } = z.object({ userId: z.string().regex(/^[a-f\d]{24}$/i), role: z.string().max(60).optional() }).parse(await req.json());
  const p = await Project.findById(id);
  if (!p || String(p.ownerId) !== me) throw new HttpError(403, "Hanya pemilik proyek yang bisa mengajak");
  if (userId === me) throw new HttpError(400, "Tidak bisa mengajak diri sendiri");
  const target = await User.findOne({ _id: userId, visibility: "public" });
  if (!target) throw new HttpError(404, "Kandidat tidak tersedia");

  const live = p.members.filter((m: any) => m.status === "accepted" || (m.status === "invited" && !isExpired(m)));
  if (live.length >= MAX_TEAM) throw new HttpError(409, `Maksimal ${MAX_TEAM} anggota per tim`);
  const existing = p.members.find((m: any) => String(m.userId) === userId);
  if (existing?.status === "accepted" || (existing?.status === "invited" && !isExpired(existing))) throw new HttpError(409, "Sudah diajak");
  if (existing?.status === "declined") throw new HttpError(409, "Kandidat sudah menolak");
  if (existing) { existing.status = "invited"; existing.invitedAt = new Date(); existing.role = role; } // undangan kedaluwarsa → kirim ulang
  else p.members.push({ userId, role, status: "invited", invitedAt: new Date() });
  await p.save();
  await logActivity(me, "invite_sent", p._id, { to: target.name });
  return { ok: true };
});

/** Batalkan ajakan yang belum dijawab. */
export const DELETE = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const me = await requireUser();
  const { id } = await ctx.params;
  const userId = new URL(req.url).searchParams.get("userId") ?? "";
  const p = await Project.findById(id);
  if (!p || String(p.ownerId) !== me) throw new HttpError(403, "Hanya pemilik proyek");
  await Project.updateOne({ _id: oid(id) }, { $pull: { members: { userId: oid(userId), status: "invited" } } });
  return { ok: true };
});
