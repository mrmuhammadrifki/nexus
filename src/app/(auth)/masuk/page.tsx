import { redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { auth, googleEnabled } from "@/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";
import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "Masuk" };

export default async function Page() {
  const s = await auth();
  const uid = s?.user?.id;
  if (uid && isValidObjectId(uid)) {
    await connectDB();
    const exists = await User.exists({ _id: uid });
    if (exists) redirect("/dashboard");
  }
  return <AuthForm mode="masuk" google={googleEnabled} />;
}
