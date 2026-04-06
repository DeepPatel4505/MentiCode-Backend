import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { analysisQueue } from "../queues/analysis.queue.js";

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
	queues: [new BullMQAdapter(analysisQueue)],
	serverAdapter,
});

export const queueAdminRouter = serverAdapter.getRouter();