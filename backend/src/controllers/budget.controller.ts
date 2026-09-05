import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { BudgetService } from "../services/budget.service.js";

export class BudgetController {
  static async getBudgets(req: AuthenticatedRequest, res: Response): Promise<void> {
    const data = await BudgetService.getBudgetsWithProgress(req.userId!);
    res.status(200).json({
      status: "success",
      data,
    });
  }

  static async setBudget(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { category, limit, period } = req.body;
    const budget = await BudgetService.setBudget(req.userId!, category, limit, period);
    res.status(200).json({
      status: "success",
      message: "Budget limit saved.",
      data: { budget },
    });
  }

  static async deleteBudget(req: AuthenticatedRequest, res: Response): Promise<void> {
    const success = await BudgetService.deleteBudget(req.userId!, req.params.id);
    if (!success) {
      res.status(404).json({ status: "error", message: "Budget not found." });
      return;
    }
    res.status(200).json({ status: "success", message: "Budget removed." });
  }
}
