import mongoose, { Schema, Document } from "mongoose";

export interface IBudget extends Document {
  userId: mongoose.Types.ObjectId;
  category: string;
  limit: number;
  period: "monthly" | "yearly";
  month?: number;
  year?: number;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudget>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    category: { type: String, required: true },
    limit: { type: Number, required: true, min: 0 },
    period: { type: String, enum: ["monthly", "yearly"], default: "monthly" },
    month: { type: Number },
    year: { type: Number },
  },
  { timestamps: true }
);

BudgetSchema.index({ userId: 1, category: 1 }, { unique: true });

export const Budget = mongoose.model<IBudget>("Budget", BudgetSchema);
