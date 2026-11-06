import { z } from "zod";
import { route, requireUser, HttpError } from "@/lib/api";
import { Project } from "@/lib/models";
import { MAX_TEAM, isExpired, logActivity } from "@/lib/services";

/** `id` = id proyek yang mengundang. */
export const POST = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const me = await requireUser();
  const { id } = await ctx.params;
  const { accept } = z.object({ accept: z.boolean() }).parse(await req.json());
  const p = await Project.findById(id);
  const m = p?.members.find((x: any) => String(x.userId) === me && x.status === "invited");
  if (!p || !m) throw new HttpError(404, "Undangan tidak ditemukan");
  if (isExpired(m)) throw new HttpError(410, "Undangan sudah kedaluwarsa");
  if (accept) {
    if (p.members.filter((x: any) => x.status === "accepted").length >= MAX_TEAM) throw new HttpError(409, "Tim sudah penuh");
    // MVP: satu tim per pengguna.
    const other = await Project.findOne({ _id: { $ne: p._id }, members: { $elemMatch: { userId: me, status: "accepted" } }, ownerId: { $ne: me } });
    if (other) throw new HttpError(409, "Kamu sudah tergabung di tim lain");
  }
  m.status = accept ? "accepted" : "declined";
  await p.save();
  await logActivity(me, accept ? "invite_accepted" : "invite_declined", p._id);
  return { ok: true };
});
