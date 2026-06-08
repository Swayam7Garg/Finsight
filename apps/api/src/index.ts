import { env } from "./config/env";
import { connectDB } from "./config/database";
import { seedDefaultCategories } from "./seeds/categories.seed";
import app from "./app";

async function main() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Seed default categories on first run (idempotent)
    await seedDefaultCategories();

    // Start the Express server
    const server = app.listen(env.API_PORT, () => {
      console.log(`FinSight API server running on http://localhost:${env.API_PORT}`);
      console.log(`API docs available at http://localhost:${env.API_PORT}/api/docs`);
      console.log(`Environment: ${env.NODE_ENV}`);
    });

    // Graceful shutdown
    const shutdown = (signal: string) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(() => {
        console.log("HTTP server closed");
        process.exit(0);
      });

      // Force exit after 10 seconds if graceful shutdown fails
      setTimeout(() => {
        console.error("Forced shutdown after timeout");
        process.exit(1);
      }, 10_000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

main();
