import { route, requireUser } from "@/lib/api";
import { candidates } from "@/lib/services";
export const GET = route(async (req: Request) => candidates(await requireUser(), new URL(req.url).searchParams.get("role") ?? undefined));
