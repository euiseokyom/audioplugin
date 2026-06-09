import mongoose from "mongoose";
import { getMongoUri } from "@/lib/env";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };
global.mongooseCache = cached;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const uri = getMongoUri();
    cached.promise = mongoose.connect(uri, { bufferCommands: false });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
