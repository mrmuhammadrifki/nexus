import { route, requireUser, HttpError } from "@/lib/api";
import { Assessment, CANVAS_KEYS } from "@/lib/models";
import { assertMember, canvasFilled, logActivity } from "@/lib/services";
import { INDICATORS } from "@/lib/catalog";
import { aiFailureMessage, getAssessment, logAiError } from "@/lib/ai";
import { weightedScore } from "@/lib/scoring";

export const maxDuration = 30;
const RATE_PER_DAY = 5;

export const GET = route(async (_r: Request, ctx: { params: Promise<{ id: string }> }) => {
  const me = await requireUser();
  const p = await assertMember((await ctx.params).id, me);
  const list = await Assessment.find({ projectId: p._id }).sort({ createdAt: -1 }).limit(20).lean<any[]>();
  return { weights: INDICATORS, filled: canvasFilled(p.canvas), history: list.map((a) => ({ id: String(a._id), score: a.score, level: a.level, createdAt: a.createdAt, model: a.model, weightsVersion: a.weightsVersion, indicators: a.indicators })) };
});

export const POST = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const me = await requireUser();
  const p = await assertMember((await ctx.params).id, me);
  if (canvasFilled(p.canvas) < 6) throw new HttpError(409, "Lengkapi dulu keenam bagian kanvas");

  const since = new Date(Date.now() - 24 * 3600_000);
  if ((await Assessment.countDocuments({ projectId: p._id, createdAt: { $gt: since } })) >= RATE_PER_DAY)
    throw new HttpError(429, "Batas 5 penilaian per proyek per hari tercapai");

  // Hanya isi kanvas + peran anggota yang dikirim ke AI — tanpa nama/email/kampus.
  const canvas = Object.fromEntries(CANVAS_KEYS.map((k) => [k, p.canvas[k]]));
  const accepted = p.members.filter((m: any) => m.status === "accepted");
  const roles = accepted.map((m: any) => m.role as string).filter(Boolean);

  let raw;
  try { raw = await getAssessment(canvas, roles, req.signal); }
  catch (e) { logAiError("assess", e); throw new HttpError(503, aiFailureMessage(e)); }

  // Skor akhir dihitung server dari bobot tetap, bukan oleh AI.
  const indicators = INDICATORS.map((i) => { const r = raw.indicators.find((x) => x.key === i.key)!; return { key: i.key, weight: i.weight, value: r.value, why: r.why, tip: r.tip }; });
  const { score, level, weightsVersion } = weightedScore(Object.fromEntries(indicators.map((i) => [i.key, i.value])));
  const a = await Assessment.create({ projectId: p._id, indicators, score, level, weightsVersion, model: raw.model });
  await logActivity(me, "assessed", p._id, { score });
  return { id: String(a._id), score, level, weightsVersion, indicators, model: raw.model, createdAt: a.createdAt };
});
