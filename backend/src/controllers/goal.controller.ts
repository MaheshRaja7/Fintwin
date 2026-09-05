import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { GoalService } from "../services/goal.service.js";

export class GoalController {
  static async getGoals(req: AuthenticatedRequest, res: Response): Promise<void> {
    const goals = await GoalService.getGoals(req.userId!);
    res.status(200).json({ status: "success", data: { goals } });
  }

  static async createGoal(req: AuthenticatedRequest, res: Response): Promise<void> {
    const goal = await GoalService.createGoal(req.userId!, req.body);
    res.status(201).json({ status: "success", message: "Goal created successfully.", data: { goal } });
  }

  static async updateGoal(req: AuthenticatedRequest, res: Response): Promise<void> {
    const goal = await GoalService.updateGoal(req.userId!, req.params.id, req.body);
    if (!goal) {
      res.status(404).json({ status: "error", message: "Goal not found." });
      return;
    }
    res.status(200).json({ status: "success", message: "Goal updated.", data: { goal } });
  }

  static async contribute(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      res.status(400).json({ status: "error", message: "Contribution amount must be greater than 0." });
      return;
    }
    const goal = await GoalService.contribute(req.userId!, req.params.id, amount);
    if (!goal) {
      res.status(404).json({ status: "error", message: "Goal not found." });
      return;
    }
    res.status(200).json({ status: "success", message: `Added ₹${amount.toLocaleString()} to ${goal.name}.`, data: { goal } });
  }

  static async deleteGoal(req: AuthenticatedRequest, res: Response): Promise<void> {
    const success = await GoalService.deleteGoal(req.userId!, req.params.id);
    if (!success) {
      res.status(404).json({ status: "error", message: "Goal not found." });
      return;
    }
    res.status(200).json({ status: "success", message: "Goal removed." });
  }
}
