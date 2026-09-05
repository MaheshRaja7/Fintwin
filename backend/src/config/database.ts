import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { ENV } from "./env.js";

let mongod: MongoMemoryServer | null = null;

export async function connectDB(): Promise<void> {
  try {
    if (ENV.MONGODB_URI) {
      console.log(`[Database] Connecting to configured MongoDB: ${ENV.MONGODB_URI.replace(/:([^:@]{1,8})@/, ":****@")}`);
      await mongoose.connect(ENV.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log("[Database] Connected successfully to MongoDB.");
      return;
    }

    console.log("[Database] No MONGODB_URI provided. Initializing standalone MongoDB Memory Server...");
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    console.log(`[Database] MongoMemoryServer running at: ${uri}`);
    await mongoose.connect(uri);
    console.log("[Database] Connected successfully to embedded MongoDB instance.");
  } catch (err) {
    console.warn("[Database] Primary connection failed. Falling back to embedded MongoDB...", err);
    try {
      if (!mongod) {
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        await mongoose.connect(uri);
        console.log("[Database] Fallback embedded MongoDB connected successfully.");
      }
    } catch (fallbackErr) {
      console.error("[Database] Critical: Could not start or connect to any MongoDB instance:", fallbackErr);
      process.exit(1);
    }
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
}
