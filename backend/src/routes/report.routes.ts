import { Router } from "express";
import { ReportController } from "../controllers/report.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authenticateToken);

router.get("/", ReportController.getReport);

export default router;
