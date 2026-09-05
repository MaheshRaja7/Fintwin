import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticateToken);
router.get("/", DashboardController.getDashboard);

export default router;
