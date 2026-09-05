import mongoose, { Schema, Document } from "mongoose";

export interface IFinancialGoal extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  category: string;
  color?: string;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FinancialGoalSchema = new Schema<IFinancialGoal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    targetAmount: { type: Number, required: true, min: 1 },
    currentAmount: { type: Number, default: 0, min: 0 },
    targetDate: { type: Date, required: true },
    category: { type: String, default: "General" },
    color: { type: String, default: "#10b981" },
    isCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

FinancialGoalSchema.index({ userId: 1, targetDate: 1 });

export const FinancialGoal = mongoose.model<IFinancialGoal>("FinancialGoal", FinancialGoalSchema);
