import { Router } from "express";
import { listFiles } from "./file.controller.js";

const router = Router();

router.get("/playgrounds/:playgroundId/files", listFiles);

export default router;
