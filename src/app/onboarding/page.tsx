import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";
import { Logo } from "@/components/ui";
import { ProfileForm } from "@/components/profile-form";

export const metadata = { title: "Lengkapi profil" };
export default async function Page() {
  const s = await auth();
  if (!s?.user?.id) redirect("/masuk");
  await connectDB();
  const u = await User.findById(s.user.id).lean<any>();
  if (!u) redirect("/masuk");
  return (
    <main className="min-h-dvh grid place-items-center px-4 py-10">
      <div className="w-full max-w-md flex flex-col gap-6">
        <div className="flex items-center gap-2.5 self-center"><Logo size={34} /><span className="text-xl font-extrabold tracking-[0.06em]">NEXUS</span></div>
        <div className="card p-7 flex flex-col gap-5">
          <div>
            <h1 className="m-0 text-2xl font-extrabold tracking-tight">Hai {u.name?.split(" ")[0] ?? ""}, kenalan dulu yuk</h1>
            <p className="mt-1.5 mb-0 text-sm text-ink-2">Tiga isian ini dipakai biar rekomendasi partner lebih pas. Cuma sekali.</p>
          </div>
          <ProfileForm initial={{ campus: u.campus ?? "", major: u.major ?? "", semester: u.semester ?? null }} />
        </div>
      </div>
    </main>
  );
}
