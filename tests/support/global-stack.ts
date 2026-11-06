import { startStack } from "./stack";

/** Dipakai Vitest (globalSetup): hidupkan stack sekali, bagikan lewat env, matikan di akhir. */
export default async function setup() {
  const stack = await startStack();
  process.env.TEST_BASE_URL = stack.baseUrl;
  process.env.TEST_MONGO_URI = stack.mongoUri;
  return async () => {
    // Mode live: tampilkan kegagalan AI dari log server agar penyebab 429/503 terlihat.
    if (process.env.TEST_LIVE_AI === "1") for (const l of stack.log().split("\n")) if (l.includes("[ai]")) console.log("SERVER", l.replace(/AQ\.[\w-]+|AIza[\w-]+/g, "***"));
    await stack.stop();
  };
}
