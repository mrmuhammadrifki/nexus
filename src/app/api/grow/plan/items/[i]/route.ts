import { z } from "zod";
import { route, requireUser, HttpError } from "@/lib/api";
import { LearningPlan } from "@/lib/models";
import { oid, logActivity } from "@/lib/services";

export const PATCH = route(async (req: Request, ctx: { params: Promise<{ i: string }> }) => {
  const id = await requireUser();
  const i = Number((await ctx.params).i);
  const { done } = z.object({ done: z.boolean() }).parse(await req.json());
  const plan = await LearningPlan.findOne({ userId: oid(id) });
  if (!plan || !Number.isInteger(i) || i < 0 || i >= plan.items.length) throw new HttpError(404, "Item tidak ada");
  plan.items[i].done = done;
  await plan.save();
  if (done) await logActivity(id, "plan_done", undefined, { title: plan.items[i].title });
  return { ok: true };
});
