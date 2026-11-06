import { defineConfig } from "vitest/config";
import path from "node:path";

// Opt-in: memanggil LLM sungguhan (memakai kuota). Tidak termasuk `npm test`.
export default defineConfig({
  resolve: { alias: { "@": path.resolve(process.cwd(), "src") } },
  test: { include: ["tests/live/**/*.live.test.ts"], environment: "node", globalSetup: ["tests/support/global-stack.ts"], fileParallelism: false, testTimeout: 120_000, hookTimeout: 600_000, pool: "forks" },
});
