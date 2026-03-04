import { Router } from "express";
import { createPlayground, listPlaygrounds } from "./playground.controller.js";

const router = Router();

router.post("/playgrounds", createPlayground);
router.get("/playgrounds", listPlaygrounds);

export default router;  