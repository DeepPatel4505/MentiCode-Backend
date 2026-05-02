import prisma from "../../config/prisma.js";
import fs from "fs/promises";
import path from "path";
import { readFileContentFromStoragePath } from "../../utils/storage.js";

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
    console.log("FILE INPUT:", inputFiles);

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

        if (inputFiles.length > 0) {
            const filesData = inputFiles
                .filter(
                    (file) =>
                        typeof file?.name === "string" && file.name.trim(),
                )
                .map((file) => {
                    const safeName = file.name.trim().replace(/^[\/\\]+/, '').replace(/\.\.[\/\\]/g, '');
                    let sp = file.storagePath;
                    if (sp && sp.startsWith("inline:")) sp = null;
                    
                    return {
                        playgroundId: playground.id,
                        name: safeName,
                        language: (file.language || "plaintext").toString(),
                        storagePath: sp || `playgrounds/${playground.id}/${safeName}`,
                    };
                });

            if (filesData.length > 0) {
                await tx.file.createMany({ data: filesData });
            }
        }

        return playground;
    });

    // Write files to server storage
    if (inputFiles.length > 0) {
        const BASE_STORAGE = path.join(process.cwd(), "storage");
        const validFiles = inputFiles.filter(
            (file) => typeof file?.name === "string" && file.name.trim()
        );

        await Promise.all(
            validFiles.map(async (file) => {
                const safeName = file.name.trim().replace(/^[\/\\]+/, '').replace(/\.\.[\/\\]/g, '');
                const content = file.content || "// empty file\n";

                const storagePath = `playgrounds/${created.id}/${safeName}`;
                const absPath = path.join(BASE_STORAGE, storagePath);
                await fs.mkdir(path.dirname(absPath), { recursive: true });
                await fs.writeFile(absPath, content || "// empty file\n", "utf8");
            })
        );
    }

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

    // delete files from storage
    const BASE_STORAGE = path.join(process.cwd(), "storage");
    const playgroundStoragePath = path.join(BASE_STORAGE, "playgrounds", playgroundId);
    await fs.rm(playgroundStoragePath, { recursive: true, force: true }).catch(() => {});

    return deleted;
}
