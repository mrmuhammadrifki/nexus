/** Data referensi: kosakata minat/skill, peran target, katalog belajar. Diisi tim (lihat "Pertanyaan terbuka" di PRD). */

/**
 * Katalog kurasi. Tiap bidang berisi skill yang relevan, DIURUTKAN dari yang paling populer.
 * Pengguna tidak mengetik sendiri; yang ditampilkan di KNOW hanya skill populer untuk bidang yang dipilih,
 * sisanya ada di halaman "Semua skill" (dengan pencarian & filter bidang).
 * Nama skill harus sama persis dengan yang dipakai di ROLE_SEEDS.
 */
export const FIELDS: { name: string; skills: string[] }[] = [
  { name: "Teknologi", skills: ["Python", "UI/UX", "Frontend", "SQL", "Analisis Data", "Backend", "JavaScript", "Mobile (Flutter/Android)", "Machine Learning", "Keamanan Siber", "Jaringan Komputer", "IoT & Elektronik", "Manajemen Proyek", "Java"] },
  { name: "Pendidikan", skills: ["Mengajar", "Public Speaking", "Menulis", "Riset", "Desain Grafis", "Video Editing", "Manajemen Proyek", "Kepemimpinan", "Penulisan Ilmiah", "Statistika", "Kerja Tim"] },
  { name: "Lingkungan", skills: ["Riset", "Analisis Data", "Manajemen Proyek", "Public Speaking", "Model Bisnis", "Statistika", "Penulisan Ilmiah", "Desain Grafis", "Fotografi", "Kerja Tim"] },
  { name: "Kesehatan", skills: ["Riset", "Analisis Data", "Statistika", "Penulisan Ilmiah", "Public Speaking", "Menulis", "Manajemen Proyek", "Kerja Tim", "Desain Grafis"] },
  { name: "Ekonomi Kreatif", skills: ["Desain Grafis", "UI/UX", "Video Editing", "Fotografi", "Social Media", "Copywriting", "Model Bisnis", "Pemasaran Digital", "Menulis", "Public Speaking"] },
  { name: "Sosial", skills: ["Public Speaking", "Riset", "Menulis", "Manajemen Proyek", "Kepemimpinan", "Kerja Tim", "Negosiasi", "Social Media", "Analisis Data"] },
  { name: "Pertanian", skills: ["Riset", "Analisis Data", "Model Bisnis", "Manajemen Proyek", "IoT & Elektronik", "Statistika", "Public Speaking", "Pemasaran Digital", "Fotografi"] },
  { name: "Kewirausahaan", skills: ["Model Bisnis", "Pemasaran Digital", "Public Speaking", "Negosiasi", "Akuntansi", "Manajemen Proyek", "Social Media", "Copywriting", "Kepemimpinan", "Excel"] },
  { name: "Keuangan & Fintech", skills: ["Akuntansi", "Excel", "Analisis Data", "SQL", "Model Bisnis", "Statistika", "Python", "Keamanan Siber", "Backend"] },
  { name: "Pariwisata & Budaya", skills: ["Fotografi", "Video Editing", "Social Media", "Copywriting", "Desain Grafis", "Penerjemahan", "Public Speaking", "Pemasaran Digital", "Menulis", "Model Bisnis"] },
  { name: "Hukum & Kebijakan", skills: ["Riset", "Menulis", "Penulisan Ilmiah", "Public Speaking", "Negosiasi", "Analisis Data", "Kepemimpinan", "Penerjemahan"] },
  { name: "Energi & Kebencanaan", skills: ["IoT & Elektronik", "Analisis Data", "Riset", "Manajemen Proyek", "Python", "Statistika", "Jaringan Komputer", "Public Speaking"] },
];

export const INTERESTS = FIELDS.map((f) => f.name);

/** Semua skill, diurutkan dari yang muncul di paling banyak bidang, lalu abjad. */
export const SKILLS = (() => {
  const n = new Map<string, number>();
  FIELDS.forEach((f) => f.skills.forEach((s) => n.set(s, (n.get(s) ?? 0) + 1)));
  return [...n.keys()].sort((a, b) => n.get(b)! - n.get(a)! || a.localeCompare(b));
})();

/** Label level (bahasa sehari-hari) agar penilaian diri tidak asal angka. */
export const LEVELS = [
  { n: 1, label: "Baru kenal", hint: "Pernah dengar / baru mulai belajar" },
  { n: 2, label: "Pernah coba", hint: "Sudah pernah praktik, masih sering bingung" },
  { n: 3, label: "Cukup bisa", hint: "Bisa mengerjakan tugas biasa sendiri" },
  { n: 4, label: "Mahir", hint: "Terbiasa, bisa menangani kasus yang rumit" },
  { n: 5, label: "Bisa ajarin orang", hint: "Sangat menguasai, bisa membimbing orang lain" },
] as const;
export const levelLabel = (n?: number | null) => LEVELS.find((l) => l.n === n)?.label ?? "Belum dinilai";

export const MAX_INTERESTS = 12;
export const MAX_SKILLS = 20;
export const POPULAR_COUNT = 12;

/** Bidang tempat sebuah skill muncul. */
export const fieldsOfSkill = (skill: string) => FIELDS.filter((f) => f.skills.includes(skill)).map((f) => f.name);

/**
 * Skill populer yang relevan dengan bidang terpilih: skor = Σ (panjang daftar − posisi) di tiap bidang terpilih.
 * Tanpa bidang terpilih → populer secara umum.
 */
export function popularSkillsFor(fields: string[], limit = POPULAR_COUNT): string[] {
  const chosen = FIELDS.filter((f) => fields.includes(f.name));
  if (!chosen.length) return SKILLS.slice(0, limit);
  const score = new Map<string, number>();
  chosen.forEach((f) => f.skills.forEach((s, i) => score.set(s, (score.get(s) ?? 0) + (f.skills.length - i))));
  return [...score.keys()].sort((a, b) => score.get(b)! - score.get(a)! || SKILLS.indexOf(a) - SKILLS.indexOf(b)).slice(0, limit);
}

/** Buang yang di luar katalog (data lama / input yang dimanipulasi), samakan huruf, tanpa duplikat, batasi jumlah. */
export function onlyKnown(raw: string[], vocab: readonly string[], max: number): string[] {
  const canon = new Map(vocab.map((v) => [v.toLowerCase(), v]));
  const out = new Set<string>();
  for (const r of raw) { const c = canon.get(String(r).trim().toLowerCase()); if (c) out.add(c); if (out.size >= max) break; }
  return [...out];
}

export const GOALS = [
  { id: "lomba", title: "Ikut lomba inovasi", desc: "PKM, hackathon, atau kompetisi ide" },
  { id: "magang", title: "Dapet magang", desc: "Ngerasain dunia kerja di industri" },
  { id: "proyek", title: "Bangun proyek sosial", desc: "Solusi buat masalah di sekitarmu" },
  { id: "riset", title: "Riset & publikasi", desc: "Penelitian bareng dosen" },
  { id: "beasiswa", title: "Dapet beasiswa", desc: "Beasiswa prestasi, S2, atau program luar negeri" },
  { id: "startup", title: "Rintis startup / usaha", desc: "Bikin produk atau bisnis sendiri" },
  { id: "freelance", title: "Mulai freelance", desc: "Dapet klien dan penghasilan pertama" },
  { id: "organisasi", title: "Aktif di organisasi", desc: "Pimpin kepanitiaan, UKM, atau komunitas" },
];
export const MAX_GOALS = 3;

export const WORK_STYLES = [
  { id: "analitis", title: "Si pemikir analitis", desc: "Suka ngulik data dan nyari pola", label: "Si analis pemecah masalah" },
  { id: "kreator", title: "Si kreator ide", desc: "Jago munculin ide-ide baru", label: "Si kreator banyak ide" },
  { id: "eksekutor", title: "Si eksekutor", desc: "Mastiin kerjaan beres tepat waktu", label: "Si eksekutor andalan" },
  { id: "penghubung", title: "Si penghubung", desc: "Jembatan antar orang dan ide", label: "Si penghubung yang supel" },
];

type RoleSeed = { slug: string; name: string; tags: string[]; requiredSkills: { name: string; level: number; weight: number }[] };
const r = (name: string, level: number, weight: number) => ({ name, level, weight });

/** 8 peran awal. Level & bobot (1 pelengkap … 3 inti) hanya titik mulai — perlu divalidasi bersama dosen. */
export const ROLE_SEEDS: RoleSeed[] = [
  { slug: "product-data-analyst", name: "Product Data Analyst", tags: ["Teknologi", "Ekonomi Kreatif"],
    requiredSkills: [r("Analisis Data", 4, 3), r("SQL", 4, 3), r("Python", 4, 2), r("UI/UX", 4, 2), r("Public Speaking", 4, 2), r("Manajemen Proyek", 4, 1)] },
  { slug: "ui-ux-designer", name: "UI/UX Designer", tags: ["Teknologi", "Ekonomi Kreatif"],
    requiredSkills: [r("UI/UX", 4, 3), r("Desain Grafis", 4, 2), r("Riset", 3, 2), r("Frontend", 3, 1), r("Public Speaking", 3, 1)] },
  { slug: "frontend-developer", name: "Frontend Developer", tags: ["Teknologi"],
    requiredSkills: [r("Frontend", 4, 3), r("UI/UX", 3, 2), r("Python", 3, 1), r("Manajemen Proyek", 3, 1)] },
  { slug: "project-manager", name: "Project Manager", tags: ["Sosial", "Pendidikan"],
    requiredSkills: [r("Manajemen Proyek", 4, 3), r("Public Speaking", 4, 2), r("Model Bisnis", 3, 2), r("Menulis", 3, 1)] },
  { slug: "business-analyst", name: "Business Analyst", tags: ["Ekonomi Kreatif", "Sosial"],
    requiredSkills: [r("Model Bisnis", 4, 3), r("Analisis Data", 3, 2), r("Riset", 4, 2), r("Public Speaking", 4, 2)] },
  { slug: "social-researcher", name: "Peneliti Sosial", tags: ["Sosial", "Pendidikan", "Kesehatan"],
    requiredSkills: [r("Riset", 4, 3), r("Menulis", 4, 3), r("Analisis Data", 3, 2), r("Public Speaking", 3, 1)] },
  { slug: "sustainability-innovator", name: "Inovator Keberlanjutan", tags: ["Lingkungan", "Pertanian"],
    requiredSkills: [r("Riset", 4, 3), r("Model Bisnis", 3, 2), r("Manajemen Proyek", 3, 2), r("Public Speaking", 3, 1), r("Analisis Data", 3, 1)] },
  { slug: "content-communicator", name: "Content & Communication Lead", tags: ["Ekonomi Kreatif", "Pendidikan"],
    requiredSkills: [r("Menulis", 4, 3), r("Desain Grafis", 3, 2), r("Public Speaking", 4, 3), r("Model Bisnis", 2, 1)] },
  // — Ditambah agar setiap bidang punya peran yang cocok. Level & bobot = titik awal, validasi bersama dosen. —
  { slug: "backend-developer", name: "Backend Developer", tags: ["Teknologi", "Keuangan & Fintech"],
    requiredSkills: [r("Backend", 4, 3), r("SQL", 4, 2), r("JavaScript", 4, 2), r("Java", 3, 1), r("Keamanan Siber", 3, 1)] },
  { slug: "mobile-developer", name: "Mobile Developer", tags: ["Teknologi"],
    requiredSkills: [r("Mobile (Flutter/Android)", 4, 3), r("UI/UX", 3, 2), r("Backend", 3, 1), r("Java", 3, 1)] },
  { slug: "ml-engineer", name: "Machine Learning Engineer", tags: ["Teknologi", "Kesehatan"],
    requiredSkills: [r("Machine Learning", 4, 3), r("Python", 4, 3), r("Statistika", 3, 2), r("SQL", 3, 1)] },
  { slug: "security-analyst", name: "Analis Keamanan Siber", tags: ["Teknologi", "Keuangan & Fintech"],
    requiredSkills: [r("Keamanan Siber", 4, 3), r("Jaringan Komputer", 4, 2), r("Python", 3, 1)] },
  { slug: "health-researcher", name: "Peneliti Kesehatan Masyarakat", tags: ["Kesehatan"],
    requiredSkills: [r("Riset", 4, 3), r("Statistika", 4, 3), r("Penulisan Ilmiah", 3, 2), r("Analisis Data", 3, 2), r("Public Speaking", 3, 1)] },
  { slug: "fintech-analyst", name: "Fintech Analyst", tags: ["Keuangan & Fintech"],
    requiredSkills: [r("Akuntansi", 4, 3), r("Excel", 4, 2), r("Analisis Data", 4, 2), r("SQL", 3, 2), r("Model Bisnis", 3, 1)] },
  { slug: "policy-analyst", name: "Analis Kebijakan Publik", tags: ["Hukum & Kebijakan", "Sosial"],
    requiredSkills: [r("Riset", 4, 3), r("Penulisan Ilmiah", 4, 2), r("Negosiasi", 3, 2), r("Public Speaking", 4, 2), r("Analisis Data", 3, 1)] },
  { slug: "tourism-creator", name: "Kreator Konten Pariwisata & Budaya", tags: ["Pariwisata & Budaya", "Ekonomi Kreatif"],
    requiredSkills: [r("Fotografi", 4, 3), r("Video Editing", 4, 3), r("Copywriting", 3, 2), r("Social Media", 4, 2), r("Penerjemahan", 3, 1)] },
  { slug: "energy-innovator", name: "Inovator Energi & Mitigasi Bencana", tags: ["Energi & Kebencanaan", "Lingkungan"],
    requiredSkills: [r("IoT & Elektronik", 4, 3), r("Analisis Data", 3, 2), r("Python", 3, 2), r("Manajemen Proyek", 3, 1), r("Statistika", 3, 1)] },
  { slug: "young-entrepreneur", name: "Wirausahawan Muda", tags: ["Kewirausahaan", "Ekonomi Kreatif"],
    requiredSkills: [r("Model Bisnis", 4, 3), r("Pemasaran Digital", 4, 2), r("Negosiasi", 3, 2), r("Akuntansi", 3, 2), r("Public Speaking", 4, 2), r("Kepemimpinan", 3, 1)] },
  { slug: "agritech-innovator", name: "Inovator Agritech", tags: ["Pertanian"],
    requiredSkills: [r("Riset", 4, 3), r("IoT & Elektronik", 3, 2), r("Analisis Data", 3, 2), r("Model Bisnis", 3, 2), r("Manajemen Proyek", 3, 1)] },
  { slug: "edu-developer", name: "Pengembang Pembelajaran", tags: ["Pendidikan"],
    requiredSkills: [r("Mengajar", 4, 3), r("Menulis", 3, 2), r("Desain Grafis", 3, 2), r("Public Speaking", 4, 2), r("Video Editing", 3, 1)] },
  { slug: "digital-marketer", name: "Digital Marketer", tags: ["Ekonomi Kreatif", "Kewirausahaan"],
    requiredSkills: [r("Pemasaran Digital", 4, 3), r("Social Media", 4, 2), r("Copywriting", 4, 2), r("Desain Grafis", 3, 1), r("Analisis Data", 3, 1)] },
  { slug: "community-organizer", name: "Penggerak Komunitas", tags: ["Sosial"],
    requiredSkills: [r("Kepemimpinan", 4, 3), r("Kerja Tim", 4, 2), r("Public Speaking", 4, 2), r("Social Media", 3, 1), r("Manajemen Proyek", 3, 1)] },
];

/** Dua butir belajar per skill; dipilih berdasarkan kekurangan level. */
export const LEARNING: Record<string, { title: string; meta: string }[]> = {
  "UI/UX": [{ title: "Kenalan sama desain UI pakai Figma", meta: "Modul · 6 sesi" }, { title: "Usability test simpel bareng teman", meta: "Praktik" }],
  "Public Speaking": [{ title: "Latihan pitching 3 menit", meta: "Praktik mingguan" }, { title: "Rekam & evaluasi presentasimu sendiri", meta: "Praktik" }],
  "Manajemen Proyek": [{ title: "Bikin timeline & bagi tugas tim", meta: "Modul · 3 sesi" }, { title: "Jalankan sprint mingguan 15 menit", meta: "Praktik" }],
  SQL: [{ title: "Query lanjutan: JOIN & agregasi", meta: "Latihan · 4 soal" }, { title: "Rancang skema tabel untuk proyekmu", meta: "Praktik" }],
  "Analisis Data": [{ title: "Eksplorasi dataset dengan statistik deskriptif", meta: "Latihan · 3 dataset" }, { title: "Bikin dashboard ringkas dari data nyata", meta: "Proyek mini" }],
  Python: [{ title: "Olah data dengan pandas", meta: "Modul · 5 sesi" }, { title: "Tulis skrip otomatisasi kecil", meta: "Praktik" }],
  Riset: [{ title: "Susun pertanyaan riset & wawancara 5 orang", meta: "Praktik" }, { title: "Rangkum 3 jurnal terkait topikmu", meta: "Latihan" }],
  Menulis: [{ title: "Tulis ringkasan proposal 1 halaman", meta: "Latihan" }, { title: "Minta umpan balik tulisan dari dosen/teman", meta: "Praktik" }],
  "Desain Grafis": [{ title: "Dasar komposisi, warna, dan tipografi", meta: "Modul · 4 sesi" }, { title: "Bikin poster presentasi proyek", meta: "Praktik" }],
  Frontend: [{ title: "Bangun halaman responsif dengan HTML/CSS/JS", meta: "Modul · 6 sesi" }, { title: "Pelajari komponen React", meta: "Modul · 5 sesi" }],
  "Model Bisnis": [{ title: "Isi Business Model Canvas untuk proyekmu", meta: "Praktik" }, { title: "Hitung biaya & sumber pendanaan sederhana", meta: "Latihan" }],
  Fotografi: [{ title: "Dasar komposisi, cahaya, dan eksposur", meta: "Modul · 4 sesi" }, { title: "Foto-esai 10 gambar tentang topik proyekmu", meta: "Proyek mini" }],
  "Video Editing": [{ title: "Dasar editing: potong, transisi, audio", meta: "Modul · 5 sesi" }, { title: "Bikin video teaser proyek 60 detik", meta: "Proyek mini" }],
  Copywriting: [{ title: "Tulis headline & deskripsi dengan rumus AIDA", meta: "Latihan · 5 contoh" }, { title: "A/B test dua versi teks ke teman", meta: "Praktik" }],
  "Social Media": [{ title: "Susun kalender konten 2 minggu", meta: "Praktik" }, { title: "Baca insight akun dan tarik 3 pelajaran", meta: "Latihan" }],
  "Pemasaran Digital": [{ title: "Pahami funnel: awareness sampai konversi", meta: "Modul · 3 sesi" }, { title: "Jalankan kampanye mikro dengan anggaran kecil", meta: "Praktik" }],
  Akuntansi: [{ title: "Catat arus kas proyek dengan format sederhana", meta: "Latihan" }, { title: "Susun RAB dan hitung titik impas", meta: "Praktik" }],
  Excel: [{ title: "Rumus inti: VLOOKUP/XLOOKUP, IF, SUMIFS", meta: "Latihan · 6 soal" }, { title: "Bikin pivot table dan grafik dari data nyata", meta: "Praktik" }],
  Negosiasi: [{ title: "Latihan negosiasi win-win lewat role-play", meta: "Praktik" }, { title: "Siapkan BATNA untuk satu rencana kerja sama", meta: "Latihan" }],
  Kepemimpinan: [{ title: "Pimpin satu rapat singkat dengan agenda jelas", meta: "Praktik" }, { title: "Minta umpan balik 360° dari anggota tim", meta: "Praktik" }],
  "Kerja Tim": [{ title: "Sepakati aturan main dan pembagian peran tim", meta: "Praktik" }, { title: "Retrospektif mingguan: apa yang jalan & yang tidak", meta: "Praktik" }],
  "Penulisan Ilmiah": [{ title: "Susun kerangka IMRaD untuk topikmu", meta: "Latihan" }, { title: "Belajar sitasi dengan reference manager", meta: "Modul · 2 sesi" }],
  Statistika: [{ title: "Statistika deskriptif & visualisasi data", meta: "Modul · 4 sesi" }, { title: "Uji hipotesis dasar (t-test, chi-square)", meta: "Latihan · 4 soal" }],
  Penerjemahan: [{ title: "Terjemahkan satu artikel pendek dan bandingkan", meta: "Latihan" }, { title: "Pelajari istilah baku di bidangmu", meta: "Modul · 2 sesi" }],
  Mengajar: [{ title: "Rancang rencana pembelajaran 30 menit", meta: "Latihan" }, { title: "Praktik mengajar ke 3 teman, minta umpan balik", meta: "Praktik" }],
  Backend: [{ title: "Bangun REST API sederhana dengan autentikasi", meta: "Modul · 6 sesi" }, { title: "Validasi input dan tangani error dengan benar", meta: "Latihan" }],
  JavaScript: [{ title: "Dasar JavaScript modern (ES6+)", meta: "Modul · 5 sesi" }, { title: "Konsumsi API dan render hasilnya", meta: "Proyek mini" }],
  "Mobile (Flutter/Android)": [{ title: "Bangun aplikasi to-do pertamamu", meta: "Modul · 6 sesi" }, { title: "Hubungkan aplikasi ke API", meta: "Praktik" }],
  "Machine Learning": [{ title: "Latih model klasifikasi pertamamu dengan scikit-learn", meta: "Modul · 5 sesi" }, { title: "Evaluasi model: akurasi, presisi, recall", meta: "Latihan" }],
  Java: [{ title: "Dasar OOP: kelas, pewarisan, antarmuka", meta: "Modul · 5 sesi" }, { title: "Bangun aplikasi konsol kecil", meta: "Proyek mini" }],
  "Jaringan Komputer": [{ title: "Pahami model OSI dan TCP/IP", meta: "Modul · 3 sesi" }, { title: "Simulasikan jaringan kecil di Packet Tracer", meta: "Praktik" }],
  "Keamanan Siber": [{ title: "Kenali 10 kerentanan web teratas (OWASP)", meta: "Modul · 4 sesi" }, { title: "Audit keamanan sederhana pada proyekmu", meta: "Praktik" }],
  "IoT & Elektronik": [{ title: "Rangkai sensor dengan Arduino/ESP32", meta: "Modul · 5 sesi" }, { title: "Kirim data sensor ke dashboard", meta: "Proyek mini" }],
};

export const INDICATORS = [
  { key: "problem_clarity", name: "Kejelasan masalah", weight: 0.25 },
  { key: "solution_relevance", name: "Relevansi solusi", weight: 0.25 },
  { key: "user_need", name: "Kebutuhan pengguna", weight: 0.2 },
  { key: "collaboration", name: "Kolaborasi", weight: 0.15 },
  { key: "sustainability", name: "Keberlanjutan", weight: 0.15 },
] as const;
export const WEIGHTS_VERSION = "v1";

export const CANVAS_META = [
  { key: "problem", title: "Masalah", question: "Masalah nyata apa yang pengen kamu beresin, dan siapa yang ngalamin?", tip: "Tulis masalah yang bisa kamu lihat langsung, jangan langsung lompat ke solusinya.", placeholder: "Contoh: antrean layanan akademik kepanjangan..." },
  { key: "rootCause", title: "Akar Masalah", question: "Kenapa masalah itu bisa kejadian? Coba tanya “kenapa” beberapa kali.", tip: "Pisahin mana gejala, mana penyebab utamanya.", placeholder: "Contoh: info jadwal gak ada versi online-nya..." },
  { key: "solution", title: "Solusi", question: "Apa ide solusimu, dan gimana ide itu ngejawab akar masalahnya?", tip: "Satu kalimat yang jelas lebih nendang daripada paragraf panjang.", placeholder: "Contoh: sistem antrean online..." },
  { key: "technology", title: "Teknologi", question: "Teknologi apa yang paling pas buat wujudin solusimu?", tip: "Pilih yang realistis bisa dibangun timmu, gak harus yang paling canggih.", placeholder: "Contoh: aplikasi web responsif, kamera HP, basis data sederhana..." },
  { key: "features", title: "Fitur", question: "Fitur utama apa aja yang dibutuhin pengguna? Urutin dari yang paling penting.", tip: "Mulai dari 3 fitur inti dulu, sisanya bisa nyusul.", placeholder: "Contoh: 1) Pindai sampah, 2) Peta tempat sampah..." },
  { key: "impact", title: "Dampak", question: "Kalau solusimu berhasil, apa yang bakal berubah? Gimana cara ngukurnya?", tip: "Tulis indikator yang bisa diukur, misalnya jumlah atau persentase.", placeholder: "Contoh: persentase sampah terpilah dengan benar di kantin..." },
] as const;
