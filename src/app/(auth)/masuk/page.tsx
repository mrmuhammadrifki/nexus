import { redirect } from "next/navigation";
import { auth, googleEnabled } from "@/auth";
import { AuthForm } from "@/components/auth-form";
export const metadata = { title: "Masuk" };
export default async function Page() {
  if ((await auth())?.user) redirect("/dashboard");
  return <AuthForm mode="masuk" google={googleEnabled} />;
}
