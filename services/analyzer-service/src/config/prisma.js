import prismaPkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const { PrismaClient } = prismaPkg;

const globalForPrisma = globalThis;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error("DATABASE_URL is required");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma =
	globalForPrisma.prisma ||
	new PrismaClient({
		adapter,
		log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
	});

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prisma = prisma;
}

export default prisma;
