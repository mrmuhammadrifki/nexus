import { route, requireUser } from "@/lib/api";
import { dashboard } from "@/lib/services";
export const GET = route(async () => dashboard(await requireUser()));
