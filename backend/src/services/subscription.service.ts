import mongoose from "mongoose";
import { Subscription, ISubscription } from "../models/Subscription.js";
import { Transaction } from "../models/Transaction.js";

const RECURRING_PATTERNS = [
  { name: "Netflix", category: "Entertainment", regex: /netflix/i },
  { name: "Spotify", category: "Entertainment", regex: /spotify/i },
  { name: "Amazon Prime", category: "Shopping", regex: /prime|amazon\s*prime/i },
  { name: "Disney+ Hotstar", category: "Entertainment", regex: /hotstar/i },
  { name: "YouTube Premium", category: "Entertainment", regex: /youtube/i },
  { name: "Cult.fit Gym", category: "Healthcare", regex: /cult|gym|fitness/i },
  { name: "Swiggy One", category: "Food", regex: /swiggy\s*one/i },
  { name: "Zomato Gold", category: "Food", regex: /zomato\s*gold/i },
  { name: "ChatGPT Plus", category: "Subscriptions", regex: /chatgpt|openai/i },
  { name: "Apple iCloud", category: "Subscriptions", regex: /apple|icloud/i },
  { name: "Google One", category: "Subscriptions", regex: /google\s*one/i },
  { name: "Airtel Broadband", category: "Bills", regex: /airtel/i },
  { name: "Jio Fiber", category: "Bills", regex: /jio\s*fiber|jio/i },
];

export class SubscriptionService {
  static async getSubscriptions(userId: mongoose.Types.ObjectId) {
    const list = await Subscription.find({ userId }).sort({ amount: -1 }).lean();

    let totalMonthly = 0;
    for (const sub of list) {
      if (sub.status !== "cancelled") {
        if (sub.billingCycle === "yearly") {
          totalMonthly += sub.amount / 12;
        } else if (sub.billingCycle === "weekly") {
          totalMonthly += sub.amount * 4.33;
        } else {
          totalMonthly += sub.amount;
        }
      }
    }

    const annualized = Math.round(totalMonthly * 12);

    return {
      subscriptions: list,
      totalMonthly: Math.round(totalMonthly),
      annualized,
      activeCount: list.filter((s) => s.status === "active").length,
      reviewCount: list.filter((s) => s.status === "review").length,
      cancelledCount: list.filter((s) => s.status === "cancelled").length,
    };
  }

  static async scanAndDetect(userId: mongoose.Types.ObjectId): Promise<void> {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const txs = await Transaction.find({
      userId,
      type: "expense",
      date: { $gte: ninetyDaysAgo },
    }).lean();

    for (const pattern of RECURRING_PATTERNS) {
      const matches = txs.filter(
        (t) => pattern.regex.test(t.merchant || "") || pattern.regex.test(t.description || "")
      );

      if (matches.length >= 1) {
        // Find typical amount
        const typicalAmount = matches[0].amount;
        const latestTx = matches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        const nextBilling = new Date(new Date(latestTx.date).getTime() + 30 * 24 * 60 * 60 * 1000);

        await Subscription.findOneAndUpdate(
          { userId, name: pattern.name },
          {
            userId,
            name: pattern.name,
            amount: typicalAmount,
            billingCycle: "monthly",
            category: pattern.category,
            nextBillingDate: nextBilling,
            status: "active",
            detectedFromMerchant: latestTx.merchant || pattern.name,
          },
          { upsert: true, new: true }
        );
      }
    }
  }

  static async updateStatus(
    userId: mongoose.Types.ObjectId,
    id: string,
    status: "active" | "review" | "cancelled"
  ): Promise<ISubscription | null> {
    return Subscription.findOneAndUpdate({ _id: id, userId }, { status }, { new: true });
  }

  static async createSubscription(
    userId: mongoose.Types.ObjectId,
    data: {
      name: string;
      amount: number;
      billingCycle?: "monthly" | "yearly" | "weekly";
      category?: string;
      nextBillingDate?: Date | string;
    }
  ): Promise<ISubscription> {
    return Subscription.create({
      userId,
      name: data.name,
      amount: data.amount,
      billingCycle: data.billingCycle || "monthly",
      category: data.category || "Subscriptions",
      nextBillingDate: data.nextBillingDate ? new Date(data.nextBillingDate) : new Date(),
      status: "active",
    });
  }
}
