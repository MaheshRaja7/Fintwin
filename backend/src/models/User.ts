import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  fullName: string;
  email: string;
  passwordHash: string;
  currency: string;
  monthlyIncome: number;
  isOnboarded: boolean;
  onboardingStep: number;
  fixedMonthlyExpenses?: number;
  monthlySavingsTarget?: number;
  hasDebt?: boolean;
  debtAmount?: number;
  riskTolerance?: "low" | "moderate" | "high";
  isDemoUser?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    currency: { type: String, default: "INR" },
    monthlyIncome: { type: Number, default: 50000 },
    isOnboarded: { type: Boolean, default: false },
    onboardingStep: { type: Number, default: 1 },
    fixedMonthlyExpenses: { type: Number, default: 0 },
    monthlySavingsTarget: { type: Number, default: 10000 },
    hasDebt: { type: Boolean, default: false },
    debtAmount: { type: Number, default: 0 },
    riskTolerance: { type: String, enum: ["low", "moderate", "high"], default: "moderate" },
    isDemoUser: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", UserSchema);
