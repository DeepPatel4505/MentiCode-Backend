import { readFileContentFromStoragePath } from "../../utils/storage.js";
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
        select: { id: true, name: true, sourceType: true, createdAt: true },
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

    return { playground: ownedPlayground, files };
}

export async function getFileContentForUser(userId, fileId) {
    const file = await prisma.file.findFirst({
        where: {
            id: fileId,
            playground: {
                userId,
            },
        },
        select: {
            id: true,
            name: true,
            language: true,
            storagePath: true,
			playgroundId: true,
        },
    });

    if (!file) {
        const err = new Error("File not found");
        err.statusCode = 404;
        throw err;
    }
    console.log(
        "Found file for user:",
        userId,
        "File ID:",
        fileId,
        "Storage Path:",
        file.storagePath,
    );
    const content = await readFileContentFromStoragePath({
        storagePath: file.storagePath.startsWith("playgrounds/")
            ? file.storagePath
            : `playgrounds/${file.playgroundId}/${file.storagePath}`,
    });

    return {
        ...file,
        content,
    };
}
