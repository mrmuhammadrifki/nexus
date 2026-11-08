import { cache } from "react";
import { redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { auth } from "@/auth";
import { connectDB } from "./db";
import { User } from "./models";
import { dashboard } from "./services";

export const getSession = cache(async () => {
  const s = await auth();
  const uid = s?.user?.id;
  if (!uid || !isValidObjectId(uid)) redirect("/masuk");
  await connectDB();
  const u = await User.findById(uid).lean<any>();
  if (!u) redirect("/masuk"); // akun sudah dihapus
  return { id: uid, user: u };
});
export const getDash = cache(async (id: string, user?: any) => dashboard(id, user));
