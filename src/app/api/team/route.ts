import { route, requireUser } from "@/lib/api";
import { teamView, pendingInvites } from "@/lib/services";
export const GET = route(async () => {
  const id = await requireUser();
  return { ...(await teamView(id)), invites: await pendingInvites(id) };
});
