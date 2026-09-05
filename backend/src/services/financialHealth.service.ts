import mongoose from "mongoose";
import { Transaction } from "../models/Transaction.js";
import { Budget } from "../models/Budget.js";
import { FinancialGoal } from "../models/FinancialGoal.js";
import { User } from "../models/User.js";
import { FinancialSnapshot } from "../models/FinancialSnapshot.js";

export interface FinancialHealthResult {
  score: number;
  rating: "Excellent" | "Good" | "Fair" | "Needs Attention";
  summary: string;
  positiveDrivers: string[];
  negativeDrivers: string[];
  breakdown: {
    savingsRate: { score: number; label: string; actualPercent: number };
    budgetDiscipline: { score: number; label: string; actualAdherence: number };
    expenseStability: { score: number; label: string };
    debtBurden: { score: number; label: string; dtiRatio: number };
    emergencyFund: { score: number; label: string; monthsCovered: number };
    goalProgress: { score: number; label: string; averageProgress: number };
    spendingGrowth: { score: number; label: string; growthRate: number };
  };
  needVsWant: {
    needs: number;
    wants: number;
    savings: number;
    debt: number;
  };
}

export class FinancialHealthService {
  static async calculateHealth(userId: mongoose.Types.ObjectId): Promise<FinancialHealthResult> {
    const user = await User.findById(userId);
    const monthlyIncome = user?.monthlyIncome || 50000;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.monthIndex !== undefined ? (now as any).monthIndex : now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Current month transactions
    const [currTxs, prevTxs, budgets, goals] = await Promise.all([
      Transaction.find({ userId, date: { $gte: startOfMonth } }).lean(),
      Transaction.find({ userId, date: { $gte: startOfPrevMonth, $lte: endOfPrevMonth } }).lean(),
      Budget.find({ userId }).lean(),
      FinancialGoal.find({ userId }).lean(),
    ]);

    // Current month totals
    let currentExpense = 0;
    let currentIncome = 0;
    let needsSum = 0;
    let wantsSum = 0;
    let savingsSum = 0;
    let debtSum = 0;

    for (const t of currTxs) {
      if (t.type === "expense") {
        currentExpense += t.amount;
        if (t.nature === "need") needsSum += t.amount;
        else if (t.nature === "want") wantsSum += t.amount;
        else if (t.nature === "debt") debtSum += t.amount;
        else savingsSum += t.amount;
      } else {
        currentIncome += t.amount;
      }
    }

    const effectiveIncome = currentIncome > 0 ? currentIncome : monthlyIncome;
    const currentSavings = Math.max(0, effectiveIncome - currentExpense);

    // 1. Savings Rate Score (0 - 20)
    const actualSavingsRate = (currentSavings / Math.max(1, effectiveIncome)) * 100;
    let savingsScore = 0;
    let savingsLabel = "Poor";
    if (actualSavingsRate >= 25) {
      savingsScore = 20;
      savingsLabel = "Excellent";
    } else if (actualSavingsRate >= 15) {
      savingsScore = 16;
      savingsLabel = "Good";
    } else if (actualSavingsRate >= 10) {
      savingsScore = 12;
      savingsLabel = "Moderate";
    } else if (actualSavingsRate > 0) {
      savingsScore = 7;
      savingsLabel = "Low";
    }

    // 2. Budget Discipline (0 - 20)
    let budgetScore = 15;
    let budgetAdherence = 85;
    if (budgets.length > 0) {
      let totalBudgetLimit = 0;
      let totalOverspentAmount = 0;

      for (const b of budgets) {
        totalBudgetLimit += b.limit;
        const spentInCat = currTxs
          .filter((t) => t.type === "expense" && t.category === b.category)
          .reduce((acc, t) => acc + t.amount, 0);
        if (spentInCat > b.limit) {
          totalOverspentAmount += spentInCat - b.limit;
        }
      }

      if (totalBudgetLimit > 0) {
        const overspentRatio = totalOverspentAmount / totalBudgetLimit;
        budgetScore = Math.max(2, Math.round(20 * (1 - overspentRatio)));
        budgetAdherence = Math.max(0, Math.min(100, Math.round((1 - overspentRatio) * 100)));
      }
    }
    const budgetLabel = budgetScore >= 16 ? "High Discipline" : budgetScore >= 10 ? "Moderate" : "Overspending Risk";

    // 3. Expense Stability (0 - 15)
    let stabilityScore = 12;
    let stabilityLabel = "Stable";
    if (currTxs.length >= 10) {
      const dailyMap: Record<string, number> = {};
      currTxs.filter((t) => t.type === "expense").forEach((t) => {
        const dStr = new Date(t.date).toISOString().split("T")[0];
        dailyMap[dStr] = (dailyMap[dStr] || 0) + t.amount;
      });
      const dailyVals = Object.values(dailyMap);
      if (dailyVals.length > 2) {
        const mean = dailyVals.reduce((a, b) => a + b, 0) / dailyVals.length;
        const variance = dailyVals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / dailyVals.length;
        const cv = Math.sqrt(variance) / Math.max(1, mean); // coefficient of variation
        if (cv < 0.6) {
          stabilityScore = 15;
          stabilityLabel = "Highly Predictable";
        } else if (cv < 1.2) {
          stabilityScore = 11;
          stabilityLabel = "Normal Fluctuations";
        } else {
          stabilityScore = 6;
          stabilityLabel = "Volatile Spikes";
        }
      }
    }

    // 4. Debt Burden (0 - 15)
    const dtiRatio = (debtSum / Math.max(1, effectiveIncome)) * 100;
    let debtScore = 15;
    let debtLabel = "No Debt";
    if (dtiRatio > 40) {
      debtScore = 4;
      debtLabel = "High Burden";
    } else if (dtiRatio > 20) {
      debtScore = 9;
      debtLabel = "Moderate Debt";
    } else if (dtiRatio > 0) {
      debtScore = 13;
      debtLabel = "Low Debt";
    }

    // 5. Emergency Fund (0 - 15)
    const estimatedLiquidSavings = currentSavings * 3.5; // proxy or based on user profile
    const monthsCovered = Math.round((estimatedLiquidSavings / Math.max(1000, currentExpense)) * 10) / 10;
    let emergencyScore = 10;
    let emergencyLabel = "Adequate";
    if (monthsCovered >= 6) {
      emergencyScore = 15;
      emergencyLabel = "Optimal (6+ mos)";
    } else if (monthsCovered >= 3) {
      emergencyScore = 12;
      emergencyLabel = "Healthy (3-6 mos)";
    } else if (monthsCovered >= 1) {
      emergencyScore = 8;
      emergencyLabel = "Low (<3 mos)";
    } else {
      emergencyScore = 4;
      emergencyLabel = "Critical";
    }

    // 6. Goal Progress (0 - 15)
    let goalScore = 12;
    let averageProgress = 50;
    if (goals.length > 0) {
      const sumPct = goals.reduce((acc, g) => acc + Math.min(100, (g.currentAmount / Math.max(1, g.targetAmount)) * 100), 0);
      averageProgress = Math.round(sumPct / goals.length);
      goalScore = Math.max(4, Math.round((averageProgress / 100) * 15));
    }
    const goalLabel = goalScore >= 12 ? "On Track" : goalScore >= 8 ? "Moderate Progress" : "Lagging Behind";

    // 7. Spending Growth (Month-over-month)
    let growthScore = 0;
    let growthRate = 0;
    const prevExpense = prevTxs.filter((t) => t.type === "expense").reduce((acc, t) => acc + t.amount, 0);
    if (prevExpense > 0) {
      growthRate = Math.round(((currentExpense - prevExpense) / prevExpense) * 100);
      if (growthRate < -5) growthScore = 5;
      else if (growthRate <= 10) growthScore = 3;
      else growthScore = 0;
    } else {
      growthScore = 3;
    }

    // Total Score calculation (max 100)
    const totalScore = Math.min(100, Math.max(15, savingsScore + budgetScore + stabilityScore + debtScore + emergencyScore + goalScore + growthScore));

    let rating: FinancialHealthResult["rating"] = "Good";
    let summary = "Your financial foundation is solid with consistent savings habits.";
    if (totalScore >= 80) {
      rating = "Excellent";
      summary = "Outstanding financial posture. You have disciplined spending and robust emergency protection.";
    } else if (totalScore >= 65) {
      rating = "Good";
      summary = "Healthy financial discipline with modest room to trim discretionary wants.";
    } else if (totalScore >= 50) {
      rating = "Fair";
      summary = "Moderate financial stability. Increasing your monthly savings buffer will strengthen resilience.";
    } else {
      rating = "Needs Attention";
      summary = "High spending velocity detected. Immediate budget recalibration is strongly recommended.";
    }

    // Drivers
    const positiveDrivers: string[] = [];
    const negativeDrivers: string[] = [];

    if (savingsScore >= 15) positiveDrivers.push(`Savings rate: ${savingsLabel} (${Math.round(actualSavingsRate)}%)`);
    else negativeDrivers.push(`Savings rate: Low (${Math.round(actualSavingsRate)}% vs 20% benchmark)`);

    if (budgetScore >= 14) positiveDrivers.push(`Budget adherence: High (${budgetAdherence}%)`);
    else negativeDrivers.push(`Budget adherence: Risk of overspending in discretionary categories`);

    if (debtScore >= 12) positiveDrivers.push(`Debt burden: Minimal or zero debt`);
    else negativeDrivers.push(`Debt burden: Elevated monthly loan commitments`);

    if (emergencyScore >= 12) positiveDrivers.push(`Emergency cushion: ${monthsCovered} months of runway`);
    else negativeDrivers.push(`Emergency cushion: Less than 3 months of emergency buffer`);

    if (growthRate > 20) negativeDrivers.push(`Spending growth: Accelerated +${growthRate}% over last month`);
    else if (growthRate < 0) positiveDrivers.push(`Expense control: Expenses reduced by ${Math.abs(growthRate)}%`);

    // Need vs Want Percentages
    const totalCategorized = Math.max(1, needsSum + wantsSum + savingsSum + debtSum);
    const needPercentage = Math.round((needsSum / totalCategorized) * 100);
    const wantPercentage = Math.round((wantsSum / totalCategorized) * 100);
    const debtPercentage = Math.round((debtSum / totalCategorized) * 100);
    const savingsPercentage = Math.max(0, 100 - (needPercentage + wantPercentage + debtPercentage));

    return {
      score: totalScore,
      rating,
      summary,
      positiveDrivers,
      negativeDrivers,
      breakdown: {
        savingsRate: { score: savingsScore, label: savingsLabel, actualPercent: Math.round(actualSavingsRate) },
        budgetDiscipline: { score: budgetScore, label: budgetLabel, actualAdherence: budgetAdherence },
        expenseStability: { score: stabilityScore, label: stabilityLabel },
        debtBurden: { score: debtScore, label: debtLabel, dtiRatio: Math.round(dtiRatio) },
        emergencyFund: { score: emergencyScore, label: emergencyLabel, monthsCovered },
        goalProgress: { score: goalScore, label: goalLabel, averageProgress },
        spendingGrowth: { score: growthScore, label: growthRate > 15 ? "High Growth" : "Controlled", growthRate },
      },
      needVsWant: {
        needs: needPercentage,
        wants: wantPercentage,
        savings: savingsPercentage,
        debt: debtPercentage,
      },
    };
  }

  static async calculateAndSaveSnapshot(userId: mongoose.Types.ObjectId): Promise<void> {
    const health = await this.calculateHealth(userId);
    const user = await User.findById(userId);
    const income = user?.monthlyIncome || 50000;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const txs = await Transaction.find({ userId, date: { $gte: startOfMonth } }).lean();

    const totalExpense = txs.filter((t) => t.type === "expense").reduce((a, b) => a + b.amount, 0);
    const totalIncome = txs.filter((t) => t.type === "income").reduce((a, b) => a + b.amount, 0) || income;
    const savings = Math.max(0, totalIncome - totalExpense);

    await FinancialSnapshot.create({
      userId,
      snapshotDate: now,
      netWorth: savings * 6,
      totalIncomeMonth: totalIncome,
      totalExpenseMonth: totalExpense,
      totalSavingsMonth: savings,
      savingsRate: health.breakdown.savingsRate.actualPercent,
      financialHealthScore: health.score,
      breakdown: {
        savingsRateScore: health.breakdown.savingsRate.score,
        budgetDisciplineScore: health.breakdown.budgetDiscipline.score,
        expenseStabilityScore: health.breakdown.expenseStability.score,
        debtBurdenScore: health.breakdown.debtBurden.score,
        emergencyFundScore: health.breakdown.emergencyFund.score,
        goalProgressScore: health.breakdown.goalProgress.score,
        spendingGrowthScore: health.breakdown.spendingGrowth.score,
      },
      needPercentage: health.needVsWant.needs,
      wantPercentage: health.needVsWant.wants,
      savingsPercentage: health.needVsWant.savings,
      debtPercentage: health.needVsWant.debt,
    });
  }
}
