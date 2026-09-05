import mongoose from "mongoose";
import { FinancialGoal, IFinancialGoal } from "../models/FinancialGoal.js";
import { Transaction } from "../models/Transaction.js";

export class GoalService {
  static async getGoals(userId: mongoose.Types.ObjectId) {
    const goals = await FinancialGoal.find({ userId }).sort({ targetDate: 1 }).lean();
    const now = new Date();

    return goals.map((g) => {
      const remaining = Math.max(0, g.targetAmount - g.currentAmount);
      const percentage = Math.min(100, Math.round((g.currentAmount / Math.max(1, g.targetAmount)) * 100));

      const targetDate = new Date(g.targetDate);
      const diffMs = targetDate.getTime() - now.getTime();
      const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      const monthsRemaining = Math.max(1, Math.round((diffDays / 30.4) * 10) / 10);

      const requiredMonthly = Math.round(remaining / monthsRemaining);

      return {
        ...g,
        remainingAmount: remaining,
        percentageCompleted: percentage,
        monthsRemaining,
        requiredMonthlySavings: requiredMonthly,
        onSchedule: percentage >= Math.min(95, 100 - (monthsRemaining / 12) * 100),
      };
    });
  }

  static async createGoal(
    userId: mongoose.Types.ObjectId,
    data: {
      name: string;
      targetAmount: number;
      currentAmount?: number;
      targetDate: string | Date;
      category?: string;
      color?: string;
    }
  ): Promise<IFinancialGoal> {
    return FinancialGoal.create({
      userId,
      name: data.name,
      targetAmount: data.targetAmount,
      currentAmount: data.currentAmount || 0,
      targetDate: new Date(data.targetDate),
      category: data.category || "General",
      color: data.color || "#10b981",
    });
  }

  static async updateGoal(
    userId: mongoose.Types.ObjectId,
    id: string,
    data: Partial<IFinancialGoal>
  ): Promise<IFinancialGoal | null> {
    return FinancialGoal.findOneAndUpdate({ _id: id, userId }, { $set: data }, { new: true });
  }

  static async contribute(
    userId: mongoose.Types.ObjectId,
    id: string,
    amount: number
  ): Promise<IFinancialGoal | null> {
    const goal = await FinancialGoal.findOne({ _id: id, userId });
    if (!goal) return null;

    goal.currentAmount += amount;
    if (goal.currentAmount >= goal.targetAmount) {
      goal.isCompleted = true;
    }
    await goal.save();

    // Record as saving transaction
    await Transaction.create({
      userId,
      amount,
      type: "expense",
      category: "Investment",
      subcategory: "Goal Contribution",
      merchant: goal.name,
      description: `Contributed to goal: ${goal.name}`,
      nature: "saving",
    });

    return goal;
  }

  static async deleteGoal(userId: mongoose.Types.ObjectId, id: string): Promise<boolean> {
    const res = await FinancialGoal.deleteOne({ _id: id, userId });
    return res.deletedCount > 0;
  }
}
