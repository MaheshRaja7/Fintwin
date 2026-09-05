import mongoose, { Schema, Document } from "mongoose";

export interface IFinancialSnapshot extends Document {
  userId: mongoose.Types.ObjectId;
  snapshotDate: Date;
  netWorth: number;
  totalIncomeMonth: number;
  totalExpenseMonth: number;
  totalSavingsMonth: number;
  savingsRate: number; // percentage
  financialHealthScore: number; // 0 - 100
  breakdown: {
    savingsRateScore: number;
    budgetDisciplineScore: number;
    expenseStabilityScore: number;
    debtBurdenScore: number;
    emergencyFundScore: number;
    goalProgressScore: number;
    spendingGrowthScore: number;
  };
  needPercentage: number;
  wantPercentage: number;
  savingsPercentage: number;
  debtPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

const FinancialSnapshotSchema = new Schema<IFinancialSnapshot>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    snapshotDate: { type: Date, default: Date.now, index: true },
    netWorth: { type: Number, default: 0 },
    totalIncomeMonth: { type: Number, default: 0 },
    totalExpenseMonth: { type: Number, default: 0 },
    totalSavingsMonth: { type: Number, default: 0 },
    savingsRate: { type: Number, default: 0 },
    financialHealthScore: { type: Number, default: 70 },
    breakdown: {
      savingsRateScore: { type: Number, default: 70 },
      budgetDisciplineScore: { type: Number, default: 70 },
      expenseStabilityScore: { type: Number, default: 70 },
      debtBurdenScore: { type: Number, default: 70 },
      emergencyFundScore: { type: Number, default: 70 },
      goalProgressScore: { type: Number, default: 70 },
      spendingGrowthScore: { type: Number, default: 70 },
    },
    needPercentage: { type: Number, default: 50 },
    wantPercentage: { type: Number, default: 30 },
    savingsPercentage: { type: Number, default: 20 },
    debtPercentage: { type: Number, default: 0 },
  },
  { timestamps: true }
);

FinancialSnapshotSchema.index({ userId: 1, snapshotDate: -1 });

export const FinancialSnapshot = mongoose.model<IFinancialSnapshot>("FinancialSnapshot", FinancialSnapshotSchema);
