import { Logo } from "@/components/ui";
export const metadata = { title: "Offline" };
export default function Offline() {
  return (
    <main className="min-h-dvh grid place-items-center p-6 text-center">
      <div className="max-w-sm flex flex-col items-center gap-4">
        <Logo size={56} />
        <h1 className="text-2xl font-extrabold">Kamu lagi offline</h1>
        <p className="text-ink-2">NEXUS butuh internet buat nyimpen dan ngambil datamu. Sambungkan lagi, terus coba muat ulang.</p>
        <a href="/dashboard" className="btn-primary">Coba lagi</a>
      </div>
    </main>
  );
}
