import fs from "fs/promises";
import path from "path";

const BASE_STORAGE = path.join(process.cwd(), "storage");

export async function readFileFromDisk(storagePath) {
	const absPath = path.join(BASE_STORAGE, storagePath);
	return fs.readFile(absPath, "utf-8");
}

export async function readFileContentFromStoragePath(file) {
	return readFileFromDisk(file.storagePath);
}
