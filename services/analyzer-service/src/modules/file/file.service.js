import prisma from "../../config/prisma.js";

function toNotFound() {
	const error = new Error("Not found");
	error.statusCode = 404;
	return error;
}

export async function listFilesForOwnedPlayground(userId, playgroundId) {
	const ownedPlayground = await prisma.playground.findFirst({
		where: {
			id: playgroundId,
			userId,
		},
		select: { id: true , name: true, sourceType: true, createdAt: true},
	});

	if (!ownedPlayground) {
		throw toNotFound();
	}
	const files = await prisma.file.findMany({
		where: {
			playgroundId,
		},
		orderBy: { createdAt: "asc" },
		select: {
			id: true,
			name: true,
			language: true,
			storagePath: true,
		},
	});

	return {playground : ownedPlayground, files};
}
