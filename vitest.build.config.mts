import { defineConfig } from "vitest/config";

// Regresi deploy: build hermetik di salinan bersih (tidak butuh stack/mongod).
export default defineConfig({ test: { include: ["tests/build/**/*.test.ts"], environment: "node", testTimeout: 600_000, hookTimeout: 120_000, pool: "forks" } });
