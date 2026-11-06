import { test as base, expect, type BrowserContext, type Page } from "@playwright/test";
import { Api, completeKnow, newUser, type KnowInput } from "../support/client";

/** baseURL dibaca saat tes jalan (port acak dari globalSetup). */
export const test = base.extend({ baseURL: async ({}, use) => { await use(process.env.TEST_BASE_URL!); } });
export { expect };

/** Pasang sesi Api (hasil login lewat HTTP) ke konteks browser agar langsung "sudah login". */
export async function adopt(context: BrowserContext, api: Api) {
  const url = process.env.TEST_BASE_URL!;
  await context.addCookies(Object.entries(api.jar).map(([name, value]) => ({ name, value, url })));
}

/** Pengguna siap pakai: dibuat via API (cepat), KNOW selesai opsional, lalu login di browser. */
export async function signedIn(context: BrowserContext, name = "Penguji", opts: { know?: KnowInput | false; visibility?: "public" | "private" } = {}) {
  const u = await newUser(name, { visibility: opts.visibility });
  if (opts.know !== false) await completeKnow(u, opts.know);
  await adopt(context, u);
  return u;
}

export const noHorizontalScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
