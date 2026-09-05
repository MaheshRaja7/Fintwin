import mongoose, { Schema, Document } from "mongoose";

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  amount: number;
  billingCycle: "monthly" | "yearly" | "weekly";
  category: string;
  nextBillingDate: Date;
  status: "active" | "review" | "cancelled";
  detectedFromMerchant?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    billingCycle: { type: String, enum: ["monthly", "yearly", "weekly"], default: "monthly" },
    category: { type: String, default: "Subscriptions" },
    nextBillingDate: { type: Date, default: Date.now },
    status: { type: String, enum: ["active", "review", "cancelled"], default: "active" },
    detectedFromMerchant: { type: String, default: "" },
  },
  { timestamps: true }
);

SubscriptionSchema.index({ userId: 1, status: 1 });

export const Subscription = mongoose.model<ISubscription>("Subscription", SubscriptionSchema);
