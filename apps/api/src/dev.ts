/**
 * Development entry point.
 * Starts an in-memory MongoDB instance (mongodb-memory-server),
 * injects its URI into process.env BEFORE any app module loads,
 * then dynamically imports the main server so env.ts picks up the URI.
 */
import { MongoMemoryServer } from "mongodb-memory-server";

async function startDev() {
  console.log("🔧 Starting in-memory MongoDB for development...");

  const mongod = await MongoMemoryServer.create({
    instance: {
      dbName: "finsight",
    },
  });

  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;

  console.log(`✅ MongoDB ready at ${uri}`);

  // Gracefully stop the memory server when the process exits
  process.on("exit", () => void mongod.stop());
  process.on("SIGINT", async () => {
    await mongod.stop();
    process.exit(0);
  });
  process.on("SIGTERM", async () => {
    await mongod.stop();
    process.exit(0);
  });

  // Dynamically import the main entry point AFTER the env var is set.
  // dotenv.config() in env.ts won't override an already-set env var.
  await import("./index");
}

startDev().catch((err) => {
  console.error("Failed to start dev server:", err);
  process.exit(1);
});
