import IORedis from "ioredis";

export function getRedisConfig() {
	return {
		host: process.env.REDIS_HOST || "localhost",
		port: Number(process.env.REDIS_PORT || 6379),
		maxRetriesPerRequest: null,
		retryStrategy: (attempt) => Math.min(attempt * 200, 3000),
	};
}

export const redisConnection = new IORedis(getRedisConfig());
