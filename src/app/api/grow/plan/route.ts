import { route, requireUser } from "@/lib/api";
import { getPlan } from "@/lib/services";
export const GET = route(async () => getPlan(await requireUser()));
