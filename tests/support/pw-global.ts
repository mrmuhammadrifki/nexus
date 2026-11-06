import { startStack, type Stack } from "./stack";

let stack: Stack | undefined;
/** Dipakai Playwright (globalSetup). Mengembalikan teardown. */
export default async function globalSetup() {
  stack = await startStack();
  process.env.TEST_BASE_URL = stack.baseUrl;
  process.env.TEST_MONGO_URI = stack.mongoUri;
  return async () => { await stack?.stop(); };
}
