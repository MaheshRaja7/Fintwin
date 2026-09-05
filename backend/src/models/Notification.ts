import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: "budget_alert" | "forecast_alert" | "saving_opportunity" | "anomaly" | "goal_update" | "system";
  severity: "info" | "warning" | "critical" | "success";
  read: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["budget_alert", "forecast_alert", "saving_opportunity", "anomaly", "goal_update", "system"],
      default: "system",
    },
    severity: {
      type: String,
      enum: ["info", "warning", "critical", "success"],
      default: "info",
    },
    read: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>("Notification", NotificationSchema);
