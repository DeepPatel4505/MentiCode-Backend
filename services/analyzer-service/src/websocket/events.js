import IORedis from "ioredis";
import { getRedisConfig } from "../config/redis.js";

export const JOB_EVENTS_CHANNEL = "analysis:job-events";

const redisPublisher = new IORedis(getRedisConfig());

export async function publishJobUpdate(jobId, payload) {
	if (!jobId) {
		return;
	}

	const message = JSON.stringify({
		jobId,
		payload,
		timestamp: new Date().toISOString(),
	});

	await redisPublisher.publish(JOB_EVENTS_CHANNEL, message);
}

export async function closeJobEventsPublisher() {
	if (redisPublisher.status === "end") {
		return;
	}

	await redisPublisher.quit();
}