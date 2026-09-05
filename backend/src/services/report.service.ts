import mongoose from "mongoose";
import { Transaction } from "../models/Transaction.js";
import { Budget } from "../models/Budget.js";
import { FinancialGoal } from "../models/FinancialGoal.js";
import { Subscription } from "../models/Subscription.js";
import { FinancialHealthService } from "./financialHealth.service.js";
import { MLClientService } from "./mlClient.service.js";
import { RecommendationService } from "./recommendation.service.js";
import { User } from "../models/User.js";

export class ReportService {
  static async generateReport(
    userId: mongoose.Types.ObjectId,
    periodType: "weekly" | "monthly" | "quarterly"
  ) {
    const user = await User.findById(userId);
    const now = new Date();
    let startDate: Date;
    let periodTitle = "";

    if (periodType === "weekly") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      periodTitle = `Weekly Intelligence Briefing (${startDate.toLocaleDateString("en-IN", { month: "short", day: "numeric" })} - ${now.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })})`;
    } else if (periodType === "quarterly") {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      periodTitle = `Quarterly Financial Performance Review (${now.getFullYear()} Q${Math.floor(now.getMonth() / 3) + 1})`;
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      periodTitle = `Monthly Financial Statement (${now.toLocaleDateString("en-IN", { month: "long", year: "numeric" })})`;
    }

    const [txs, budgets, goals, subscriptions, health, forecast, anomalies, recs] = await Promise.all([
      Transaction.find({ userId, date: { $gte: startDate } }).sort({ date: -1 }).lean(),
      Budget.find({ userId }).lean(),
      FinancialGoal.find({ userId }).lean(),
      Subscription.find({ userId, status: { $ne: "cancelled" } }).lean(),
      FinancialHealthService.calculateHealth(userId),
      MLClientService.getExpenseForecast(userId, 30),
      MLClientService.getAnomalies(userId),
      RecommendationService.getRecommendations(userId),
    ]);

    let totalExpense = 0;
    let totalIncome = 0;
    const categoryBreakdown: Record<string, number> = {};

    txs.forEach((t) => {
      if (t.type === "expense") {
        totalExpense += t.amount;
        categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
      } else {
        totalIncome += t.amount;
      }
    });

    const netSavings = Math.max(0, totalIncome - totalExpense);
    const savingsRate = Math.round((netSavings / Math.max(1, totalIncome)) * 100);

    const sortedCategories = Object.entries(categoryBreakdown)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: Math.round((amount / Math.max(1, totalExpense)) * 100),
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      metadata: {
        reportId: `REP-${Date.now().toString(36).toUpperCase()}`,
        generatedAt: now.toISOString(),
        userName: user?.fullName || "Valued FinTwin User",
        email: user?.email,
        currency: user?.currency || "INR",
        periodType,
        periodTitle,
      },
      summary: {
        totalIncome: Math.round(totalIncome),
        totalExpense: Math.round(totalExpense),
        netSavings: Math.round(netSavings),
        savingsRate,
        financialHealthScore: health.score,
        healthRating: health.rating,
      },
      topCategories: sortedCategories.slice(0, 6),
      budgetAdherence: budgets.map((b) => {
        const spent = categoryBreakdown[b.category] || 0;
        return {
          category: b.category,
          limit: b.limit,
          spent: Math.round(spent),
          utilization: Math.round((spent / Math.max(1, b.limit)) * 100),
        };
      }),
      forecastSnippet: {
        modelName: forecast.modelName,
        confidence: forecast.confidence,
        projectedMonthEnd: forecast.predictedMonthEndExpense,
        likelyRange: forecast.predictedRange,
      },
      anomaliesSnippet: anomalies.anomalies?.slice(0, 3) || [],
      recommendationsSnippet: recs.slice(0, 3).map((r) => ({
        title: r.title,
        problem: r.problem,
        suggestedAction: r.suggestedAction,
        estimatedMonthlySaving: r.estimatedMonthlySaving,
        priority: r.priority,
      })),
      goalsSnippet: goals.map((g) => ({
        name: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        progress: Math.round((g.currentAmount / Math.max(1, g.targetAmount)) * 100),
      })),
      subscriptionsSnippet: {
        count: subscriptions.length,
        monthlyTotal: subscriptions.reduce((sum, s) => sum + (s.billingCycle === "yearly" ? s.amount / 12 : s.amount), 0),
      },
    };
  }
}
