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
                .filter(
                    (file) =>
                        typeof file?.name === "string" && file.name.trim(),
                )
                .map((file) => ({
                    playgroundId: playground.id,
                    name: file.name.trim(),
                    language: (file.language || "plaintext").toString(),
                    storagePath:
                        file.storagePath ||
                        `playgrounds/${playground.id}/${file.name.trim()}`,
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
    const playgrounds = await prisma.playground.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            sourceType: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    //for each playground, get the count of files with major language types (javascript, python, java, etc.)
    const playgroundsWithFileCounts = await Promise.all(
        playgrounds.map(async (pg) => {
            const fileCounts = await prisma.file.groupBy({
                where: { playgroundId: pg.id },
                by: ["language"],
                _count: { language: true },
            });
            //apend the language type to playground object with count
            const languageCounts = {};
            fileCounts.forEach((fc) => {
                languageCounts[fc.language] = fc._count.language;
            });
            return { ...pg, fileCounts: languageCounts };
        }),
    );

    return playgroundsWithFileCounts;
}

export async function deletePlaygroundForUser(userId, playgroundId) {
    const playground = await prisma.playground.findFirst({
        where: { id: playgroundId, userId },
    });

    //clean up files associated with the playground
    // - in future when files are not stored in DB but in external storage (e.g., S3),
    // - we can do the cleanup here by calling the storage service to delete the files
    // const filesToDelete = await prisma.file.findMany({
    //     where: { playgroundId },
    //     select: { storagePath: true },
    // });

    if (!playground) {
        throw new Error("Not found or unauthorized");
    }

    // delete playground (DB-level cascade will delete related files, jobs, results)
    const deleted = await prisma.playground.delete({
        where: { id: playgroundId },
    });

    //files cleanup - in future when files are not stored in DB but in external storage (e.g., S3),
    // we can do the cleanup here by calling the storage service to delete the files

    // for (const file of filesToDelete) {
    //     const filePath = file.storagePath;
    //     //delete file from storage (e.g., S3)
    //     //await deleteFileFromStorage(filePath);
    // }
    return deleted;
}
