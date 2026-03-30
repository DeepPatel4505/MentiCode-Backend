import "dotenv/config";
import app from "./app.js";
import { prisma } from "./config/prisma.js";
import { redis } from "./config/redis.js";

const PORT = parseInt(process.env.PORT ?? "3002", 10);

const start = async () => {
  try {
    // Verify DB connection
    await prisma.$connect();
    console.info("[Prisma] Database connected");

    // Connect Redis (lazy — won't throw if down)
    await redis.connect().catch((err) =>
      console.warn("[Redis] Could not connect:", err.message)
    );

    app.listen(PORT, () => {
      console.log("Server runnin on http://localhost:" + PORT);
      console.info(`[course-service] Running on port ${PORT} — ${process.env.NODE_ENV}`);
    });
  } catch (err) {
    console.error("[Startup] Fatal error:", err.message);
    await prisma.$disconnect();
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.info("[course-service] SIGTERM received — shutting down");
  await prisma.$disconnect();
  redis.disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  redis.disconnect();
  process.exit(0);
});

start();
