import { Router } from "express";
import { PredictionController } from "../controllers/prediction.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authenticateToken);

router.get("/forecast", PredictionController.getForecast);
router.get("/overspending", PredictionController.getOverspendingRisk);
router.get("/anomalies", PredictionController.getAnomalies);
router.get("/financial-health", PredictionController.getFinancialHealth);

export default router;
