import { z } from "zod";
import { route, requireUser } from "@/lib/api";
import { CANVAS_KEYS, Project } from "@/lib/models";
import { assertMember, logActivity } from "@/lib/services";

export const GET = route(async (_r: Request, ctx: { params: Promise<{ id: string }> }) => {
  const me = await requireUser();
  const p = await assertMember((await ctx.params).id, me);
  return { title: p.title, tagline: p.tagline, canvas: p.canvas, updatedAt: p.updatedAt };
});

const patch = z.object({
  title: z.string().trim().min(1).max(80).optional(),
  tagline: z.string().trim().max(160).optional(),
  section: z.enum(CANVAS_KEYS).optional(),
  text: z.string().max(4000).optional(),
});

export const PATCH = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const me = await requireUser();
  const d = patch.parse(await req.json());
  const p = await assertMember((await ctx.params).id, me);
  const $set: any = {};
  if (d.title !== undefined) $set.title = d.title;
  if (d.tagline !== undefined) $set.tagline = d.tagline;
  if (d.section && d.text !== undefined) $set[`canvas.${d.section}`] = d.text;
  const wasEmpty = d.section ? !(p.canvas?.[d.section] ?? "").trim() : false;
  const u = await Project.findByIdAndUpdate(p._id, { $set }, { new: true });
  if (d.section && wasEmpty && d.text?.trim()) await logActivity(me, "canvas_saved", p._id, { section: d.section });
  return { ok: true, updatedAt: u.updatedAt };
});
