import { Router } from "express";
import { createPlayground, listPlaygrounds, deletePlayground } from "./playground.controller.js";

const router = Router();

router.post("/playgrounds", createPlayground);
router.get("/playgrounds", listPlaygrounds);
router.delete("/playgrounds/:playgroundId", deletePlayground);

export default router;  