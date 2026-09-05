import mongoose from "mongoose";
import { Transaction } from "../models/Transaction.js";
import { Budget } from "../models/Budget.js";
import { Subscription } from "../models/Subscription.js";
import { FinancialGoal } from "../models/FinancialGoal.js";
import { User } from "../models/User.js";
import { Recommendation, IRecommendation } from "../models/Recommendation.js";

export class RecommendationService {
  static async generateRecommendations(userId: mongoose.Types.ObjectId): Promise<IRecommendation[]> {
    const user = await User.findById(userId);
    const monthlyIncome = user?.monthlyIncome || 50000;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [txs, budgets, subscriptions, goals] = await Promise.all([
      Transaction.find({ userId, date: { $gte: sixtyDaysAgo } }).lean(),
      Budget.find({ userId }).lean(),
      Subscription.find({ userId, status: { $ne: "cancelled" } }).lean(),
      FinancialGoal.find({ userId, isCompleted: false }).lean(),
    ]);

    const generated: Array<{
      title: string;
      category: string;
      problem: string;
      evidence: string;
      suggestedAction: string;
      currentMonthlyAmount: number;
      recommendedMonthlyAmount: number;
      estimatedMonthlySaving: number;
      estimatedAnnualSaving: number;
      priority: "LOW" | "MEDIUM" | "HIGH";
    }> = [];

    // 1. Food Delivery / Dining Out Analysis
    const foodTxs = txs.filter((t) => t.type === "expense" && (t.category === "Food" || /swiggy|zomato|dining|restaurant|cafe/i.test(t.merchant || t.description)));
    const foodMonthly = (foodTxs.reduce((sum, t) => sum + t.amount, 0) / Math.max(1, txs.length > 0 ? 2 : 1));
    const foodDeliveryTxs = foodTxs.filter((t) => /swiggy|zomato|eats|ubereats/i.test(t.merchant || t.description));
    const foodDeliveryMonthly = foodDeliveryTxs.reduce((sum, t) => sum + t.amount, 0) / Math.max(1, txs.length > 0 ? 2 : 1);

    if (foodMonthly > 3000 || foodDeliveryMonthly > 2000) {
      const targetSpend = Math.round(foodMonthly * 0.65);
      const monthlySaving = Math.round(foodMonthly - targetSpend);
      generated.push({
        title: "Optimize Food & Dining Expenses",
        category: "Food",
        problem: "Frequent online food deliveries are inflating your monthly variable spend.",
        evidence: `Current food spend is approx ₹${Math.round(foodMonthly).toLocaleString()}/month (${Math.round((foodMonthly / monthlyIncome) * 100)}% of income), with food delivery apps accounting for ₹${Math.round(foodDeliveryMonthly).toLocaleString()}/month.`,
        suggestedAction: "Limit food delivery orders to twice a week and prepare simple meal preps during weekdays.",
        currentMonthlyAmount: Math.round(foodMonthly),
        recommendedMonthlyAmount: targetSpend,
        estimatedMonthlySaving: monthlySaving,
        estimatedAnnualSaving: monthlySaving * 12,
        priority: "HIGH",
      });
    }

    // 2. Subscription Audit
    const totalSubMonthly = subscriptions.reduce((sum, s) => {
      if (s.billingCycle === "yearly") return sum + s.amount / 12;
      return sum + s.amount;
    }, 0);

    if (subscriptions.length >= 3 || totalSubMonthly >= 1200) {
      const reviewSubs = subscriptions.slice(0, 2);
      const potentialCut = reviewSubs.reduce((sum, s) => sum + (s.billingCycle === "yearly" ? s.amount / 12 : s.amount), 0);
      const monthlySaving = Math.round(potentialCut);
      generated.push({
        title: "Streamline Recurring Subscriptions",
        category: "Subscriptions",
        problem: "Multiple recurring streaming and software services are running concurrently.",
        evidence: `You have ${subscriptions.length} active subscriptions totaling ₹${Math.round(totalSubMonthly).toLocaleString()}/month (₹${Math.round(totalSubMonthly * 12).toLocaleString()} annually).`,
        suggestedAction: `Pause or rotate services like ${reviewSubs.map((s) => s.name).join(", ")} when not actively watching or using them.`,
        currentMonthlyAmount: Math.round(totalSubMonthly),
        recommendedMonthlyAmount: Math.round(totalSubMonthly - potentialCut),
        estimatedMonthlySaving: monthlySaving,
        estimatedAnnualSaving: monthlySaving * 12,
        priority: "MEDIUM",
      });
    }

    // 3. Discretionary Shopping & Impulse Purchases
    const shoppingTxs = txs.filter((t) => t.type === "expense" && (t.category === "Shopping" || /amazon|flipkart|myntra|zara/i.test(t.merchant || t.description)));
    const shoppingMonthly = shoppingTxs.reduce((sum, t) => sum + t.amount, 0) / Math.max(1, txs.length > 0 ? 2 : 1);

    if (shoppingMonthly > monthlyIncome * 0.12) {
      const targetShopping = Math.round(shoppingMonthly * 0.70);
      const saving = Math.round(shoppingMonthly - targetShopping);
      generated.push({
        title: "Enforce 48-Hour Shopping Rule",
        category: "Shopping",
        problem: "Shopping expenditures represent an elevated portion of your monthly cash flow.",
        evidence: `Discretionary shopping averaged ₹${Math.round(shoppingMonthly).toLocaleString()}/month across recent months.`,
        suggestedAction: "Institute a 48-hour cooling-off rule on non-essential online carts over ₹1,500.",
        currentMonthlyAmount: Math.round(shoppingMonthly),
        recommendedMonthlyAmount: targetShopping,
        estimatedMonthlySaving: saving,
        estimatedAnnualSaving: saving * 12,
        priority: "MEDIUM",
      });
    }

    // 4. Emergency Cushion & Goal Acceleration
    if (goals.length > 0) {
      const topGoal = goals[0];
      const gap = Math.max(0, topGoal.targetAmount - topGoal.currentAmount);
      const monthlyGoalContrib = Math.round(gap / 6);
      if (gap > 5000) {
        generated.push({
          title: `Accelerate ${topGoal.name} Goal Fund`,
          category: "Investment",
          problem: `Your target for ${topGoal.name} has ₹${gap.toLocaleString()} remaining to reach target.`,
          evidence: `Current progress is at ${Math.round((topGoal.currentAmount / topGoal.targetAmount) * 100)}%. Redirecting trimmed expenses will accelerate completion by 2 months.`,
          suggestedAction: `Set up an automated standing transfer of ₹${monthlyGoalContrib.toLocaleString()}/month on salary day.`,
          currentMonthlyAmount: 0,
          recommendedMonthlyAmount: monthlyGoalContrib,
          estimatedMonthlySaving: monthlyGoalContrib,
          estimatedAnnualSaving: monthlyGoalContrib * 12,
          priority: "HIGH",
        });
      }
    }

    // Persist or update in database
    const savedRecs: IRecommendation[] = [];
    for (const rec of generated) {
      const saved = await Recommendation.findOneAndUpdate(
        { userId, title: rec.title },
        { ...rec, userId, status: "active" },
        { upsert: true, new: true }
      );
      savedRecs.push(saved);
    }

    return savedRecs;
  }

  static async getRecommendations(userId: mongoose.Types.ObjectId): Promise<IRecommendation[]> {
    let recs = await Recommendation.find({ userId, status: "active" }).sort({ priority: -1 }).lean();
    if (recs.length === 0) {
      recs = (await this.generateRecommendations(userId)) as any;
    }
    return recs as unknown as IRecommendation[];
  }
}
