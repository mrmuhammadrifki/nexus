import { MongoClient } from "mongodb";

const uri = () => { const u = process.env.TEST_MONGO_URI; if (!u || !u.includes("127.0.0.1")) throw new Error("TEST_MONGO_URI belum diset / bukan lokal"); return u; };

/** Kosongkan semua koleksi kecuali `roles` (data referensi). */
export async function resetDb() {
  const c = await new MongoClient(uri()).connect();
  try {
    const db = c.db();
    for (const col of await db.listCollections().toArray()) if (col.name !== "roles") await db.collection(col.name).deleteMany({});
  } finally { await c.close(); }
}

/** Akses langsung untuk memanipulasi data uji (mis. membuat undangan kedaluwarsa). */
export async function withDb<T>(fn: (db: import("mongodb").Db) => Promise<T>): Promise<T> {
  const c = await new MongoClient(uri()).connect();
  try { return await fn(c.db()); } finally { await c.close(); }
}
