import mongoose from "mongoose";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

type Cache = { conn?: typeof mongoose; promise?: Promise<typeof mongoose>; client?: Promise<MongoClient> };
const g = globalThis as unknown as { __nexus?: Cache };
const cache: Cache = (g.__nexus ??= {});

export async function connectDB() {
  if (!uri) throw new Error("MONGODB_URI belum diset");
  if (cache.conn) return cache.conn;
  cache.promise ??= mongoose.connect(uri, { bufferCommands: false, serverSelectionTimeoutMS: 8000 });
  try { cache.conn = await cache.promise; }
  catch (e) { cache.promise = undefined; throw e; } // jangan men-cache kegagalan: percobaan berikutnya harus bisa pulih (cold start serverless)
  return cache.conn;
}

/** Koneksi native untuk adapter Auth.js. */
export function getMongoClient(): Promise<MongoClient> {
  if (!uri) throw new Error("MONGODB_URI belum diset");
  cache.client ??= new MongoClient(uri).connect().catch((e) => { cache.client = undefined; throw e; });
  return cache.client;
}
