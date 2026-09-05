import { Router } from "express";
import { GoalController } from "../controllers/goal.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authenticateToken);

router.get("/", GoalController.getGoals);
router.post("/", GoalController.createGoal);
router.put("/:id", GoalController.updateGoal);
router.post("/:id/contribute", GoalController.contribute);
router.delete("/:id", GoalController.deleteGoal);

export default router;
