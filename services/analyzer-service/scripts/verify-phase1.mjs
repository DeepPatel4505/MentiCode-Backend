import "dotenv/config";
import prismaPkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const { PrismaClient } = prismaPkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const userA = "11111111-1111-1111-1111-111111111111";
const userB = "22222222-2222-2222-2222-222222222222";

async function cleanup() {
    await prisma.analysisResult.deleteMany({});
    await prisma.analysisJob.deleteMany({});
    await prisma.file.deleteMany({});
    await prisma.playground.deleteMany({
        where: {
            userId: {
                in: [userA, userB],
            },
        },
    });
}

async function run() {
    await cleanup();

    const playgroundA = await prisma.playground.create({
        data: {
            userId: userA,
            name: "User A Playground",
            sourceType: "upload",
        },
    });

    const playgroundB = await prisma.playground.create({
        data: {
            userId: userB,
            name: "User B Playground",
            sourceType: "upload",
        },
    });

    const fileA = await prisma.file.create({
        data: {
            playgroundId: playgroundA.id,
            name: "a.js",
            language: "javascript",
            storagePath: `playgrounds/${playgroundA.id}/a.js`,
        },
    });

    const fileB = await prisma.file.create({
        data: {
            playgroundId: playgroundB.id,
            name: "b.js",
            language: "javascript",
            storagePath: `playgrounds/${playgroundB.id}/b.js`,
        },
    });

    const jobA = await prisma.analysisJob.create({
        data: {
            fileId: fileA.id,
            status: "pending",
        },
    });

    await prisma.analysisResult.create({
        data: {
            jobId: jobA.id,
            summary: { riskLevel: "low", overallQuality: 90 },
            findings: [],
        },
    });

    const ownedByA = await prisma.file.findFirst({
        where: {
            id: fileA.id,
            playground: { userId: userA },
        },
        select: { id: true },
    });

    const crossUserAccess = await prisma.file.findFirst({
        where: {
            id: fileB.id,
            playground: { userId: userA },
        },
        select: { id: true },
    });

    await prisma.playground.delete({
        where: { id: playgroundA.id },
    });

    const deletedFile = await prisma.file.findUnique({ where: { id: fileA.id } });
    const deletedJob = await prisma.analysisJob.findUnique({ where: { id: jobA.id } });
    const deletedResult = await prisma.analysisResult.findFirst({ where: { jobId: jobA.id } });

    const report = {
        ownershipOk: Boolean(ownedByA),
        crossUserHidden: crossUserAccess === null,
        cascadeFiles: deletedFile === null,
        cascadeJobs: deletedJob === null,
        cascadeResults: deletedResult === null,
    };

    console.log(JSON.stringify(report, null, 2));

    await cleanup();
}

run()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
