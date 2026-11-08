import Link from "next/link";
import { auth } from "@/auth";
import { Icon, Logo, STEPS } from "@/components/ui";
import { Reveal, ScrollProgress, Tilt } from "@/components/motion";

const STEP_COPY = [
  { title: "Kenalan sama dirimu", text: "Petain minat, skill, target, dan gaya kerjamu.", out: "Profil Potensi" },
  { title: "Tau harus belajar apa", text: "Lihat skill yang masih kurang, lengkap sama urutan belajarnya.", out: "Prioritas Belajar" },
  { title: "Temuin partner tim", text: "Ketemu orang yang jago di bagian yang belum kamu kuasai.", out: "Tim Lintas Skill" },
  { title: "Rancang solusimu", text: "Ubah masalah nyata jadi ide yang rapi, dibantu masukan AI Coach.", out: "Kanvas Proyek" },
  { title: "Cek kesiapan proyek", text: "AI baca proyekmu, terus nunjukin bagian yang udah oke dan yang perlu di-upgrade.", out: "Skor Kesiapan" },
];
const PROBLEMS: [number, string][] = [
  [0, "Sebenernya aku jago di bidang apa, sih?"], [1, "Skill apa yang harus aku kejar duluan?"], [2, "Cari partner tim yang skill-nya beda di mana, ya?"],
  [3, "Masalah apa yang worth buat diberesin?"], [3, "Gimana caranya ide ini jadi solusi beneran?"], [4, "Ideku ngefek gak, sih, buat orang lain?"],
];
const FLOW = [
  { tag: "KNOW", c: "text-[#93C5FD] bg-know/15", t: <>Kekuatan: <b>Analisis Data</b> · Target: Product Analyst</>, link: "jadi patokan target skill" },
  { tag: "GROW", c: "text-[#86EFAC] bg-grow/15", t: <>Celah terbesar: <b>UI/UX</b> dan <b>Public Speaking</b></>, link: "dicariin partner yang jago di situ" },
  { tag: "CONNECT", c: "text-[#5EEAD4] bg-connect/15", t: <>Rekomendasi partner: <b>desainer UI</b> &amp; <b>mahasiswa bisnis</b></>, link: "tim kebentuk, peran langsung keisi" },
  { tag: "CREATE → IMPACT", c: "text-[#C4B5FD] bg-create/20", t: <>AI Coach baca kanvasmu dan nilai <b>5 indikator</b> kesiapan dampak</>, link: "" },
];
const TRUST = [
  { i: "eye", t: "Bisa dicek alasannya", d: "Tiap rekomendasi dan skor ada penjelasan “Kenapa hasil ini?”, jadi kamu tau aturan di baliknya." },
  { i: "lock", t: "Data kamu, kendali kamu", d: "Kamu sendiri yang milih apakah profilmu keliatan ke calon partner. Defaultnya privat." },
  { i: "bolt", t: "Ringan & sat-set", d: "Langsung jalan di browser, bisa dipasang di HP, enak dibuka dari mana aja." },
  { i: "spark", t: "AI Coach yang jujur", d: "AI kasih masukan buat tulisan proyekmu dan bantu nilai kesiapannya. Skornya tetap pakai rumus yang bisa kamu cek, keputusan akhir di kamu." },
];

/** Pecah teks jadi kata-kata yang muncul bergantian (CSS-only, tanpa JS). */
function Words({ parts }: { parts: { t: string; c?: string }[] }) {
  let i = 0;
  return <>{parts.flatMap((p, pi) => p.t.split(" ").filter(Boolean).map((w) => (
    <span key={`${pi}-${i}`} className={`word ${p.c ?? ""}`} style={{ "--i": i++ } as React.CSSProperties}>{w}&nbsp;</span>
  )))}</>;
}
const Check = ({ d }: { d: number }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" role="img" aria-label="Selesai">
    <circle className="pop" style={{ "--d": `${d}ms` } as React.CSSProperties} cx="12" cy="12" r="11" fill="#15803D" />
    <path className="draw" pathLength={1} style={{ "--d": `${d + 180}ms` } as React.CSSProperties} d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default async function Landing() {
  const authed = !!(await auth())?.user;
  const cta = authed ? "/dashboard" : "/daftar";
  return (
    <div className="overflow-x-clip">
      <ScrollProgress />
      <header className="sticky top-0 z-20 bg-bg/90 backdrop-blur border-b border-line">
        <div className="max-w-[1200px] mx-auto px-6 min-h-[72px] flex items-center justify-between gap-4 flex-wrap">
          <Link href="/" className="flex items-center gap-2.5" aria-label="NEXUS beranda"><Logo size={32} animated /><span className="text-xl font-extrabold tracking-[0.06em]">NEXUS</span></Link>
          <nav aria-label="Navigasi utama" className="hidden md:flex gap-1 text-[15px] font-medium text-ink-2">
            {[["#cara-kerja", "Cara kerja"], ["#alur", "Kenapa NEXUS"], ["#transparan", "Transparansi"]].map(([h, l]) => <a key={h} href={h} className="px-3.5 py-2.5">{l}</a>)}
          </nav>
          <div className="flex items-center gap-2">
            {!authed && <Link href="/masuk" prefetch={true} className="px-4 py-2.5 text-[15px] font-semibold">Masuk</Link>}
            <Link href={cta} prefetch={true} className="btn-primary h-11">{authed ? "Buka dashboard" : "Coba gratis"}</Link>
          </div>
        </div>
      </header>

      <div className="relative">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
          <div className="blob absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-know/20 blur-[90px]" />
          <div className="blob absolute top-10 right-[-80px] w-[460px] h-[460px] rounded-full bg-create/20 blur-[100px]" style={{ animationDelay: "-5s" }} />
          <div className="blob absolute bottom-[-120px] left-1/3 w-[380px] h-[380px] rounded-full bg-connect/15 blur-[90px]" style={{ animationDelay: "-9s" }} />
        </div>
      <section className="relative max-w-[1200px] mx-auto px-6 pt-14 md:pt-[88px] pb-16 md:pb-24 flex flex-wrap items-center gap-12 md:gap-16">
        <div className="flex-[1_1_480px] min-w-0 flex flex-col gap-7">
          <span className="fade-up self-start inline-flex items-center gap-2 py-1.5 pl-1.5 pr-3.5 rounded-full bg-white border border-line text-[13px] font-semibold text-ink-2">
            <span className="px-2.5 py-0.5 rounded-full bg-primary-tint text-primary">Baru</span>Sekarang ditemenin AI Coach
          </span>
          <h1 className="m-0 text-[40px] sm:text-5xl lg:text-[64px] leading-[1.05] font-extrabold tracking-[-0.035em]">
            <span className="sr-only">Dari “aku bisa apa, ya?” jadi proyek yang beneran berdampak.</span>
            <span aria-hidden="true"><Words parts={[{ t: "Dari “aku bisa apa, ya?” jadi proyek yang" }, { t: "beneran berdampak.", c: "text-primary" }]} /></span>
          </h1>
          <p className="fade-up m-0 text-lg leading-relaxed text-ink-2 max-w-[540px]" style={{ "--d": "700ms" } as React.CSSProperties}>NEXUS nemenin kamu step by step: kenali kekuatanmu, upgrade skill yang masih kurang, cari partner tim yang klop, rancang solusi, sampai cek proyekmu udah siap atau belum. Semua di satu tempat, plus AI Coach yang bantu ngasah ide dan ngecek proyekmu.</p>
          <div className="fade-up flex flex-wrap gap-3" style={{ "--d": "850ms" } as React.CSSProperties}>
            <Link href={cta} prefetch={true} className="btn-primary shine arrow-nudge h-[54px] px-6 text-base rounded-[14px]">Gas, mulai sekarang <Icon name="arrow" size={18} sw={2.2} /></Link>
            <a href="#cara-kerja" className="btn-secondary h-[54px] px-6 text-base rounded-[14px]">Cek cara kerjanya</a>
          </div>
          <ul className="fade-up m-0 p-0 list-none flex flex-wrap gap-5 text-sm text-ink-2 font-medium">
            {["100% gratis", "Semua hasil ada alasannya", "Bisa dipasang di HP"].map((t) => <li key={t} className="inline-flex items-center gap-1.5"><Icon name="check" size={16} sw={2.4} className="text-grow-fg" />{t}</li>)}
          </ul>
        </div>
        <div className="slide-in flex-[1_1_420px] min-w-0 py-6 relative" style={{ "--d": "500ms" } as React.CSSProperties}>
          <Tilt>
          <div className="tilt-glare relative bg-white border border-line rounded-3xl p-7 shadow-[0_24px_60px_-24px_rgba(11,21,48,0.18)]">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div><div className="text-base font-bold">Contoh perjalanan</div><div className="text-[13px] text-ink-3">Mahasiswa Informatika</div></div>
              <span className="text-[13px] font-bold text-primary bg-primary-tint px-3 py-1.5 rounded-full">3 dari 5 selesai</span>
            </div>
            <div className="flex flex-col gap-1">
              {STEPS.map((s, i) => (
                <div key={s.key} className={`fade-up flex gap-4 items-start p-3 rounded-2xl ${i === 3 ? "bg-[#F5F1FF] border border-[#E3D8FF]" : ""}`} style={{ "--d": `${900 + i * 260}ms` } as React.CSSProperties}>
                  <div className={`w-10 h-10 flex-none rounded-xl grid place-items-center ${s.tint} ${s.fg} ${i === 3 ? "pulse-ring" : ""}`}><Icon name={s.icon} /></div>
                  <div className="flex-1 min-w-0">
                    <div className={`label-caps ${s.fg}`}>{s.key}{i === 3 ? " · LAGI JALAN" : ""}</div>
                    <div className={`text-[15px] font-semibold mt-0.5 ${i === 4 ? "text-ink-3" : ""}`}>{STEP_COPY[i].title}</div>
                    {i === 3 && <div className="mt-2.5 h-1.5 rounded-full bg-[#E3D8FF]"><div className="fill h-1.5 rounded-full bg-[#7C3AED]" style={{ width: "60%", "--d": "1900ms" } as React.CSSProperties} /></div>}
                  </div>
                  {i < 3 && <Check d={1100 + i * 260} />}
                </div>
              ))}
            </div>
          </div>
          </Tilt>
          <div className="float absolute -right-2 -bottom-1 hidden sm:block">
            <div className="fade-up bg-ink text-white rounded-2xl px-[18px] py-3.5 flex items-center gap-3 shadow-[0_16px_40px_-16px_rgba(11,21,48,0.5)]" style={{ "--d": "2200ms" } as React.CSSProperties}>
              <Icon name="arrow" className="text-[#7DD3C7]" />
              <div><div className="text-[13px] font-bold">Hasil tiap step nyambung otomatis</div><div className="text-xs text-[#B8C2DE]">ke step berikutnya</div></div>
            </div>
          </div>
        </div>
      </section>
      </div>

      <section className="bg-white border-y border-line">
        <div className="max-w-[1200px] mx-auto px-6 py-16 md:py-24 flex flex-col gap-12">
          <Reveal className="flex flex-col gap-3.5 max-w-[680px]">
            <span className="label-caps text-primary tracking-[0.1em] text-[13px]">RELATE GAK?</span>
            <h2 className="m-0 text-3xl md:text-[40px] leading-[1.15] font-extrabold tracking-[-0.025em]">Pertanyaan yang suka muter di kepala pas mau mulai</h2>
            <p className="m-0 text-[17px] leading-relaxed text-ink-2">Jawabannya biasanya kepencar di tes minat, kursus, grup komunitas, sampai info lomba. Di NEXUS, semuanya kejawab berurutan di satu tempat.</p>
          </Reveal>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
            {PROBLEMS.map(([i, q], n) => (
              <Reveal key={q} delay={n * 90} className="lift p-6 rounded-[18px] bg-bg border border-line flex flex-col gap-3.5">
                <span className={`self-start label-caps px-2.5 py-1 rounded-lg ${STEPS[i].tint} ${STEPS[i].fg}`}>{STEPS[i].key}</span>
                <p className="m-0 text-lg font-semibold leading-snug">“{q}”</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="cara-kerja" className="max-w-[1200px] mx-auto px-6 py-20 md:py-28 flex flex-col gap-14 scroll-mt-20">
        <Reveal className="flex flex-col gap-3.5 items-center text-center">
          <span className="label-caps text-primary tracking-[0.1em] text-[13px]">CARA KERJA</span>
          <h2 className="m-0 text-3xl md:text-[40px] font-extrabold tracking-[-0.025em]">5 step, satu perjalanan</h2>
          <p className="m-0 text-[17px] leading-relaxed text-ink-2 max-w-[620px]">Tiap step ngasih hasil yang langsung kepake di step berikutnya. Gak ada cerita isi ulang dari nol.</p>
        </Reveal>
        <Reveal className="hidden lg:block -mb-8"><div className="h-1 rounded-full bg-line overflow-hidden"><div className="line-grow h-full rounded-full bg-gradient-to-r from-know via-grow via-connect via-create to-impact" /></div></Reveal>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.key} delay={i * 110} className="lift bg-white border border-line rounded-[20px] p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center"><div className={`lift-icon w-12 h-12 rounded-[14px] grid place-items-center ${s.tint} ${s.fg}`}><Icon name={s.icon} size={24} /></div><span className="text-sm font-bold text-[#5F6985]">{s.n}</span></div>
              <div><div className={`label-caps ${s.fg}`}>{s.key}</div><h3 className="mt-1 mb-0 text-[19px] font-bold">{STEP_COPY[i].title}</h3></div>
              <p className="m-0 text-[15px] leading-relaxed text-ink-2">{STEP_COPY[i].text}</p>
              <div className="mt-auto pt-3.5 border-t border-dashed border-line text-[13px] text-ink-3">Hasil: <strong className="text-ink">{STEP_COPY[i].out}</strong></div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="alur" className="bg-ink text-white scroll-mt-20">
        <div className="max-w-[1200px] mx-auto px-6 py-20 md:py-28 flex flex-wrap gap-16 items-center">
          <Reveal className="flex-[1_1_400px] min-w-0 flex flex-col gap-5">
            <span className="label-caps text-[#8FA8FF] tracking-[0.1em] text-[13px]">KENAPA NEXUS</span>
            <h2 className="m-0 text-3xl md:text-[40px] leading-[1.15] font-extrabold tracking-[-0.025em]">Bukan 5 aplikasi terpisah. Satu alur yang nyambung.</h2>
            <p className="m-0 text-[17px] leading-[1.65] text-[#B8C2DE]">Biasanya kamu loncat dari tes minat ke kursus, terus ke grup komunitas, dan cerita ulang hal yang sama di tiap tempat. Capek, kan? Di NEXUS, apa yang kamu temuin di satu step langsung jadi bahan step berikutnya.</p>
          </Reveal>
          <div className="flex-[1_1_480px] min-w-0 flex flex-col gap-3">
            {FLOW.map((f, n) => (
              <Reveal key={f.tag} delay={n * 170}>
                <div className="bg-[#142046] border border-[#24315C] rounded-[18px] px-[22px] py-5 flex flex-wrap items-center gap-3.5 transition-colors hover:border-[#4560c8]">
                  <span className={`label-caps px-2.5 py-1.5 rounded-lg ${f.c}`}>{f.tag}</span><span className="text-[15px] text-[#E6EAF5] flex-1 basis-[200px]">{f.t}</span>
                </div>
                {f.link && <div className="pl-[34px] pt-3 flex items-center gap-2.5 text-[13px] text-[#8FA0CC]"><span className="relative w-4 h-5 overflow-hidden"><Icon name="arrow" size={16} className="rotate-90 flowdot" /></span>{f.link}</div>}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="transparan" className="max-w-[1200px] mx-auto px-6 py-20 md:py-28 flex flex-col gap-12 scroll-mt-20">
        <Reveal className="flex flex-col gap-3.5 max-w-[680px]">
          <span className="label-caps text-primary tracking-[0.1em] text-[13px]">NO TEBAK-TEBAKAN</span>
          <h2 className="m-0 text-3xl md:text-[40px] leading-[1.15] font-extrabold tracking-[-0.025em]">Kamu selalu tau kenapa sebuah saran muncul</h2>
        </Reveal>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5">
          {TRUST.map((t, i) => (
            <Reveal key={t.t} delay={i * 100} className="lift bg-white border border-line rounded-[20px] p-7 flex flex-col gap-3.5">
              <div className={`lift-icon w-12 h-12 rounded-[14px] grid place-items-center ${i === 3 ? "bg-primary text-white" : "bg-primary-tint text-primary"}`}><Icon name={t.i} size={24} /></div>
              <h3 className="m-0 text-xl font-bold">{t.t}</h3><p className="m-0 text-[15px] leading-relaxed text-ink-2">{t.d}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="max-w-[1200px] mx-auto px-6 pb-28">
        <Reveal className="cta-bg bg-primary rounded-[28px] px-8 md:px-12 py-16 md:py-[72px] flex flex-col items-center text-center gap-5 text-white">
          <h2 className="m-0 text-3xl md:text-[44px] leading-[1.1] font-extrabold tracking-[-0.03em] max-w-[720px]">Jangan cuma siap hadapi masa depan. Yuk, ikut bentuk juga!</h2>
          <p className="m-0 text-lg text-[#DCE4FF] max-w-[560px]">Mulai dari step pertama: kenalan sama potensimu.</p>
          <Link href={cta} prefetch={true} className="btn shine arrow-nudge h-14 px-7 rounded-[14px] bg-white text-primary-dark text-base hover:scale-[1.03] transition-transform">Gas, mulai sekarang <Icon name="arrow" size={18} sw={2.2} /></Link>
        </Reveal>
      </section>

      <footer className="border-t border-line bg-white">
        <div className="max-w-[1200px] mx-auto px-6 py-8 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-2.5"><Logo size={26} /><span className="font-extrabold tracking-[0.06em]">NEXUS</span><span className="text-sm text-ink-3 ml-2">From Future-Ready to Impact-Ready</span></div>
          <span className="text-sm text-ink-3">Team ARUNA · STMIK Widya Utama · PIMNAS 6 2026</span>
        </div>
      </footer>
    </div>
  );
}
