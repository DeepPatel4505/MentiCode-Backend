import prisma from "../../config/prisma.js";

const VALID_SOURCE_TYPES = new Set(["upload", "github"]);

function toBadRequest(message) {
	const error = new Error(message);
	error.statusCode = 400;
	return error;
}

export async function createPlaygroundForUser(userId, payload) {
	const name = payload?.name?.trim();
	const sourceType = payload?.sourceType || "upload";
	const inputFiles = Array.isArray(payload?.files) ? payload.files : [];

	if (!name) {
		throw toBadRequest("Validation failed");
	}

	if (!VALID_SOURCE_TYPES.has(sourceType)) {
		throw toBadRequest("Validation failed");
	}

	if (sourceType === "github" && !payload?.repoId) {
		throw toBadRequest("Validation failed");
	}

	const created = await prisma.$transaction(async (tx) => {
		const playground = await tx.playground.create({
			data: {
				userId,
				name,
				sourceType,
			},
			select: {
				id: true,
				name: true,
				sourceType: true,
				createdAt: true,
			},
		});

		if (sourceType === "upload" && inputFiles.length > 0) {
			const filesData = inputFiles
				.filter((file) => typeof file?.name === "string" && file.name.trim())
				.map((file) => ({
					playgroundId: playground.id,
					name: file.name.trim(),
					language: (file.language || "plaintext").toString(),
					storagePath: file.storagePath || `playgrounds/${playground.id}/${file.name.trim()}`,
				}));

			if (filesData.length > 0) {
				await tx.file.createMany({ data: filesData });
			}
		}

		return playground;
	});

	return created;
}

export async function listPlaygroundsForUser(userId) {
	return prisma.playground.findMany({
		where: { userId },
		orderBy: { createdAt: "desc" },
		select: {
			id: true,
			name: true,
			sourceType: true,
		},
	});
}
