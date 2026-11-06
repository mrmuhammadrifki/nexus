import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectDB } from "./db";
import { User } from "./models";
import { dashboard } from "./services";

export const getSession = cache(async () => {
  const s = await auth();
  if (!s?.user?.id) redirect("/masuk");
  await connectDB();
  const u = await User.findById(s.user.id).lean<any>();
  if (!u) redirect("/masuk"); // akun sudah dihapus
  return { id: s.user.id, user: u };
});
export const getDash = cache(async (id: string) => dashboard(id));
