import { expect, test } from "./fixtures";
import { noHorizontalScroll } from "./fixtures";

test.describe("landing page", () => {
  test("konten inti tampil dan CTA menuju pendaftaran", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Dari “aku bisa apa, ya?” jadi proyek yang beneran berdampak.");
    for (const t of ["Cara kerja", "Kenapa NEXUS", "Transparansi"]) await expect(page.getByRole("navigation", { name: "Navigasi utama" }).getByText(t)).toBeVisible();
    await expect(page.getByText("Perjalanan Dina").or(page.getByText("Contoh perjalanan"))).toBeVisible();
    await page.getByRole("link", { name: "Coba gratis" }).click();
    await expect(page).toHaveURL(/\/daftar$/);
    await expect(page.getByRole("heading", { name: "Bikin akun NEXUS" })).toBeVisible();
  });

  test("regresi kontras: teks tombol terbaca (bukan putih-di-putih / gelap-di-biru)", async ({ page }) => {
    await page.goto("/");
    const colors = (sel: string) => page.locator(sel).first().evaluate((el) => { const s = getComputedStyle(el); return { c: s.color, bg: s.backgroundColor }; });
    const primary = await colors("a.btn-primary");
    expect(primary.c).toBe("rgb(255, 255, 255)"); // putih di atas biru
    const cta = page.getByRole("link", { name: "Gas, mulai sekarang" }).last();
    await cta.scrollIntoViewIfNeeded();
    const c = await cta.evaluate((el) => { const s = getComputedStyle(el); return { c: s.color, bg: s.backgroundColor }; });
    expect(c.bg).toBe("rgb(255, 255, 255)"); expect(c.c).not.toBe(c.bg); expect(c.c).toBe("rgb(27, 63, 194)");
  });

  test("tidak ada scroll horizontal dan semua seksi tersedia", async ({ page }) => {
    await page.goto("/");
    expect(await noHorizontalScroll(page)).toBe(true);
    for (const id of ["cara-kerja", "alur", "transparan"]) await expect(page.locator(`#${id}`)).toHaveCount(1);
    await expect(page.getByText("Team ARUNA · STMIK Widya Utama · PIMNAS 6 2026")).toBeVisible();
  });
});

test("font di-host sendiri: tidak ada request ke Google Fonts dan font Plus Jakarta Sans benar-benar terpakai", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (r) => { if (/fonts\.(googleapis|gstatic)\.com/.test(r.url())) external.push(r.url()); });
  await page.goto("/"); await page.waitForLoadState("networkidle");
  expect(external).toEqual([]);
  const loaded = await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('800 16px "Plus Jakarta Sans Variable"') && [...document.fonts].some((f) => f.family.includes("Plus Jakarta Sans") && f.status === "loaded"); });
  expect(loaded).toBe(true);
  expect(await page.locator("h1").evaluate((el) => getComputedStyle(el).fontFamily)).toContain("Plus Jakarta Sans Variable");
});

test.describe("animasi landing", () => {
  test.use({ reducedMotion: "no-preference" });

  test("headline muncul per kata, elemen reveal muncul saat di-scroll", async ({ page }) => {
    await page.goto("/");
    const words = page.locator("h1 .word");
    expect(await words.count()).toBeGreaterThan(8);
    expect(await words.first().evaluate((el) => getComputedStyle(el).animationName)).toBe("word-up");
    // seluruh kata akhirnya terlihat penuh
    await expect.poll(async () => words.last().evaluate((el) => getComputedStyle(el).opacity), { timeout: 5000 }).toBe("1");

    const card = page.locator("#cara-kerja .reveal").first();
    expect(await card.evaluate((el) => getComputedStyle(el).opacity)).toBe("0"); // belum di viewport
    await card.scrollIntoViewIfNeeded();
    await expect(card).toHaveClass(/\bin\b/);
    await expect.poll(async () => card.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
  });

  test("garis progres scroll bertambah, kartu hero bisa miring mengikuti kursor", async ({ page }) => {
    await page.goto("/");
    const bar = page.locator("div.origin-left").first();
    const w0 = await bar.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect.poll(async () => bar.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a)).toBeGreaterThan(w0 + 0.5);

    await page.evaluate(() => window.scrollTo(0, 0));
    const tilt = page.locator(".tilt").first(); const box = (await tilt.boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.1);
    await expect.poll(async () => tilt.evaluate((el) => (el as HTMLElement).style.transform)).toContain("rotateY");
    await page.mouse.move(2, 2);
    await expect.poll(async () => tilt.evaluate((el) => (el as HTMLElement).style.transform)).toBe("");
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("tanpa animasi: semua konten langsung terlihat penuh tanpa perlu scroll", async ({ page }) => {
    await page.goto("/");
    expect(await page.locator("h1 .word").first().evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
    for (const el of await page.locator("#cara-kerja .reveal").all()) expect(await el.evaluate((e) => getComputedStyle(e).opacity)).toBe("1");
  });
});
