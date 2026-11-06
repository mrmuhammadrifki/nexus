import { redirect } from "next/navigation";
import { auth, googleEnabled } from "@/auth";
import { AuthForm } from "@/components/auth-form";
export const metadata = { title: "Daftar" };
export default async function Page() {
  if ((await auth())?.user) redirect("/dashboard");
  return <AuthForm mode="daftar" google={googleEnabled} />;
}
