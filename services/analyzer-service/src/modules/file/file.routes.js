import { Router } from "express";
import { listFiles,getFileContent } from "./file.controller.js";

const router = Router();

router.get("/playgrounds/:playgroundId/files", listFiles);
router.get("/files/:fileId/content", getFileContent);

export default router;
