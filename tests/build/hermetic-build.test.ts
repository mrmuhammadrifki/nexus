/**
 * Regresi deploy (Vercel): `next build` harus lolos di lingkungan KOSONG pada salinan bersih repo:
 *  - tanpa .env.local, tanpa MONGODB_URI/AUTH_SECRET (pernah gagal: "MONGODB_URI belum diset" saat build)
 *  - dengan MONGODB_URI yang tak terjangkau (build tidak boleh mencoba konek ke database)
 *  - tanpa mengunduh apa pun dari Google Fonts (pernah gagal: next/font/google di mesin build)
 */
import { spawn } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, symlinkSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const ROOT = process.cwd();
// Seperti clone Vercel: seluruh repo KECUALI yang di-ignore git (node_modules, build, .env*, artefak tes). `tests/` ikut karena tsconfig mencakup berkas yang meng-import-nya.
const SKIP = new Set(["node_modules", ".next", ".next-test", ".git", "test-results", "playwright-report", ".db"]);
let tmp = ""; let log = ""; let code = -1;

const build = (env: Record<string, string>) => new Promise<{ code: number; log: string }>((resolve) => {
  const c = spawn(process.execPath, [path.join(tmp, "node_modules/next/dist/bin/next"), "build"], { cwd: tmp, env: { PATH: process.env.PATH!, HOME: process.env.HOME!, NEXT_TELEMETRY_DISABLED: "1", ...env } as unknown as NodeJS.ProcessEnv });
  let out = ""; c.stdout.on("data", (d) => (out += d)); c.stderr.on("data", (d) => (out += d));
  c.on("exit", (k) => resolve({ code: k ?? -1, log: out }));
});
const walk = (d: string): string[] => readdirSync(d).flatMap((f) => { const p = path.join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });

beforeAll(async () => {
  tmp = mkdtempSync(path.join(os.tmpdir(), "nexus-build-"));
  cpSync(ROOT, tmp, { recursive: true, filter: (src) => { const rel = path.relative(ROOT, src); return !rel.split(path.sep).some((s) => SKIP.has(s)) && !/^\.env(\.|$)/.test(path.basename(src)) || path.basename(src) === ".env.example"; } });
  symlinkSync(path.join(ROOT, "node_modules"), path.join(tmp, "node_modules"));
}, 120_000);
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

describe("build hermetik (seperti di Vercel)", () => {
  it("salinan bersih tidak memuat .env.local", () => {
    expect(existsSync(path.join(tmp, ".env.local"))).toBe(false); expect(existsSync(path.join(tmp, "package.json"))).toBe(true);
  });
  it("lolos tanpa MONGODB_URI & AUTH_SECRET", async () => {
    const r = await build({}); code = r.code; log = r.log;
    expect(r.log).not.toMatch(/MONGODB_URI belum diset/); expect(r.code, r.log.slice(-1500)).toBe(0);
  }, 300_000);
  it("lolos dengan MONGODB_URI tak terjangkau, tanpa mencoba konek (cepat, tanpa error koneksi)", async () => {
    rmSync(path.join(tmp, ".next"), { recursive: true, force: true });
    const t = Date.now(); const r = await build({ MONGODB_URI: "mongodb://10.255.255.1:27017/nexus", AUTH_SECRET: "x" });
    expect(r.code, r.log.slice(-1500)).toBe(0);
    expect(r.log).not.toMatch(/MongoServerSelectionError|ECONNREFUSED|ETIMEDOUT|Unhandled/i);
    expect(Date.now() - t).toBeLessThan(120_000);
  }, 300_000);
  it("font di-host sendiri: tidak ada referensi ke Google Fonts di hasil build, woff2 ikut ter-bundle", () => {
    const files = walk(path.join(tmp, ".next")).filter((f) => /\.(css|js|html|json)$/.test(f) && !f.includes("/cache/"));
    const bad = files.filter((f) => /fonts\.(googleapis|gstatic)\.com/.test(readFileSync(f, "utf8")));
    expect(bad).toEqual([]);
    expect(walk(path.join(tmp, ".next/static/media")).some((f) => /plus-jakarta-sans-latin-wght/.test(f))).toBe(true);
    void code; void log;
  });
});
