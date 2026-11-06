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
  cache.conn = await cache.promise;
  return cache.conn;
}

/** Koneksi native untuk adapter Auth.js. */
export function getMongoClient(): Promise<MongoClient> {
  if (!uri) throw new Error("MONGODB_URI belum diset");
  cache.client ??= new MongoClient(uri).connect();
  return cache.client;
}
