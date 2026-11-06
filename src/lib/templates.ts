/**
 * Template (kerangka isian) dan contoh untuk kanvas CREATE.
 * Placeholder memakai [kurung siku], sama dengan aturan AI Coach: data yang belum ada ditandai, tidak dikarang.
 * Contoh bersifat ILUSTRASI: nama, angka, dan lokasinya karangan untuk memberi gambaran format, bukan fakta.
 */
export type SectionKey = "problem" | "rootCause" | "solution" | "technology" | "features" | "impact";

export const TEMPLATES: Record<SectionKey, { title: string; hint: string; text: string }[]> = {
  problem: [
    { title: "Siapa, di mana, seberapa sering", hint: "Cocok untuk memulai", text: "[Kelompok orang] di [lokasi/konteks] mengalami [masalah] setiap [frekuensi]. Akibatnya, [dampak nyata bagi mereka]. Menurut [sumber: observasi/wawancara/data], sekitar [angka] orang terdampak." },
    { title: "Cerita situasi", hint: "Lebih naratif", text: "Saat [situasi], [siapa] harus [cara yang dilakukan sekarang], padahal [kenapa cara itu bermasalah]. Hal ini membuat [kerugian: waktu/biaya/kesehatan/peluang]." },
    { title: "Dengan bukti dari pengguna", hint: "Menguatkan kebutuhan pengguna", text: "Kami mewawancarai [jumlah] [siapa]. Temuan utama: 1) [temuan] 2) [temuan] 3) [temuan]. Salah satu pernyataan mereka: “[kutipan singkat]”. Karena itu masalah yang kami angkat adalah [masalah]." },
  ],
  rootCause: [
    { title: "Tanya “kenapa” tiga kali", hint: "Menggali sampai akar", text: "Masalah: [ulang masalah]\nKenapa? [penyebab 1]\nKenapa itu terjadi? [penyebab 2]\nAkar utamanya: [penyebab mendasar yang bisa kita ubah]." },
    { title: "Penyebab utama vs pendukung", hint: "Memisahkan gejala dan sebab", text: "Penyebab utama: [satu penyebab terbesar]\nPenyebab pendukung: 1) [penyebab] 2) [penyebab]\nYang sudah dicoba sebelumnya: [upaya] — kurang berhasil karena [alasan]." },
  ],
  solution: [
    { title: "Apa, untuk siapa, bedanya", hint: "Satu kalimat yang jelas", text: "[Nama solusi] adalah [jenis: aplikasi/layanan/alat] untuk [siapa] agar bisa [hasil yang diinginkan]. Cara kerjanya: [satu kalimat]. Berbeda dari cara sekarang karena [pembeda]. Ini menjawab akar masalah [penyebab utama]." },
    { title: "Sebelum → sesudah", hint: "Menunjukkan perubahan", text: "Sebelum: [kondisi sekarang]. Sesudah memakai [nama solusi]: [kondisi baru]. Pengguna mau memakainya terus-menerus karena [alasan: lebih cepat/hemat/ada insentif/jadi kebiasaan]." },
  ],
  technology: [
    { title: "Platform, data, risiko", hint: "Pilih yang realistis untuk timmu", text: "Platform: [web/PWA/mobile]. Penyimpanan data: [database/layanan]. Teknologi kunci: [mis. kamera, peta, notifikasi, sensor]. Alasan dipilih: [mudah dibangun tim, biaya rendah, dsb.]. Risiko teknis: [risiko] — antisipasi: [cara]." },
  ],
  features: [
    { title: "Tiga fitur inti + yang menyusul", hint: "Urut dari paling penting", text: "Fitur inti:\n1) [fitur] — supaya [manfaat bagi pengguna]\n2) [fitur] — supaya [manfaat bagi pengguna]\n3) [fitur] — supaya [manfaat bagi pengguna]\nMenyusul nanti: [fitur tambahan]." },
  ],
  impact: [
    { title: "Indikator yang terukur", hint: "Angka sebelum → sesudah", text: "Yang diukur: [indikator], dari [kondisi awal] menjadi [target] dalam [jangka waktu]. Cara mengukur: [survei/log aplikasi/observasi]. Pengguna yang dijangkau pada tahap awal: [jumlah]." },
    { title: "Dampak langsung & jangka panjang", hint: "Dua lapis dampak", text: "Dampak langsung (dalam [waktu]): [perubahan yang bisa dihitung]. Dampak jangka panjang: [perubahan perilaku/sosial/lingkungan]. Bukti keberhasilan: [indikator]." },
    { title: "Keberlanjutan setelah lomba", hint: "Menjawab: siapa yang melanjutkan?", text: "Setelah lomba, pengelolaan dipegang oleh [pihak/mitra]. Sumber biaya: [sumber]. Mitra yang diajak: [mitra] dengan peran [peran]. Rencana 6 bulan pertama: [langkah]." },
  ],
};

export type Example = { theme: string; field: string; project: string; text: Record<SectionKey, string> };

export const EXAMPLES: Example[] = [
  { theme: "Sampah kampus", field: "Lingkungan", project: "SiPilah", text: {
    problem: "Tiap hari sampah di kantin kampus tercampur antara organik, plastik, dan kertas, sehingga sulit didaur ulang dan menumpuk di TPS. Dari observasi kami selama seminggu, sebagian besar sampah di tempat sampah kantin tidak terpilah. [Contoh ilustrasi]",
    rootCause: "Penyebab utama: mahasiswa tidak tahu sampah harus dibuang ke tempat yang mana. Penyebab pendukung: 1) label tempat sampah tidak jelas, 2) tidak ada umpan balik saat memilah dengan benar.",
    solution: "SiPilah adalah aplikasi web untuk memindai sampah dengan kamera HP agar pengguna langsung tahu harus membuangnya ke mana. Setiap kali memilah dengan benar, pengguna mendapat poin sehingga memilah menjadi kebiasaan.",
    technology: "Aplikasi web responsif (PWA) agar tanpa instal, kamera HP untuk pengenalan jenis sampah, database sederhana untuk menyimpan poin pengguna. Risiko: akurasi pengenalan — antisipasi: mulai dari 5 jenis sampah paling umum.",
    features: "1) Pindai sampah dengan kamera — supaya tahu tempat yang benar\n2) Panduan jenis sampah — supaya paham alasannya\n3) Poin & progres kebiasaan — supaya mau memakai terus\nMenyusul: peta tempat sampah terdekat.",
    impact: "Yang diukur: persentase sampah terpilah dengan benar di kantin, dari kondisi awal hasil observasi menjadi target yang disepakati dalam satu semester. Diukur lewat audit mingguan. Pengelola setelah lomba: BEM bersama pengelola kantin.",
  } },
  { theme: "Belajar daring", field: "Pendidikan", project: "BelajarBareng", text: {
    problem: "Siswa SMP di desa [nama desa] sulit mengikuti materi daring karena sinyal tidak stabil dan kuota terbatas. Dari wawancara dengan [jumlah] siswa dan guru, banyak yang tertinggal materi saat pembelajaran jarak jauh. [Contoh ilustrasi]",
    rootCause: "Penyebab utama: materi hanya tersedia dalam bentuk video yang butuh data besar. Penyebab pendukung: 1) tidak ada materi yang bisa diunduh sekali lalu dipakai offline, 2) guru belum punya cara memantau siapa yang tertinggal.",
    solution: "BelajarBareng adalah aplikasi PWA berisi ringkasan materi dan latihan ringan yang bisa diunduh sekali saat ada sinyal, lalu dipakai offline. Guru dapat melihat progres tiap siswa setelah data tersinkron.",
    technology: "PWA dengan penyimpanan offline (service worker), database sederhana untuk progres, konten teks dan gambar berukuran kecil. Risiko: perangkat lama — antisipasi: uji di HP berspesifikasi rendah.",
    features: "1) Unduh paket materi per bab\n2) Latihan soal offline dengan skor otomatis\n3) Dashboard progres untuk guru\nMenyusul: pengingat belajar.",
    impact: "Yang diukur: persentase siswa yang menyelesaikan latihan tiap pekan, dan selisih nilai sebelum-sesudah pemakaian. Dihitung dari data aplikasi dan nilai guru. Pengelola setelah lomba: guru mata pelajaran bersama sekolah.",
  } },
  { theme: "Kesehatan mental", field: "Kesehatan", project: "TemanCerita", text: {
    problem: "Banyak mahasiswa tahun pertama merasa cemas dan kewalahan tetapi ragu mencari bantuan karena takut dinilai. Dari survei singkat kepada [jumlah] mahasiswa, sebagian besar belum pernah bercerita kepada siapa pun. [Contoh ilustrasi]",
    rootCause: "Penyebab utama: akses ke bantuan terasa menakutkan dan tidak anonim. Penyebab pendukung: 1) informasi layanan kampus tidak mudah ditemukan, 2) belum ada ruang aman untuk bercerita ringan sebelum ke konselor.",
    solution: "TemanCerita adalah web app berisi jurnal harian anonim, cek suasana hati singkat, dan tombol hubungi konselor kampus. Mahasiswa bisa mulai dari hal kecil sebelum merasa siap bertemu konselor.",
    technology: "Aplikasi web responsif dengan login anonim, penyimpanan data terenkripsi, notifikasi pengingat harian. Risiko: privasi — antisipasi: data minimal dan persetujuan eksplisit.",
    features: "1) Jurnal harian anonim\n2) Cek suasana hati mingguan dengan ringkasan tren\n3) Tombol hubungi konselor dan info layanan darurat\nMenyusul: komunitas pendukung moderasi.",
    impact: "Yang diukur: jumlah mahasiswa yang memakai jurnal rutin dan jumlah yang akhirnya menghubungi konselor, per semester. Diukur lewat statistik agregat tanpa data pribadi. Pengelola setelah lomba: unit konseling kampus.",
  } },
  { theme: "Petani kecil", field: "Pertanian", project: "TaniPantau", text: {
    problem: "Petani cabai di [wilayah] sering gagal panen akibat serangan hama yang terlambat disadari. Dari wawancara dengan [jumlah] petani, kerugian per musim cukup besar dan keputusan penyemprotan masih berdasarkan perkiraan. [Contoh ilustrasi]",
    rootCause: "Penyebab utama: tidak ada pemantauan kondisi lahan yang terjadwal. Penyebab pendukung: 1) informasi cuaca tidak spesifik per lahan, 2) catatan perawatan tidak terdokumentasi.",
    solution: "TaniPantau adalah sistem sensor kelembapan murah dan aplikasi web yang memberi peringatan dini serta rekomendasi tindakan berdasarkan kondisi lahan dan catatan petani.",
    technology: "Sensor kelembapan berbasis ESP32, pengiriman data lewat Wi-Fi/LoRa, aplikasi web (PWA) untuk dashboard dan notifikasi. Risiko: jaringan di lahan — antisipasi: simpan data lokal lalu kirim saat tersambung.",
    features: "1) Peringatan dini kelembapan dan suhu\n2) Catatan perawatan harian dengan foto\n3) Rekomendasi tindakan sederhana\nMenyusul: prediksi panen.",
    impact: "Yang diukur: penurunan persentase lahan yang gagal panen dan penghematan biaya pestisida per musim, dibandingkan lahan kontrol. Pengelola setelah lomba: kelompok tani setempat bersama dinas penyuluhan.",
  } },
  { theme: "UMKM lokal", field: "Kewirausahaan", project: "LapakKu", text: {
    problem: "Pelaku UMKM kuliner di sekitar kampus [nama kampus] kesulitan menjangkau pembeli di luar pelanggan tetap. Dari wawancara dengan [jumlah] pemilik usaha, pencatatan pesanan dan stok masih manual sehingga sering terlewat. [Contoh ilustrasi]",
    rootCause: "Penyebab utama: belum punya kanal pesan yang mudah dan terpusat. Penyebab pendukung: 1) tidak punya waktu mengelola media sosial, 2) pencatatan keuangan tidak rapi.",
    solution: "LapakKu adalah web app untuk membuat katalog menu, menerima pesanan lewat tautan, dan mencatat penjualan otomatis. Pemilik usaha tinggal membagikan satu tautan ke pelanggan.",
    technology: "Aplikasi web responsif (PWA), database untuk menu dan pesanan, integrasi tautan WhatsApp untuk pemesanan. Risiko: adopsi — antisipasi: onboarding 10 menit dan pendampingan.",
    features: "1) Katalog menu dengan foto dan harga\n2) Pesanan masuk lewat tautan dan notifikasi\n3) Rekap penjualan harian\nMenyusul: pengingat stok.",
    impact: "Yang diukur: jumlah pesanan per usaha per minggu dan waktu pencatatan yang dihemat. Diukur dari data aplikasi dan wawancara ulang setelah satu bulan. Pengelola setelah lomba: koperasi/komunitas UMKM kampus.",
  } },
];

/** Tema contoh yang paling dekat dengan bidang yang dipilih pengguna (indeks ke EXAMPLES). */
export function defaultExampleFor(interests: string[]): number {
  const map: Record<string, number> = { Lingkungan: 0, "Energi & Kebencanaan": 0, Pendidikan: 1, Kesehatan: 2, Pertanian: 3, Kewirausahaan: 4, "Ekonomi Kreatif": 4, "Keuangan & Fintech": 4 };
  for (const i of interests) if (i in map) return map[i];
  return 0;
}

/** Placeholder [berhuruf] yang belum diganti. Angka seperti [1] (sitasi) tidak dihitung. */
export const PLACEHOLDER = /\[[^\]]*[A-Za-z][^\]]*\]/;
/** Bagian dianggap terisi bila ada isinya DAN tidak lagi mengandung placeholder template. */
export const isFilled = (t?: string | null) => !!t && t.trim().length > 0 && !PLACEHOLDER.test(t);
export const countPlaceholders = (t?: string | null) => (t?.match(new RegExp(PLACEHOLDER.source, "g")) ?? []).length;
