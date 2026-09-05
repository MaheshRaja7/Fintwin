import mongoose, { Schema, Document } from "mongoose";

export type TransactionType = "income" | "expense";
export type ExpenseNature = "need" | "want" | "saving" | "debt";

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  type: TransactionType;
  category: string;
  subcategory?: string;
  merchant?: string;
  description: string;
  date: Date;
  paymentMethod: string;
  tags: string[];
  isRecurring: boolean;
  nature: ExpenseNature;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    type: { type: String, enum: ["income", "expense"], required: true, index: true },
    category: {
      type: String,
      required: true,
      index: true,
    },
    subcategory: { type: String, trim: true },
    merchant: { type: String, trim: true, default: "" },
    description: { type: String, required: true, trim: true },
    date: { type: Date, required: true, default: Date.now, index: true },
    paymentMethod: { type: String, default: "UPI" },
    tags: [{ type: String, trim: true }],
    isRecurring: { type: Boolean, default: false },
    nature: { type: String, enum: ["need", "want", "saving", "debt"], default: "want" },
  },
  { timestamps: true }
);

// Compound indexes for high-performance tenant filtering
TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, category: 1 });
TransactionSchema.index({ userId: 1, type: 1, date: -1 });

export const Transaction = mongoose.model<ITransaction>("Transaction", TransactionSchema);
