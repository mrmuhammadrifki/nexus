import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppHeader, BottomNav, Stepper } from "@/components/app-nav";
import { getDash, getSession } from "@/lib/dash";

async function AppNav({ id, user }: { id: string; user: any }) {
  const d = await getDash(id, user);
  return (
    <>
      <AppHeader name={user.name ?? "Kamu"} major={user.major} invites={d.invites.length} />
      <Stepper steps={d.steps as any} />
    </>
  );
}

function AppNavSkeleton({ name, major }: { name?: string; major?: string }) {
  return (
    <AppHeader name={name ?? "Kamu"} major={major ?? ""} invites={0} />
  );
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { id, user } = await getSession();
  if (!(user.campus && user.major && user.semester)) redirect("/onboarding"); // AU-2

  return (
    <div className="pb-20 md:pb-0">
      <Suspense fallback={<AppNavSkeleton name={user.name} major={user.major} />}>
        <AppNav id={id} user={user} />
      </Suspense>
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-8 md:pt-10 pb-16 flex flex-col gap-7">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
