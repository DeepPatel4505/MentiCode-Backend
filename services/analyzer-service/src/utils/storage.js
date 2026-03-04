export function readFileContentFromStoragePath(file) {
	if (typeof file?.storagePath === "string" && file.storagePath.startsWith("inline://")) {
		return decodeURIComponent(file.storagePath.slice("inline://".length));
	}

	throw new Error("File content unavailable in storage");
}
