import { expect, test } from "./fixtures";

test.describe("PWA", () => {
  test("service worker terpasang, mengontrol halaman, dan menampilkan /offline saat tanpa jaringan", async ({ page, context }) => {
    await page.goto("/");
    const reg = await page.evaluate(async () => { const r = await navigator.serviceWorker.ready; return { scope: r.scope, active: !!r.active, script: r.active?.scriptURL }; });
    expect(reg.active).toBe(true); expect(reg.scope).toMatch(/\/$/); expect(reg.script).toMatch(/\/sw\.js$/);
    await page.reload(); // setelah reload halaman dikontrol SW
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

    await context.setOffline(true);
    await page.goto("/know").catch(() => {});
    await expect(page.getByRole("heading", { name: "Kamu lagi offline" })).toBeVisible();
    await context.setOffline(false);
    await page.getByRole("link", { name: "Coba lagi" }).click();
    await expect(page).toHaveURL(/\/masuk$/); // online lagi → penjaga halaman mengarahkan tamu ke /masuk
  });

  test("manifest terbaca browser dan ikon dapat dimuat", async ({ page }) => {
    await page.goto("/");
    const href = await page.locator('link[rel="manifest"]').getAttribute("href");
    const m = await page.evaluate(async (h) => (await fetch(h!)).json(), href);
    expect(m.display).toBe("standalone"); expect(m.start_url).toBe("/dashboard");
    for (const i of m.icons) { const ok = await page.evaluate(async (src) => (await fetch(src)).ok, i.src); expect(ok, i.src).toBe(true); }
  });

  test("data API tidak di-cache service worker: setelah logout/ganti akun tidak ada data basi", async ({ page, context }) => {
    await page.goto("/");
    await page.evaluate(() => navigator.serviceWorker.ready);
    const keys = await page.evaluate(async () => { const out: string[] = []; for (const k of await caches.keys()) for (const r of await (await caches.open(k)).keys()) out.push(new URL(r.url).pathname); return out; });
    expect(keys.some((p) => p.startsWith("/api/"))).toBe(false);
    expect(keys).toContain("/offline");
    void context;
  });
});
