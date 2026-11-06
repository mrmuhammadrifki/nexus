import crypto from "node:crypto";
import { z } from "zod";
import { route, requireUser, HttpError } from "@/lib/api";
import { AiFeedback, CANVAS_KEYS } from "@/lib/models";
import { assertMember, oid } from "@/lib/services";
import { aiFailureMessage, getFeedback, logAiError, modelName } from "@/lib/ai";

export const maxDuration = 30;
const RATE_PER_HOUR = 20;

export const POST = route(async (req: Request) => {
  const me = await requireUser();
  const { projectId, section } = z.object({ projectId: z.string().regex(/^[a-f\d]{24}$/i), section: z.enum(CANVAS_KEYS) }).parse(await req.json());
  const p = await assertMember(projectId, me);
  const idx = CANVAS_KEYS.indexOf(section);

  // Isi kanvas selalu dari DB, bukan dari klien. Hash mencakup bagian yang dirujuk (sebelumnya).
  const canvas = Object.fromEntries(CANVAS_KEYS.map((k) => [k, p.canvas?.[k] ?? ""]));
  const inputHash = crypto.createHash("sha256").update(JSON.stringify([section, CANVAS_KEYS.slice(0, idx + 1).map((k) => canvas[k]), modelName()])).digest("hex");

  const cached = await AiFeedback.findOne({ projectId: p._id, section, inputHash }).lean<any>();
  if (cached) return { good: cached.good, improve: cached.improve, rewrite: cached.rewrite, ideas: cached.ideas, cached: true };

  const used = await AiFeedback.countDocuments({ userId: oid(me), createdAt: { $gt: new Date(Date.now() - 3600_000) } });
  if (used >= RATE_PER_HOUR) throw new HttpError(429, "Batas 20 masukan per jam tercapai. Coba lagi nanti.");

  let res;
  try { res = await getFeedback(idx, canvas, req.signal); }
  catch (e) { logAiError("feedback", e); throw new HttpError(503, aiFailureMessage(e)); }

  const { model, ...fb } = res; // model = yang benar-benar menjawab (bisa model cadangan)
  await AiFeedback.create({ projectId: p._id, userId: oid(me), section, inputHash, ...fb, model });
  return { ...fb, cached: false };
});
