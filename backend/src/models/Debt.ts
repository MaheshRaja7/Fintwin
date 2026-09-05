import mongoose, { Schema, Document } from "mongoose";

export interface IDebt extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  totalAmount: number;
  remainingAmount: number;
  interestRate: number; // percentage e.g. 10.5
  minimumMonthlyPayment: number;
  dueDate: number; // day of month 1-31
  category: "credit_card" | "personal_loan" | "student_loan" | "mortgage" | "auto_loan" | "other";
  createdAt: Date;
  updatedAt: Date;
}

const DebtSchema = new Schema<IDebt>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    totalAmount: { type: Number, required: true, min: 0 },
    remainingAmount: { type: Number, required: true, min: 0 },
    interestRate: { type: Number, default: 0 },
    minimumMonthlyPayment: { type: Number, default: 0 },
    dueDate: { type: Number, default: 5 },
    category: {
      type: String,
      enum: ["credit_card", "personal_loan", "student_loan", "mortgage", "auto_loan", "other"],
      default: "personal_loan",
    },
  },
  { timestamps: true }
);

export const Debt = mongoose.model<IDebt>("Debt", DebtSchema);
