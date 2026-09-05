import mongoose, { Schema, Document } from "mongoose";

export interface IRecommendation extends Document {
  userId: mongoose.Types.ObjectId;
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
  status: "active" | "applied" | "dismissed";
  createdAt: Date;
  updatedAt: Date;
}

const RecommendationSchema = new Schema<IRecommendation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    problem: { type: String, required: true },
    evidence: { type: String, required: true },
    suggestedAction: { type: String, required: true },
    currentMonthlyAmount: { type: Number, default: 0 },
    recommendedMonthlyAmount: { type: Number, default: 0 },
    estimatedMonthlySaving: { type: Number, required: true },
    estimatedAnnualSaving: { type: Number, required: true },
    priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], default: "MEDIUM" },
    status: { type: String, enum: ["active", "applied", "dismissed"], default: "active" },
  },
  { timestamps: true }
);

RecommendationSchema.index({ userId: 1, status: 1, priority: 1 });

export const Recommendation = mongoose.model<IRecommendation>("Recommendation", RecommendationSchema);
