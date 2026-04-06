import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
});

redis.on("error",   (err) => console.error("[Redis] error:", err.message));
redis.on("connect", ()    => console.info("[Redis] connected"));

export { redis };
