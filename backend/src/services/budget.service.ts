import mongoose from "mongoose";
import { Budget, IBudget } from "../models/Budget.js";
import { Transaction } from "../models/Transaction.js";

export class BudgetService {
  static async getBudgetsWithProgress(userId: mongoose.Types.ObjectId) {
    const budgets = await Budget.find({ userId }).sort({ limit: -1 }).lean();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysPassed = Math.max(1, now.getDate());
    const daysRemaining = Math.max(1, totalDaysInMonth - now.getDate());

    const txs = await Transaction.find({
      userId,
      type: "expense",
      date: { $gte: startOfMonth },
    }).lean();

    const categorySpending: Record<string, number> = {};
    for (const t of txs) {
      categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
    }

    let totalBudgetLimit = 0;
    let totalSpent = 0;

    const items = budgets.map((b) => {
      const spent = categorySpending[b.category] || 0;
      const utilization = Math.round((spent / Math.max(1, b.limit)) * 100);
      const remaining = Math.max(0, b.limit - spent);

      // Spending pace projection
      const dailyPace = spent / daysPassed;
      const projectedMonthEnd = Math.round(spent + dailyPace * daysRemaining);
      const projectedOverspend = projectedMonthEnd > b.limit;

      let status: "safe" | "warning" | "exceeded" = "safe";
      if (utilization >= 100) {
        status = "exceeded";
      } else if (utilization >= 80 || projectedOverspend) {
        status = "warning";
      }

      totalBudgetLimit += b.limit;
      totalSpent += spent;

      return {
        ...b,
        spent: Math.round(spent),
        remaining: Math.round(remaining),
        utilization,
        status,
        projectedMonthEnd,
        projectedOverspend,
        dailyPace: Math.round(dailyPace),
        daysRemaining,
      };
    });

    const overallUtilization = Math.round((totalSpent / Math.max(1, totalBudgetLimit)) * 100);

    return {
      budgets: items,
      summary: {
        totalLimit: totalBudgetLimit,
        totalSpent: Math.round(totalSpent),
        totalRemaining: Math.max(0, totalBudgetLimit - totalSpent),
        overallUtilization,
        daysRemaining,
      },
    };
  }

  static async setBudget(
    userId: mongoose.Types.ObjectId,
    category: string,
    limit: number,
    period: "monthly" | "yearly" = "monthly"
  ): Promise<IBudget> {
    return Budget.findOneAndUpdate(
      { userId, category },
      { userId, category, limit, period },
      { upsert: true, new: true }
    );
  }

  static async deleteBudget(userId: mongoose.Types.ObjectId, id: string): Promise<boolean> {
    const res = await Budget.deleteOne({ _id: id, userId });
    return res.deletedCount > 0;
  }
}
