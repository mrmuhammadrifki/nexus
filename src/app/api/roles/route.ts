import { route, requireUser, HttpError } from "@/lib/api";
import { getProfile, roleOptions } from "@/lib/services";

/** Semua peran target beserta kecocokannya dengan profil pengguna (untuk halaman "Semua peran"). */
export const GET = route(async () => {
  const p = await getProfile(await requireUser());
  if (!p?.knowDone) throw new HttpError(409, "Selesaikan KNOW dulu");
  return { current: p.targetRole ?? null, roles: await roleOptions(p, 999) };
});
