import { Router } from "express";
import { BudgetController } from "../controllers/budget.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authenticateToken);

router.get("/", BudgetController.getBudgets);
router.post("/", BudgetController.setBudget);
router.delete("/:id", BudgetController.deleteBudget);

export default router;
