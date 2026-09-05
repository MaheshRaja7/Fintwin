import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { Transaction } from "../models/Transaction.js";
import { Budget } from "../models/Budget.js";
import { FinancialGoal } from "../models/FinancialGoal.js";
import { Subscription } from "../models/Subscription.js";
import { User } from "../models/User.js";
import { FinancialHealthService } from "../services/financialHealth.service.js";
import { MLClientService } from "../services/mlClient.service.js";
import { RecommendationService } from "../services/recommendation.service.js";
import { BudgetService } from "../services/budget.service.js";
import { GoalService } from "../services/goal.service.js";

export class DashboardController {
  static async getDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.userId!;
    const user = await User.findById(userId);
    const monthlyIncome = user?.monthlyIncome || 50000;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [txs, recentTxs, budgetData, goals, subscriptions, health, forecast, overspending, recs, anomalies] =
      await Promise.all([
        Transaction.find({ userId, date: { $gte: sixtyDaysAgo } }).sort({ date: 1 }).lean(),
        Transaction.find({ userId }).sort({ date: -1 }).limit(7).lean(),
        BudgetService.getBudgetsWithProgress(userId),
        GoalService.getGoals(userId),
        Subscription.find({ userId, status: { $ne: "cancelled" } }).lean(),
        FinancialHealthService.calculateHealth(userId),
        MLClientService.getExpenseForecast(userId, 30),
        MLClientService.getOverspendingRisk(userId),
        RecommendationService.getRecommendations(userId),
        MLClientService.getAnomalies(userId),
      ]);

    // Current month calculations
    const currMonthTxs = txs.filter((t) => new Date(t.date) >= startOfMonth);
    let currExpenses = 0;
    let currIncome = 0;
    const categoryTotals: Record<string, number> = {};

    currMonthTxs.forEach((t) => {
      if (t.type === "expense") {
        currExpenses += t.amount;
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      } else {
        currIncome += t.amount;
      }
    });

    const effectiveIncome = currIncome > 0 ? currIncome : monthlyIncome;
    const currentSavings = Math.max(0, effectiveIncome - currExpenses);
    const savingsRate = Math.round((currentSavings / Math.max(1, effectiveIncome)) * 100);

    // 1. Daily Spending Heatmap / Trend (last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dailyMap: Record<string, { date: string; amount: number; count: number }> = {};
    for (let i = 0; i <= 30; i++) {
      const d = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
      const dStr = d.toISOString().split("T")[0];
      dailyMap[dStr] = { date: dStr, amount: 0, count: 0 };
    }

    txs.filter((t) => t.type === "expense" && new Date(t.date) >= thirtyDaysAgo).forEach((t) => {
      const dStr = new Date(t.date).toISOString().split("T")[0];
      if (dailyMap[dStr]) {
        dailyMap[dStr].amount += t.amount;
        dailyMap[dStr].count += 1;
      }
    });

    const dailySpendingTrend = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    // 2. Category Distribution (for Donut Chart)
    const categoryDistribution = Object.entries(categoryTotals)
      .map(([name, value]) => ({
        name,
        value: Math.round(value),
        percentage: Math.round((value / Math.max(1, currExpenses)) * 100),
      }))
      .sort((a, b) => b.value - a.value);

    // 3. Income vs Expense Trend (monthly comparison)
    const monthlyComparison = [
      {
        month: "Previous Month",
        income: monthlyIncome,
        expenses: Math.round(txs.filter((t) => t.type === "expense" && new Date(t.date) < startOfMonth).reduce((a, b) => a + b.amount, 0) || (monthlyIncome * 0.65)),
        savings: Math.round(monthlyIncome * 0.35),
      },
      {
        month: "Current Month",
        income: effectiveIncome,
        expenses: Math.round(currExpenses),
        savings: currentSavings,
      },
    ];

    // Smart Notifications & Risk Alerts
    const alerts = [];
    if (overspending.overall?.risk === "HIGH") {
      alerts.push({
        id: "alert-overspend",
        type: "warning",
        title: "High Budget Overspending Risk",
        message: overspending.overall.message,
        probability: overspending.overall.probability,
      });
    }

    if (anomalies.anomalies && anomalies.anomalies.length > 0) {
      const topAnomaly = anomalies.anomalies[0];
      alerts.push({
        id: "alert-anomaly",
        type: "info",
        title: "Unusual Spending Detected",
        message: `₹${topAnomaly.amount.toLocaleString()} on ${topAnomaly.merchant || topAnomaly.category} (${topAnomaly.multiplier}× typical).`,
      });
    }

    if (health.score < 65) {
      alerts.push({
        id: "alert-health",
        type: "warning",
        title: "Financial Health Advisory",
        message: health.summary,
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        cards: {
          totalBalance: currentSavings * 4 + 25000,
          monthlyIncome: effectiveIncome,
          monthlyExpenses: Math.round(currExpenses),
          monthlySavings: currentSavings,
          savingsRate,
          financialHealth: {
            score: health.score,
            rating: health.rating,
            summary: health.summary,
          },
        },
        forecastSummary: {
          todaySpending: forecast.todaySpending,
          averageDailySpending: forecast.averageDailySpending,
          projectedDailySpending: forecast.projectedDailySpending,
          predictedMonthEndExpense: forecast.predictedMonthEndExpense,
          confidence: forecast.confidence,
          likelyRange: forecast.predictedRange,
          modelName: forecast.modelName,
        },
        overspendingRisk: overspending.overall,
        dailySpendingTrend,
        categoryDistribution,
        incomeVsExpense: monthlyComparison,
        budgets: budgetData.budgets,
        budgetSummary: budgetData.summary,
        goals: goals.slice(0, 3),
        subscriptions: {
          count: subscriptions.length,
          monthlyTotal: subscriptions.reduce((sum, s) => sum + s.amount, 0),
          items: subscriptions.slice(0, 4),
        },
        recommendations: recs.slice(0, 3),
        recentTransactions: recentTxs,
        alerts,
        needVsWant: health.needVsWant,
      },
    });
  }
}
