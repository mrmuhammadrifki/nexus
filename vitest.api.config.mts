import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(process.cwd(), "src") } },
  test: {
    include: ["tests/api/**/*.test.ts"],
    environment: "node",
    globalSetup: ["tests/support/global-stack.ts"],
    fileParallelism: false, // semua file berbagi satu database uji
    testTimeout: 60_000,
    hookTimeout: 600_000, // build pertama bisa lama
    pool: "forks",
  },
});
