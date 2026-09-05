import mongoose, { Schema, Document } from "mongoose";

export interface IChatMessage {
  _id?: mongoose.Types.ObjectId;
  role: "user" | "model" | "system";
  content: string;
  toolCalls?: Array<{
    name: string;
    args: Record<string, any>;
    result: Record<string, any>;
  }>;
  financialCard?: {
    type: "spending_summary" | "budget_alert" | "forecast" | "recommendation" | "simulation";
    data: Record<string, any>;
  };
  createdAt: Date;
}

export interface IChatConversation extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  messages: IChatMessage[];
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    role: { type: String, enum: ["user", "model", "system"], required: true },
    content: { type: String, required: true },
    toolCalls: [{ type: Schema.Types.Mixed }],
    financialCard: {
      type: { type: String },
      data: { type: Schema.Types.Mixed },
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ChatConversationSchema = new Schema<IChatConversation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "Financial Intelligence Chat" },
    messages: [ChatMessageSchema],
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ChatConversationSchema.index({ userId: 1, lastMessageAt: -1 });

export const ChatConversation = mongoose.model<IChatConversation>("ChatConversation", ChatConversationSchema);
