/**
 * Stack uji sementara: mongod di port acak + build terpisah (.next-test) + `next start` di port acak.
 * TIDAK PERNAH memakai database dari .env.local: MONGODB_URI selalu diset eksplisit ke mongod lokal sementara.
 */
import { spawn, execFileSync, type ChildProcess } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, rmSync, statSync, readFileSync } from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { MongoClient } from "mongodb";

const ROOT = process.cwd(); // test selalu dijalankan dari root proyek
const DIST = ".next-test";

export type Stack = { baseUrl: string; mongoUri: string; stop: () => Promise<void>; log: () => string };

const freePort = () => new Promise<number>((res, rej) => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const p = (s.address() as net.AddressInfo).port; s.close(() => res(p)); }); s.on("error", rej); });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function mongodBin() {
  for (const p of [process.env.MONGOD_BIN, "/opt/homebrew/bin/mongod", "/usr/local/bin/mongod", "/usr/bin/mongod"]) if (p && existsSync(p)) return p;
  try { return execFileSync("which", ["mongod"]).toString().trim(); } catch { throw new Error("mongod tidak ditemukan. Pasang MongoDB Community atau set MONGOD_BIN."); }
}

function newestMtime(dir: string): number {
  let m = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    m = Math.max(m, e.isDirectory() ? newestMtime(p) : statSync(p).mtimeMs);
  }
  return m;
}
/** Build ulang bila kode/konfigurasi lebih baru dari build terakhir (atau FORCE_BUILD=1). */
function needsBuild() {
  const id = path.join(ROOT, DIST, "BUILD_ID");
  if (process.env.FORCE_BUILD || !existsSync(id)) return true;
  const built = statSync(id).mtimeMs;
  const srcs = [newestMtime(path.join(ROOT, "src")), newestMtime(path.join(ROOT, "public")), ...["next.config.mjs", "package.json", "postcss.config.mjs", "tsconfig.json"].map((f) => statSync(path.join(ROOT, f)).mtimeMs)];
  return Math.max(...srcs) > built;
}

function run(cmd: string, args: string[], env: NodeJS.ProcessEnv, label: string) {
  return new Promise<void>((resolve, reject) => {
    const c = spawn(cmd, args, { cwd: ROOT, env, stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    c.stdout.on("data", (d) => (out += d)); c.stderr.on("data", (d) => (out += d));
    c.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${label} gagal (exit ${code}):\n${out.slice(-3000)}`))));
  });
}

export async function startStack(): Promise<Stack> {
  const kids: ChildProcess[] = [];
  const tmp = mkdtempSync(path.join(os.tmpdir(), "nexus-test-"));
  const stop = async () => {
    for (const k of kids) { try { k.kill("SIGTERM"); } catch { /* sudah mati */ } }
    await sleep(500);
    for (const k of kids) { try { k.kill("SIGKILL"); } catch { /* sudah mati */ } }
    rmSync(tmp, { recursive: true, force: true });
  };
  try {
    // 1) mongod sementara
    const mport = await freePort();
    const mongoUri = `mongodb://127.0.0.1:${mport}/nexus_test`;
    if (!mongoUri.includes("127.0.0.1")) throw new Error("Pengaman: URI uji harus lokal");
    const m = spawn(mongodBin(), ["--dbpath", tmp, "--bind_ip", "127.0.0.1", "--port", String(mport), "--quiet"], { stdio: "ignore" });
    kids.push(m);
    for (let i = 0; ; i++) {
      try { const c = await new MongoClient(mongoUri, { serverSelectionTimeoutMS: 500 }).connect(); await c.db().command({ ping: 1 }); await c.close(); break; }
      catch { if (i > 60) throw new Error("mongod tidak siap"); await sleep(250); }
    }

    const env: NodeJS.ProcessEnv = {
      ...process.env,
      NODE_ENV: "production",
      NEXT_DIST_DIR: DIST,
      MONGODB_URI: mongoUri,
      AUTH_SECRET: "test-secret-0123456789abcdef0123456789",
      AUTH_TRUST_HOST: "true",
      // Default: penilai heuristik yang deterministik; tes biasa TIDAK memanggil LLM sungguhan.
      // TEST_LIVE_AI=1 (hanya untuk `npm run test:ai-live`) meneruskan GEMINI_API_KEY dari lingkungan.
      ...(process.env.TEST_LIVE_AI === "1" ? { AI_PROVIDER: "gemini", ANTHROPIC_API_KEY: "" } : { AI_PROVIDER: "heuristic", ANTHROPIC_API_KEY: "", GEMINI_API_KEY: "" }),
      AUTH_GOOGLE_ID: "", AUTH_GOOGLE_SECRET: "",
    };

    // 2) data referensi (roles)
    await run(path.join(ROOT, "node_modules/.bin/tsx"), ["scripts/seed.ts"], { ...env, NODE_ENV: "development" }, "seed");

    // 3) build bila perlu
    if (needsBuild()) await run(process.execPath, [path.join(ROOT, "node_modules/next/dist/bin/next"), "build"], env, "next build");

    // 4) server
    const port = await freePort();
    const s = spawn(process.execPath, [path.join(ROOT, "node_modules/next/dist/bin/next"), "start", "-p", String(port), "-H", "127.0.0.1"], { cwd: ROOT, env, stdio: ["ignore", "pipe", "pipe"] });
    kids.push(s);
    let log = ""; s.stdout.on("data", (d) => (log += d)); s.stderr.on("data", (d) => (log += d));
    const baseUrl = `http://127.0.0.1:${port}`;
    for (let i = 0; ; i++) {
      try { if ((await fetch(baseUrl + "/manifest.webmanifest")).ok) break; } catch { /* belum siap */ }
      if (i > 120) throw new Error("server tidak siap:\n" + log.slice(-2000));
      await sleep(250);
    }
    return { baseUrl, mongoUri, stop, log: () => log };
  } catch (e) { await stop(); throw e; }
}

/** Tulis info stack untuk proses lain / debugging. */
export const readStackFile = () => JSON.parse(readFileSync(path.join(ROOT, ".test-stack.json"), "utf8"));
