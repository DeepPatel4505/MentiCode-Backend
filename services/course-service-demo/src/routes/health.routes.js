import { Router } from "express";
import { ApiResponse } from "../utils/api-response.js";

const router = Router();

router.get("/", (_req, res) => {
  return res.status(200).json(
    new ApiResponse(200, { service: "course-service", status: "ok" }, "Health check passed")
  );
});

export default router;
