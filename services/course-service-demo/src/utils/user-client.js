import axios from "axios";
import { redis } from "../config/redis.js";

const PLAN_PREFIX = "user:plan:";
const TTL = parseInt(process.env.REDIS_PLAN_CACHE_TTL ?? "300", 10);

// Returns the user's plan ("free" | "pro") from user-service.
// Caches result in Redis to avoid hitting user-service on every request.
export const getUserPlan = async (userId, authHeader) => {
  const key = `${PLAN_PREFIX}${userId}`;

  try {
    const cached = await redis.get(key);
    if (cached) return cached;
  } catch (_) {
    // Redis down — fall through to HTTP call
  }

  const { data } = await axios.get(
    `${process.env.USER_SERVICE_URL}/api/v1/auth/me`,
    { headers: { Authorization: authHeader }, timeout: 3000 }
  );

  const plan = data?.data?.user?.plan ?? "free";

  try {
    await redis.set(key, plan, "EX", TTL);
  } catch (_) {}

  return plan;
};

export const invalidatePlanCache = async (userId) => {
  try {
    await redis.del(`${PLAN_PREFIX}${userId}`);
  } catch (_) {}
};
