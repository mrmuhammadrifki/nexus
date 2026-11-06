import { expect, noHorizontalScroll, signedIn, test } from "./fixtures";

/** Mobile-first (PRD): semua halaman bisa dipakai di lebar 360px; target sentuh ≥ 44px. */
const PAGES = ["/", "/masuk", "/daftar", "/dashboard", "/know", "/know?step=1", "/know?step=2", "/know?step=3", "/know?step=4", "/know/skills", "/know/peran", "/grow", "/connect", "/create", "/impact", "/pengaturan"];

test.describe("360px", () => {
  test.beforeEach(async ({ context }) => { await signedIn(context, "Mobile", { visibility: "public" }); });

  for (const p of PAGES) test(`${p}: tanpa scroll horizontal`, async ({ page }) => {
    await page.goto(p); await page.waitForLoadState("networkidle");
    const overflow = await page.evaluate(() => { const w = window.innerWidth; return [...document.querySelectorAll<HTMLElement>("body *")].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > w + 1 && getComputedStyle(e).position !== "fixed" && !e.closest("[class*=overflow-x-auto],[class*=overflow-x-clip],[class*=overflow-hidden]"); }).slice(0, 5).map((e) => `${e.tagName}.${(e.className || "").toString().slice(0, 50)}`); });
    expect(await noHorizontalScroll(page), `meluap: ${overflow.join(" | ")}`).toBe(true);
  });

  test("navigasi bawah muncul di HP dan menu atas disembunyikan", async ({ page }) => {
    await page.goto("/dashboard");
    const bottom = page.getByRole("navigation", { name: "Menu utama" });
    await expect(bottom).toBeVisible();
    await expect(bottom.getByRole("link")).toHaveCount(4);
    await expect(page.getByRole("navigation", { name: "Menu aplikasi" })).toBeHidden();
    await bottom.getByRole("link", { name: "Proyek" }).click();
    await expect(page).toHaveURL(/\/create$/);
  });

  test("target sentuh ≥ 44px untuk tombol, chip, input, dan tautan utama", async ({ page }) => {
    const small: string[] = [];
    for (const p of ["/know", "/know?step=1", "/know?step=2", "/know?step=3", "/grow", "/connect", "/create", "/pengaturan", "/masuk"]) {
      await page.goto(p); await page.waitForLoadState("networkidle");
      const found = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>("button, a.btn-primary, a.btn-secondary, input:not([type=checkbox]):not([type=radio]), select, textarea, [role=radio]")]
        .filter((e) => { const r = e.getBoundingClientRect(); const st = getComputedStyle(e); return r.width > 0 && r.height > 0 && st.visibility !== "hidden" && !e.closest("[hidden]"); })
        .filter((e) => e.getBoundingClientRect().height < 43.5)
        .map((e) => `${e.tagName.toLowerCase()} "${(e.textContent || (e as HTMLInputElement).placeholder || e.getAttribute("aria-label") || "").trim().slice(0, 30)}" ${Math.round(e.getBoundingClientRect().height)}px`));
      small.push(...found.map((f) => `${p}: ${f}`));
    }
    expect(small).toEqual([]);
  });

  test("alur inti bisa diselesaikan dengan sentuhan di 360px: KNOW → level → peran", async ({ page, context }) => {
    void context;
    await page.goto("/know?step=2");
    await expect(page.getByRole("heading", { name: "Seberapa mahir kamu di tiap skill?" })).toBeVisible();
    await page.getByRole("radiogroup", { name: "Level Python" }).getByRole("radio", { name: /^5 / }).tap();
    await expect(page.getByRole("radio", { name: /^5 /, checked: true }).first()).toBeVisible();
    expect(await noHorizontalScroll(page)).toBe(true);
  });
});
