/**
 * One-time backfill: populate UserStats.xpTotal from existing Enrollment.xpEarned
 * and optionally seed the Redis leaderboard sorted set.
 *
 * Run: node scripts/backfill-user-stats.js
 */

import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";

const prisma = new PrismaClient();

// Redis is optional — if not running, skip it and just fix the DB
let redis = null;
try {
  redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
  });
  await redis.ping();
  console.log("[Redis] connected — will backfill leaderboard");
} catch (_) {
  console.log("[Redis] not available — skipping Redis backfill (DB only)");
  redis = null;
}

// Aggregate xpEarned per user across all enrollments
const rows = await prisma.enrollment.groupBy({
  by: ["userId"],
  _sum: { xpEarned: true },
});

console.log(`Backfilling ${rows.length} users into UserStats…`);

for (const row of rows) {
  const xpTotal = row._sum.xpEarned ?? 0;
  await prisma.userStats.upsert({
    where:  { userId: row.userId },
    create: { userId: row.userId, xpTotal },
    update: { xpTotal },
  });
  if (redis && xpTotal > 0) {
    await redis.zadd("lb:alltime", xpTotal, row.userId).catch(() => {});
  }
}

console.log("Done.");
await prisma.$disconnect();
if (redis) redis.disconnect();
process.exit(0);
