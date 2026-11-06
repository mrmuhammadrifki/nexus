import { expect, test } from "./fixtures";
import { Api, FULL_CANVAS, CANVAS_KEYS, newPartner } from "../support/client";

/** Perjalanan lengkap satu pengguna lewat UI: daftar → KNOW → GROW → CONNECT → CREATE → IMPACT → dashboard → hapus akun. */
test("perjalanan lengkap: dari daftar sampai skor kesiapan", async ({ page }) => {
  test.setTimeout(240_000);
  const email = `alur.${Date.now().toString(36)}@test.local`;
  const password = "rahasia12345";

  // mitra yang cocok dengan peran target (Inovator Agritech), dibuat lewat API
  const partner = await newPartner("Rina Riset", { Riset: 5, "IoT & Elektronik": 4, "Model Bisnis": 4, "Analisis Data": 4, "Manajemen Proyek": 4 }, ["Pertanian", "Teknologi"]);

  await test.step("landing → daftar → lengkapi profil", async () => {
    await page.goto("/");
    await page.getByRole("link", { name: "Coba gratis" }).click();
    await page.getByLabel("Nama").fill("Dina Penguji");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Daftar" }).click();
    await expect(page).toHaveURL(/\/onboarding$/); // AU-2: wajib lengkapi profil dulu
    await page.getByLabel("Kampus").fill("STMIK Widya Utama");
    await page.getByLabel("Jurusan").fill("Informatika");
    await page.getByLabel("Semester").fill("5");
    await page.getByRole("button", { name: "Lanjut ke KNOW" }).click();
    await expect(page).toHaveURL(/\/know$/);
  });

  await test.step("KNOW 1: bidang + persentase progres", async () => {
    await expect(page.getByText("Pertanyaan 1 dari 4 · 0% terisi")).toBeVisible();
    await page.getByRole("button", { name: "Teknologi", exact: true }).click();
    await page.getByRole("button", { name: "Pendidikan", exact: true }).click();
    await expect(page.getByText("2/12 dipilih")).toBeVisible();
    await expect(page.getByText("Pertanyaan 1 dari 4 · 20% terisi")).toBeVisible();
    await expect(page.getByRole("link", { name: "Kembali ke dashboard" })).toBeVisible();
    await page.getByRole("button", { name: "Lanjut" }).click();
  });

  await test.step("KNOW 2: hanya skill populer; semua skill di halaman terpisah dengan cari & filter", async () => {
    await expect(page.getByText("Skill paling populer di bidangmu")).toBeVisible();
    const chips = await page.locator("button.chip").count();
    expect(chips).toBeLessThanOrEqual(12); expect(chips).toBeGreaterThan(0); // tidak menampilkan semua 33
    await page.getByRole("button", { name: "Python", exact: true }).click();
    await page.getByRole("button", { name: "SQL", exact: true }).click();

    await page.getByRole("link", { name: /Lihat semua skill/ }).click();
    await expect(page).toHaveURL(/\/know\/skills$/);
    await expect(page.getByText("33 skill")).toBeVisible();
    await page.getByLabel("Cari skill").fill("statis");
    await expect(page.getByText("1 skill")).toBeVisible();
    await page.getByRole("button", { name: /^Statistika/ }).click();
    await page.getByLabel("Cari skill").fill("");
    await page.getByRole("group", { name: "Filter bidang" }).getByRole("button", { name: "Kesehatan" }).click();
    await expect(page.getByText(/9 skill · Kesehatan/)).toBeVisible();
    await page.getByLabel("Cari skill").fill("zzzz-tidak-ada");
    await expect(page.getByText(/Tidak ada skill yang cocok/)).toBeVisible();
    await expect(page.getByText(/3\/20 dipilih/)).toBeVisible();
    await page.getByRole("link", { name: /Selesai pilih/ }).click();
    await expect(page).toHaveURL(/\/know\?step=2$/);
  });

  await test.step("KNOW 3: tanpa level bawaan — wajib dinilai, ada label bahasa sehari-hari", async () => {
    await expect(page.getByRole("heading", { name: "Seberapa mahir kamu di tiap skill?" })).toBeVisible();
    await expect(page.getByText("Masih 3 skill yang belum dinilai.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Lanjut" })).toBeDisabled();
    await page.getByText("Arti tiap level").click();
    await expect(page.getByText(/Bisa ajarin orang —/)).toBeVisible();
    const lv = (skill: string, n: number) => page.getByRole("radiogroup", { name: `Level ${skill}` }).getByRole("radio", { name: new RegExp(`^${n} `) }).click();
    await lv("Python", 3); await expect(page.getByText("Masih 2 skill yang belum dinilai.")).toBeVisible();
    await lv("SQL", 4); await lv("Statistika", 2);
    await expect(page.getByText(/Masih \d+ skill/)).toHaveCount(0);
    await page.getByRole("button", { name: "Lanjut" }).click();
  });

  await test.step("KNOW 4: pilih sampai 3 target, urutan = prioritas", async () => {
    const g = (n: RegExp) => page.getByRole("checkbox", { name: n });
    await g(/^Dapet magang/).click(); await g(/^Rintis startup/).click();
    await expect(g(/^Dapet magang/)).toContainText("Utama"); await expect(g(/^Rintis startup/)).toContainText("Target 2");
    await g(/^Mulai freelance/).click();
    await expect(page.getByText(/3\/3 dipilih/)).toBeVisible();
    await expect(g(/^Aktif di organisasi/)).toBeDisabled(); // batas 3
    await g(/^Mulai freelance/).click(); // lepas satu
    await expect(g(/^Aktif di organisasi/)).toBeEnabled();
    await page.getByRole("button", { name: "Lanjut" }).click();
  });

  await test.step("KNOW 5: gaya kerja → peran target + pilih dari semua peran (cari)", async () => {
    await page.getByRole("button", { name: /^Si pemikir analitis/ }).click();
    await expect(page.getByText("Pertanyaan 4 dari 4 · 100% terisi")).toBeVisible();
    await expect(page.getByText("Si analis pemecah masalah")).toBeVisible();
    await expect(page.getByRole("radio", { name: /% cocok/ })).toHaveCount(3); // 3 opsi teratas
    await page.getByRole("link", { name: /Lihat semua peran/ }).click();
    await expect(page).toHaveURL(/\/know\/peran$/);
    await expect(page.getByText(/22 peran/)).toBeVisible();
    await page.getByLabel("Cari peran").fill("agri");
    await expect(page.getByText(/^1 peran/)).toBeVisible();
    await page.getByRole("radio", { name: /Inovator Agritech/ }).click();
    await expect(page.getByRole("radio", { name: /Inovator Agritech/ })).toHaveAttribute("aria-checked", "true");
    await page.getByRole("link", { name: /Selesai pilih/ }).click();
    await expect(page).toHaveURL(/\/know\?step=4$/);
    await expect(page.getByRole("radio", { name: /Inovator Agritech/ })).toHaveAttribute("aria-checked", "true"); // ikut tampil walau di luar 3 teratas
    await page.getByRole("link", { name: /Simpan, lanjut ke GROW/ }).click();
  });

  await test.step("GROW: gap sesuai peran pilihan, tombol kembali", async () => {
    await expect(page).toHaveURL(/\/grow$/);
    await expect(page.getByRole("link", { name: "Kembali ke KNOW" })).toBeVisible();
    await expect(page.getByLabel("Ubah target peran")).toContainText("Inovator Agritech");
    await expect(page.getByText(/Belum punya/).first()).toBeVisible(); // skill tak dipilih = level 0, bukan level 1
  });

  await test.step("GROW: checklist & progres → lanjut", async () => {
    await expect(page.getByRole("heading", { name: "Rencana belajarmu" })).toBeVisible();
    const bar = page.getByRole("progressbar", { name: "Progres rencana belajar" });
    await expect(bar).toHaveAttribute("aria-valuenow", "0");
    await page.getByRole("checkbox").first().check();
    await expect(bar).not.toHaveAttribute("aria-valuenow", "0");
    await expect(page.getByRole("heading", { name: "Peran lain yang cocok" })).toBeVisible();
    await page.getByRole("button", { name: /Lanjut ke CONNECT/ }).click();
    await expect(page).toHaveURL(/\/connect$/);
  });

  await test.step("CONNECT: rekomendasi dengan alasan & persen match, ajak ke tim", async () => {
    await expect(page.getByRole("link", { name: "Kembali ke GROW" })).toBeVisible();
    const card = page.locator("article", { hasText: "Rina Riset" });
    await expect(card).toBeVisible();
    await expect(card.getByText(/\d+%/).first()).toBeVisible(); await expect(card.getByText("Kenapa klop:")).toBeVisible();
    await card.getByRole("button", { name: "Ajak ke tim" }).click();
    await expect(card).toHaveCount(0); // yang sudah diajak tidak ditawarkan lagi
    await expect(page.getByText("Nunggu konfirmasi")).toBeVisible();
    // batalkan ajakan → kandidat kembali ke rekomendasi, lalu ajak lagi
    await page.getByRole("button", { name: "Batalkan ajakan ke Rina Riset" }).click();
    await expect(page.getByText("Nunggu konfirmasi")).toHaveCount(0);
    await expect(card).toBeVisible();
    await card.getByRole("button", { name: "Ajak ke tim" }).click();
    await expect(page.getByText("Nunggu konfirmasi")).toBeVisible();

    // mitra menerima (lewat API) → muncul di tim setelah muat ulang
    const me = new Api(); me.email = email; me.password = password; await me.login();
    const t = (await me.get("/api/team")).json;
    expect((await partner.post(`/api/invites/${t.projectId}/respond`, { accept: true })).status).toBe(200);
    await page.reload();
    await expect(page.getByText("2 orang")).toBeVisible();
    await page.getByRole("link", { name: /Lanjut ke CREATE/ }).click();
  });

  await test.step("CREATE: template, placeholder belum terhitung terisi, autosave", async () => {
    await expect(page).toHaveURL(/\/create$/);
    await expect(page.getByRole("link", { name: "Kembali ke CONNECT" })).toBeVisible();
    await expect(page.getByText("0 / 6 bagian · 0%")).toBeVisible();
    await expect(page.getByRole("tab", { name: "Template isian" })).toBeVisible(); // panel terbuka karena bagian kosong
    await page.getByRole("button", { name: "Pakai template" }).first().click();
    const ta = page.getByLabel("Jawabanmu");
    await expect(ta).toHaveValue(/\[Kelompok orang\]/);
    await expect(page.getByText(/Masih ada \d+ bagian dalam \[kurung siku\]/)).toBeVisible();
    await expect(page.getByText("0 / 6 bagian")).toBeVisible(); // masih placeholder → belum terisi

    await ta.fill("Petani cabai di Desa Sukamaju kehilangan sekitar 30% hasil panen per musim karena hama terlambat disadari.");
    await expect(page.getByText(/Masih ada \d+ bagian dalam/)).toHaveCount(0);
    await expect(page.getByText("1 / 6 bagian · 17%")).toBeVisible();
    await expect(page.getByText("Tersimpan", { exact: true })).toBeVisible({ timeout: 15_000 }); // autosave 2 detik
    await page.reload();
    await expect(page.getByLabel("Jawabanmu")).toHaveValue(/Desa Sukamaju/); // bertahan
  });

  await test.step("CREATE: contoh proyek mengikuti bidang & bisa ganti tema; AI Coach", async () => {
    await page.getByRole("button", { name: /Template & contoh/ }).click();
    await page.getByRole("tab", { name: "Contoh proyek" }).click();
    await expect(page.getByText("BELAJARBARENG · PENDIDIKAN")).toBeVisible(); // bidang pertama yang punya contoh
    await page.getByRole("button", { name: "Sampah kampus" }).click();
    await expect(page.getByText("SIPILAH · LINGKUNGAN")).toBeVisible();
    await expect(page.getByText(/Contoh ilustrasi/).first()).toBeVisible();

    await page.getByRole("button", { name: "Minta masukan AI" }).click();
    await expect(page.getByText(/Udah oke:|Bisa ditingkatin:|Ide dari AI:/).first()).toBeVisible();
    await expect(page.getByText("Saran AI bisa keliru. Keputusan akhir tetap di kamu.")).toBeVisible();
  });

  await test.step("CREATE → IMPACT: lengkapi kanvas, nilai, lihat skor & rumusnya", async () => {
    const me = new Api(); me.email = email; me.password = password; await me.login();
    const pid = (await me.get("/api/team")).json.projectId;
    for (const k of CANVAS_KEYS.slice(1)) await me.patch(`/api/projects/${pid}/canvas`, { section: k, text: FULL_CANVAS[k] });
    await page.reload();
    await expect(page.getByText("6 / 6 bagian · 100%")).toBeVisible();
    await page.getByRole("button", { name: /Dampak/ }).first().click();
    await page.getByRole("link", { name: /Cek kesiapan di IMPACT/ }).click();

    await expect(page).toHaveURL(/\/impact$/);
    await expect(page.getByRole("link", { name: "Kembali ke CREATE" })).toBeVisible();
    await page.getByRole("button", { name: "Nilai proyekku" }).click();
    const ring = page.getByRole("img", { name: /Skor kesiapan \d+ dari 100/ });
    await expect(ring).toBeVisible();
    const score = Number(/(\d+) dari 100/.exec((await ring.getAttribute("aria-label"))!)![1]);
    await page.getByRole("button", { name: /Kejelasan masalah/ }).click();
    await expect(page.getByText("Kata AI Coach:")).toBeVisible();
    await expect(page.getByText(new RegExp(`= ${score}\\b`))).toBeVisible(); // rumus Σ bobot × nilai tampil & cocok
    await expect(page.getByText("Penilai heuristik (tanpa LLM)")).toBeVisible();
  });

  await test.step("dashboard: semua step beres", async () => {
    await page.getByRole("link", { name: "Dashboard", exact: true }).first().click();
    await expect(page.getByText("5 dari 5 step udah beres.")).toBeVisible();
    await expect(page.getByRole("progressbar", { name: "Progres perjalanan" })).toHaveAttribute("aria-valuenow", "100");
    await expect(page.getByText("Dapet magang · Rintis startup / usaha")).toBeVisible();
  });

  await test.step("pengaturan: privasi publik, lalu hapus akun", async () => {
    await page.getByRole("link", { name: "Pengaturan akun" }).click();
    const sw = page.getByRole("switch", { name: "Profil publik" });
    await expect(sw).toHaveAttribute("aria-checked", "false"); // default privat
    await sw.click(); await expect(sw).toHaveAttribute("aria-checked", "true");
    await expect(page.getByText("Profilmu sekarang publik")).toBeVisible();

    await page.getByText("Hapus akun", { exact: true }).click();
    const del = page.getByRole("button", { name: "Hapus akun saya" });
    await expect(del).toBeDisabled();
    await page.getByLabel(/Ketik/).fill("HAPUS");
    await del.click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/masuk$/);
    const again = new Api(); await again.login(email, password);
    expect((await again.get("/api/me")).status).toBe(401);
  });
});
