import Link from "next/link";
import { Logo } from "@/components/ui";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh grid place-items-center px-4 py-10">
      <div className="w-full max-w-md flex flex-col gap-6">
        <Link href="/" className="flex items-center gap-2.5 self-center" aria-label="NEXUS beranda">
          <Logo size={34} /><span className="text-xl font-extrabold tracking-[0.06em]">NEXUS</span>
        </Link>
        <div className="card p-7 flex flex-col gap-5">{children}</div>
      </div>
    </main>
  );
}
