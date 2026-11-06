import AxeBuilder from "@axe-core/playwright";
import { expect, signedIn, test } from "./fixtures";

/** WCAG 2 A/AA lewat axe-core, termasuk kontras warna teks (≥ 4,5:1) sesuai kebutuhan non-fungsional PRD. */
const PUBLIC = ["/", "/masuk", "/daftar", "/offline"];
const AUTHED = ["/dashboard", "/know", "/know?step=1", "/know?step=2", "/know?step=3", "/know?step=4", "/know/skills", "/know/peran", "/grow", "/connect", "/create", "/impact", "/pengaturan"];

async function audit(page: import("@playwright/test").Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 4).map((n) => `${n.target.join(" ")} :: ${(n.any[0]?.message ?? n.html).slice(0, 150)}`) }));
}

test.describe("aksesibilitas halaman publik", () => {
  for (const p of PUBLIC) test(`${p} tanpa pelanggaran WCAG A/AA`, async ({ page }) => { expect(await audit(page, p)).toEqual([]); });
});

test.describe("aksesibilitas halaman aplikasi (sudah login)", () => {
  test.beforeEach(async ({ context }) => { await signedIn(context, "Aksesibel", { visibility: "public" }); });
  for (const p of AUTHED) test(`${p} tanpa pelanggaran WCAG A/AA`, async ({ page }) => { expect(await audit(page, p)).toEqual([]); });
});

test("keyboard: Tab dari awal landing mencapai tautan & tombol utama dengan fokus terlihat", async ({ page }) => {
  await page.goto("/");
  const seen: string[] = [];
  for (let i = 0; i < 12; i++) { await page.keyboard.press("Tab"); seen.push(await page.evaluate(() => { const e = document.activeElement as HTMLElement; const o = getComputedStyle(e).outlineStyle; return `${e.textContent?.trim().slice(0, 30)}|${o}`; })); }
  expect(seen.some((s) => s.startsWith("Gas, mulai sekarang"))).toBe(true);
  expect(seen.filter((s) => s.endsWith("|none")).length).toBeLessThan(seen.length); // ada indikator fokus
});
