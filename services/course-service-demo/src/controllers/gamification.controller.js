import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  getLeaderboardData,
  getUserStats,
  getActivityCalendar,
  getLevelFromXp,
  toDateStr,
} from "../utils/gamification.utils.js";

// ─── GET /api/v1/leaderboard ──────────────────────────────────
export const getLeaderboard = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit ?? "50", 10), 100);

  const { entries } = await getLeaderboardData(limit);

  // Fetch usernames from auth service in bulk
  let userMap = {};
  try {
    const ids = entries.map((r) => r.userId).join(",");
    if (ids) {
      const axios = (await import("axios")).default;
      const { data } = await axios.get(
        `${process.env.USER_SERVICE_URL}/api/v1/auth/users/bulk?ids=${ids}`,
        { timeout: 2000 }
      );
      for (const u of data?.data?.users ?? []) userMap[u.id] = u;
    }
  } catch (_) {}

  const leaderboard = entries.map((row, idx) => {
    const user = userMap[row.userId] ?? {};
    return {
      rank:      idx + 1,
      userId:    row.userId,
      username:  user.username  ?? `user_${row.userId.slice(0, 6)}`,
      avatarUrl: user.avatarUrl ?? "",
      xpTotal:   row.xpTotal,
      level:     getLevelFromXp(row.xpTotal),
    };
  });

  return res.status(200).json(
    new ApiResponse(200, { leaderboard }, "Leaderboard fetched successfully")
  );
});

// ─── GET /api/v1/streak ───────────────────────────────────────
export const getMyStreak = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [stats, calendar] = await Promise.all([
    getUserStats(userId),
    getActivityCalendar(userId),
  ]);

  const cutoff = toDateStr(new Date(Date.now() - 365 * 86400000));
  const recentCalendar = Object.fromEntries(
    Object.entries(calendar).filter(([d]) => d >= cutoff)
  );

  const totalActiveDays = Object.keys(recentCalendar).length;

  return res.status(200).json(
    new ApiResponse(200, {
      currentStreak:   stats.currentStreak,
      longestStreak:   stats.longestStreak,
      lastActivityAt:  stats.lastActivityAt,
      xpTotal:         stats.xpTotal,
      totalActiveDays,
      calendar:        recentCalendar,
    }, "Streak fetched successfully")
  );
});
