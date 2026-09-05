import mongoose from "mongoose";
import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";
import { FinancialGoal } from "../models/FinancialGoal.js";
import { FinancialHealthService } from "./financialHealth.service.js";

export interface SimulationParams {
  plannedPurchaseAmount?: number;
  plannedPurchaseItem?: string;
  categoryToAdjust?: string;
  categoryAdjustmentPercent?: number; // e.g. -30 for 30% reduction, +10 for 10% increase
  incomeChange?: number; // e.g. +5000
  recurringExpenseChange?: number; // e.g. +2000 for rent increase
  extraMonthlySavings?: number; // e.g. +3000
  targetGoalId?: string;
}

export interface SimulationResult {
  scenarioTitle: string;
  baseline: {
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlySavings: number;
    savingsRatePercent: number;
    healthScore: number;
  };
  projected: {
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlySavings: number;
    savingsRatePercent: number;
    healthScore: number;
  };
  impact: {
    monthlySavingsDelta: number;
    annualSavingsDelta: number;
    healthScoreDelta: number;
    affordabilityVerdict: "Highly Affordable" | "Affordable with minor delay" | "Tight / Caution" | "Not recommended";
    goalImpact: {
      goalName: string;
      originalMonthsRemaining: number;
      simulatedMonthsRemaining: number;
      deltaMonths: number;
      explanation: string;
    } | null;
  };
  narrativeSummary: string;
}

export class SimulationService {
  static async runSimulation(userId: mongoose.Types.ObjectId, params: SimulationParams): Promise<SimulationResult> {
    const user = await User.findById(userId);
    const baseIncome = user?.monthlyIncome || 50000;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [currTxs, goals, health] = await Promise.all([
      Transaction.find({ userId, date: { $gte: startOfMonth } }).lean(),
      FinancialGoal.find({ userId, isCompleted: false }).lean(),
      FinancialHealthService.calculateHealth(userId),
    ]);

    // Current spending
    let baseExpense = currTxs
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + t.amount, 0);

    if (baseExpense === 0) {
      baseExpense = baseIncome * 0.7; // baseline estimate
    }

    const baseSavings = Math.max(0, baseIncome - baseExpense);
    const baseSavingsRate = Math.round((baseSavings / Math.max(1, baseIncome)) * 100);

    // Calculate Category Spending if category adjustment requested
    let categorySpend = 0;
    if (params.categoryToAdjust) {
      categorySpend = currTxs
        .filter((t) => t.type === "expense" && t.category.toLowerCase() === params.categoryToAdjust!.toLowerCase())
        .reduce((acc, t) => acc + t.amount, 0);

      if (categorySpend === 0) {
        categorySpend = baseExpense * 0.20; // default proxy
      }
    }

    // Apply simulation deltas
    let projectedIncome = baseIncome + (params.incomeChange || 0);
    let deltaExpense = 0;

    if (params.categoryToAdjust && params.categoryAdjustmentPercent !== undefined) {
      deltaExpense += categorySpend * (params.categoryAdjustmentPercent / 100);
    }

    if (params.recurringExpenseChange) {
      deltaExpense += params.recurringExpenseChange;
    }

    let projectedExpense = Math.max(0, baseExpense + deltaExpense);
    let projectedSavings = Math.max(0, projectedIncome - projectedExpense);

    if (params.extraMonthlySavings) {
      projectedSavings += params.extraMonthlySavings;
    }

    const projectedSavingsRate = Math.round((projectedSavings / Math.max(1, projectedIncome)) * 100);
    const monthlySavingsDelta = projectedSavings - baseSavings;
    const annualSavingsDelta = monthlySavingsDelta * 12;

    // Simulated Health Score impact
    const healthDelta = Math.round((projectedSavingsRate - baseSavingsRate) * 0.4);
    const projectedHealthScore = Math.min(100, Math.max(20, health.score + healthDelta));

    // Goal Timeline impact
    let goalImpact: SimulationResult["impact"]["goalImpact"] = null;
    let targetGoal = goals.find((g) => g._id.toString() === params.targetGoalId) || goals[0];

    if (targetGoal) {
      const remainingGoal = Math.max(0, targetGoal.targetAmount - targetGoal.currentAmount);
      const originalMonths = Math.max(0.5, Math.round((remainingGoal / Math.max(100, baseSavings)) * 10) / 10);

      let effectiveGoalFund = targetGoal.currentAmount;
      if (params.plannedPurchaseAmount) {
        effectiveGoalFund = Math.max(0, effectiveGoalFund - params.plannedPurchaseAmount);
      }

      const newRemainingGoal = Math.max(0, targetGoal.targetAmount - effectiveGoalFund);
      const newMonths = Math.max(0.5, Math.round((newRemainingGoal / Math.max(100, projectedSavings)) * 10) / 10);
      const deltaMonths = Math.round((newMonths - originalMonths) * 10) / 10;

      let explanation = "";
      if (deltaMonths > 0) {
        explanation = `Reaching your ${targetGoal.name} target would be delayed by approximately ${deltaMonths} month${deltaMonths === 1 ? "" : "s"}.`;
      } else if (deltaMonths < 0) {
        explanation = `You will achieve your ${targetGoal.name} goal ${Math.abs(deltaMonths)} month${Math.abs(deltaMonths) === 1 ? "" : "s"} earlier!`;
      } else {
        explanation = `Timeline for ${targetGoal.name} remains unchanged.`;
      }

      goalImpact = {
        goalName: targetGoal.name,
        originalMonthsRemaining: originalMonths,
        simulatedMonthsRemaining: newMonths,
        deltaMonths,
        explanation,
      };
    }

    // Affordability Verdict
    let affordabilityVerdict: SimulationResult["impact"]["affordabilityVerdict"] = "Highly Affordable";
    if (params.plannedPurchaseAmount) {
      if (params.plannedPurchaseAmount > baseSavings * 2 || (goalImpact && goalImpact.deltaMonths > 2)) {
        affordabilityVerdict = "Not recommended";
      } else if (params.plannedPurchaseAmount > baseSavings || (goalImpact && goalImpact.deltaMonths > 0.5)) {
        affordabilityVerdict = "Tight / Caution";
      } else if (goalImpact && goalImpact.deltaMonths > 0) {
        affordabilityVerdict = "Affordable with minor delay";
      }
    }

    // Generate narrative summary
    let narrative = "";
    if (params.plannedPurchaseAmount) {
      narrative = `You can technically afford ₹${params.plannedPurchaseAmount.toLocaleString()} for ${params.plannedPurchaseItem || "this item"}, but it would impact your current savings plan. `;
      if (goalImpact && goalImpact.deltaMonths > 0) {
        narrative += `Your ${goalImpact.goalName} goal would be delayed by ~${goalImpact.deltaMonths} months. If not urgent, waiting or buffering over two months protects your reserves.`;
      }
    } else if (params.categoryAdjustmentPercent && params.categoryAdjustmentPercent < 0) {
      narrative = `Trimming ${params.categoryToAdjust || "expenses"} by ${Math.abs(params.categoryAdjustmentPercent)}% adds ₹${Math.abs(monthlySavingsDelta).toLocaleString()} to your monthly buffer, compounding to ₹${annualSavingsDelta.toLocaleString()} annually.`;
    } else if (params.incomeChange && params.incomeChange > 0) {
      narrative = `An income boost of ₹${params.incomeChange.toLocaleString()}/month elevates your annual savings potential to ₹${annualSavingsDelta.toLocaleString()} and improves your financial resilience score by +${healthDelta} pts.`;
    } else {
      narrative = `Adjusting your financial allocations produces a monthly variance of ₹${monthlySavingsDelta.toLocaleString()} (₹${annualSavingsDelta.toLocaleString()}/year).`;
    }

    const scenarioTitle = params.plannedPurchaseAmount
      ? `Can I afford ₹${params.plannedPurchaseAmount.toLocaleString()} ${params.plannedPurchaseItem ? `on ${params.plannedPurchaseItem}` : ""}?`
      : params.categoryAdjustmentPercent
      ? `What if I adjust ${params.categoryToAdjust || "spending"} by ${params.categoryAdjustmentPercent}%?`
      : params.incomeChange
      ? `What if my income increases by ₹${params.incomeChange.toLocaleString()}?`
      : "Custom Financial Scenario";

    return {
      scenarioTitle,
      baseline: {
        monthlyIncome: Math.round(baseIncome),
        monthlyExpenses: Math.round(baseExpense),
        monthlySavings: Math.round(baseSavings),
        savingsRatePercent: baseSavingsRate,
        healthScore: health.score,
      },
      projected: {
        monthlyIncome: Math.round(projectedIncome),
        monthlyExpenses: Math.round(projectedExpense),
        monthlySavings: Math.round(projectedSavings),
        savingsRatePercent: projectedSavingsRate,
        healthScore: projectedHealthScore,
      },
      impact: {
        monthlySavingsDelta: Math.round(monthlySavingsDelta),
        annualSavingsDelta: Math.round(annualSavingsDelta),
        healthScoreDelta: healthDelta,
        affordabilityVerdict,
        goalImpact,
      },
      narrativeSummary: narrative,
    };
  }
}
