import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { User, IUser } from "../models/User.js";
import { Budget } from "../models/Budget.js";
import { FinancialGoal } from "../models/FinancialGoal.js";
import { ENV } from "../config/env.js";

export class AuthService {
  static generateToken(userId: string): string {
    return jwt.sign({ userId }, ENV.JWT_SECRET, {
      expiresIn: "7d",
    });
  }

  static async signup(data: {
    fullName: string;
    email: string;
    password: string;
    currency?: string;
    monthlyIncome?: number;
  }): Promise<{ user: Partial<IUser>; token: string }> {
    const existing = await User.findOne({ email: data.email.toLowerCase().trim() });
    if (existing) {
      throw new Error("An account with this email address already exists.");
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await User.create({
      fullName: data.fullName,
      email: data.email.toLowerCase().trim(),
      passwordHash,
      currency: data.currency || "INR",
      monthlyIncome: data.monthlyIncome ?? 50000,
      isOnboarded: false,
      onboardingStep: 1,
    });

    const token = this.generateToken(user._id.toString());
    const userJson = user.toObject();
    delete (userJson as any).passwordHash;

    return { user: userJson, token };
  }

  static async login(data: {
    email: string;
    password: string;
  }): Promise<{ user: Partial<IUser>; token: string }> {
    const user = await User.findOne({ email: data.email.toLowerCase().trim() });
    if (!user) {
      throw new Error("Invalid email or password.");
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw new Error("Invalid email or password.");
    }

    const token = this.generateToken(user._id.toString());
    const userJson = user.toObject();
    delete (userJson as any).passwordHash;

    return { user: userJson, token };
  }

  static async updateOnboarding(
    userId: mongoose.Types.ObjectId,
    data: {
      step: number;
      monthlyIncome?: number;
      fixedMonthlyExpenses?: number;
      monthlySavingsTarget?: number;
      goals?: Array<{ name: string; targetAmount: number; currentAmount?: number; targetDate: string }>;
      hasDebt?: boolean;
      debtAmount?: number;
      riskTolerance?: "low" | "moderate" | "high";
    }
  ): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found.");
    }

    if (data.monthlyIncome !== undefined) user.monthlyIncome = data.monthlyIncome;
    if (data.fixedMonthlyExpenses !== undefined) user.fixedMonthlyExpenses = data.fixedMonthlyExpenses;
    if (data.monthlySavingsTarget !== undefined) user.monthlySavingsTarget = data.monthlySavingsTarget;
    if (data.hasDebt !== undefined) user.hasDebt = data.hasDebt;
    if (data.debtAmount !== undefined) user.debtAmount = data.debtAmount;
    if (data.riskTolerance !== undefined) user.riskTolerance = data.riskTolerance;

    user.onboardingStep = data.step;
    if (data.step >= 6) {
      user.isOnboarded = true;

      // Auto-generate recommended budgets if not existing
      const income = user.monthlyIncome || 50000;
      const budgetTemplates = [
        { category: "Food", limit: Math.round(income * 0.15) },
        { category: "Groceries", limit: Math.round(income * 0.12) },
        { category: "Rent", limit: Math.round(income * 0.25) },
        { category: "Transport", limit: Math.round(income * 0.08) },
        { category: "Bills", limit: Math.round(income * 0.08) },
        { category: "Shopping", limit: Math.round(income * 0.10) },
        { category: "Entertainment", limit: Math.round(income * 0.05) },
      ];

      for (const t of budgetTemplates) {
        await Budget.findOneAndUpdate(
          { userId: user._id, category: t.category },
          { userId: user._id, category: t.category, limit: t.limit, period: "monthly" },
          { upsert: true, new: true }
        );
      }

      // Add onboarding goals if provided
      if (data.goals && data.goals.length > 0) {
        for (const g of data.goals) {
          await FinancialGoal.create({
            userId: user._id,
            name: g.name,
            targetAmount: g.targetAmount,
            currentAmount: g.currentAmount || 0,
            targetDate: new Date(g.targetDate),
          });
        }
      }
    }

    await user.save();
    return user;
  }
}
