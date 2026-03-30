/**
 * Production gamification utilities.
 *
 * All XP, streak, and leaderboard state is maintained in two places:
 *   1. PostgreSQL `UserStats` — source of truth, updated in the same DB transaction
 *      as the activity that triggered the change.
 *   2. Redis — fast read layer:
 *        - Sorted set  `lb:alltime`          → leaderboard (ZADD userId score=xpTotal)
 *        - Hash        `activity:<userId>`   → calendar map { "YYYY-MM-DD": count }
 *
 * Redis is a cache — if it goes down, reads fall back to DB.
 */

import { prisma } from "../config/prisma.js";
import { redis }  from "../config/redis.js";

const LEADERBOARD_KEY = "lb:alltime";
const activityKey = (userId) => `activity:${userId}`;

// ── Date helpers ──────────────────────────────────────────────

export function toDateStr(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

// ── XP level thresholds

const XP_THRESHOLDS = [0, 100, 250, 500, 900, 1400, 2000, 2800, 3800, 5000];

export function getLevelFromXp(xp) {
  let level = 1;
  for (let i = 0; i < XP_THRESHOLDS.length; i++) {
    if (xp >= XP_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return Math.min(level, 10);
}

// ── Core: update stats after any activity ─────────────────────
//
// Call this inside the SAME prisma.$transaction that records the activity.
// `tx`        — the Prisma transaction client
// `userId`    — the user who performed the activity
// `xpDelta`   — XP to add (0 for lesson completions that don't award XP)
// `activityAt`— Date of the activity (defaults to now)

export async function recordActivity(tx, userId, xpDelta = 0, activityAt = new Date()) {
  const today     = toDateStr(activityAt);
  const yesterday = toDateStr(new Date(activityAt.getTime() - 86400000));

  // Fetch or create UserStats
  const existing = await tx.userStats.findUnique({ where: { userId } });

  let currentStreak = existing?.currentStreak ?? 0;
  let longestStreak = existing?.longestStreak ?? 0;
  const lastDate    = existing?.lastActivityAt ? toDateStr(existing.lastActivityAt) : null;

  // Update streak
  if (lastDate === today) {
    // Same day — streak unchanged, but still update lastActivityAt timestamp
  } else if (lastDate === yesterday) {
    // Consecutive day
    currentStreak += 1;
    if (currentStreak > longestStreak) longestStreak = currentStreak;
  } else {
    // Streak broken or first activity
    currentStreak = 1;
    if (longestStreak === 0) longestStreak = 1;
  }

  const newXpTotal = (existing?.xpTotal ?? 0) + xpDelta;

  // Upsert UserStats in the transaction
  await tx.userStats.upsert({
    where:  { userId },
    create: {
      userId,
      xpTotal:        newXpTotal,
      currentStreak,
      longestStreak,
      lastActivityAt: activityAt,
    },
    update: {
      xpTotal:        { increment: xpDelta },
      currentStreak,
      longestStreak,
      lastActivityAt: activityAt,
    },
  });

  // ── Redis updates (fire-and-forget, non-blocking) ─────────
  // These run after the DB transaction commits — wrapped in a
  // separate async block so a Redis failure never rolls back the DB write.
  setImmediate(async () => {
    try {
      await Promise.all([
        // Leaderboard sorted set — always set to newXpTotal (GT semantics via computed value)
        xpDelta > 0
          ? redis.zadd(LEADERBOARD_KEY, newXpTotal, userId).catch(() => {})
          : Promise.resolve(),

        // Activity calendar hash: HINCRBY activity:<userId> YYYY-MM-DD 1
        redis.hincrby(activityKey(userId), today, 1).catch(() => {}),
      ]);
    } catch (_) {}
  });

  return { currentStreak, longestStreak, xpTotal: newXpTotal };
}

// ── Leaderboard read ──────────────────────────────────────────

export async function getLeaderboardData(limit = 50) {
  // Try Redis first
  try {
    const raw = await redis.zrevrange(LEADERBOARD_KEY, 0, limit - 1, "WITHSCORES");
    if (raw.length > 0) {
      const entries = [];
      for (let i = 0; i < raw.length; i += 2) {
        entries.push({ userId: raw[i], xpTotal: parseInt(raw[i+1], 10) });
      }
      return { entries, fromCache: true };
    }
  } catch (_) {}

  // Try UserStats DB
  const statsRows = await prisma.userStats.findMany({
    orderBy: { xpTotal: "desc" },
    take: limit,
    select: { userId: true, xpTotal: true },
  });

  if (statsRows.length > 0) {
    // Backfill Redis with non-zero entries
    const nonZero = statsRows.filter((r) => r.xpTotal > 0);
    if (nonZero.length > 0) {
      const args = nonZero.flatMap((r) => [r.xpTotal, r.userId]);
      redis.zadd(LEADERBOARD_KEY, ...args).catch(() => {});
    }
    return { entries: statsRows, fromCache: false };
  }

  // UserStats empty — fall back to Enrollment aggregation
  const rows = await prisma.enrollment.groupBy({
    by: ["userId"],
    _sum: { xpEarned: true },
    orderBy: { _sum: { xpEarned: "desc" } },
    take: limit,
  });

  const entries = rows.map((r) => ({ userId: r.userId, xpTotal: r._sum.xpEarned ?? 0 }));

  // Backfill UserStats and Redis from enrollment data
  for (const e of entries) {
    prisma.userStats.upsert({
      where:  { userId: e.userId },
      create: { userId: e.userId, xpTotal: e.xpTotal },
      update: { xpTotal: e.xpTotal },
    }).catch(() => {});
    if (e.xpTotal > 0) {
      redis.zadd(LEADERBOARD_KEY, e.xpTotal, e.userId).catch(() => {});
    }
  }

  return { entries, fromCache: false };
}

// ── Activity calendar read ────────────────────────────────────

export async function getActivityCalendar(userId) {
  // Try Redis hash first
  try {
    const raw = await redis.hgetall(activityKey(userId));
    if (raw && Object.keys(raw).length > 0) {
      return Object.fromEntries(
        Object.entries(raw).map(([k, v]) => [k, parseInt(v, 10)])
      );
    }
  } catch (_) {}

  // Redis miss — rebuild from DB
  const [lessonDates, levelDates] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: { isCompleted: true, enrollment: { userId }, completedAt: { not: null } },
      select: { completedAt: true },
    }),
    prisma.levelAttempt.findMany({
      where: { isPassed: true, enrollment: { userId }, finishedAt: { not: null } },
      select: { finishedAt: true },
    }),
  ]);

  const countMap = {};
  for (const r of lessonDates) {
    if (!r.completedAt) continue;
    const d = toDateStr(r.completedAt);
    countMap[d] = (countMap[d] ?? 0) + 1;
  }
  for (const r of levelDates) {
    if (!r.finishedAt) continue;
    const d = toDateStr(r.finishedAt);
    countMap[d] = (countMap[d] ?? 0) + 1;
  }

  // Backfill Redis
  if (Object.keys(countMap).length > 0) {
    const args = Object.entries(countMap).flatMap(([k, v]) => [k, v]);
    redis.hset(activityKey(userId), ...args).catch(() => {});
  }

  return countMap;
}

// ── Streak read (from UserStats) ──────────────────────────────

export async function getUserStats(userId) {
  const stats = await prisma.userStats.findUnique({ where: { userId } });
  if (!stats) return { xpTotal: 0, currentStreak: 0, longestStreak: 0, lastActivityAt: null };

  // Validate streak is still active (not broken since last activity)
  const today     = toDateStr(new Date());
  const yesterday = toDateStr(new Date(Date.now() - 86400000));
  const lastDate  = stats.lastActivityAt ? toDateStr(stats.lastActivityAt) : null;

  const currentStreak = (lastDate === today || lastDate === yesterday)
    ? stats.currentStreak
    : 0;

  return {
    xpTotal:        stats.xpTotal,
    currentStreak,
    longestStreak:  stats.longestStreak,
    lastActivityAt: stats.lastActivityAt,
  };
}
