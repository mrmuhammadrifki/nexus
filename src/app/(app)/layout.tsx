import { redirect } from "next/navigation";
import { AppHeader, BottomNav, Stepper } from "@/components/app-nav";
import { getDash, getSession } from "@/lib/dash";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { id, user } = await getSession();
  if (!(user.campus && user.major && user.semester)) redirect("/onboarding"); // AU-2
  const d = await getDash(id, user);
  return (
    <div className="pb-20 md:pb-0">
      <AppHeader name={user.name ?? "Kamu"} major={user.major} invites={d.invites.length} />
      <Stepper steps={d.steps as any} />
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-8 md:pt-10 pb-16 flex flex-col gap-7">{children}</main>
      <BottomNav />
    </div>
  );
}
