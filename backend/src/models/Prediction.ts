import mongoose, { Schema, Document } from "mongoose";

export interface IPrediction extends Document {
  userId: mongoose.Types.ObjectId;
  type: "expense_forecast" | "overspending_risk" | "anomaly_detection";
  modelUsed: string;
  confidence: number;
  data: Record<string, any>;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PredictionSchema = new Schema<IPrediction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["expense_forecast", "overspending_risk", "anomaly_detection"],
      required: true,
    },
    modelUsed: { type: String, required: true },
    confidence: { type: Number, default: 80 },
    data: { type: Schema.Types.Mixed, required: true },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
  },
  { timestamps: true }
);

PredictionSchema.index({ userId: 1, type: 1, createdAt: -1 });

export const Prediction = mongoose.model<IPrediction>("Prediction", PredictionSchema);
