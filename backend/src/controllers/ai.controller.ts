import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { GeminiService } from "../services/gemini.service.js";
import { SimulationService } from "../services/simulation.service.js";
import { TransactionService } from "../services/transaction.service.js";
import { ChatConversation } from "../models/ChatConversation.js";

export class AIController {
  static async chat(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { message, conversationId } = req.body;
    if (!message || typeof message !== "string" || !message.trim()) {
      res.status(400).json({ status: "error", message: "Message cannot be empty." });
      return;
    }

    const result = await GeminiService.chat(req.userId!, message.trim(), conversationId);
    res.status(200).json({
      status: "success",
      data: result,
    });
  }

  static async getConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const conv = await ChatConversation.findOne({ _id: id, userId: req.userId });
    if (!conv) {
      res.status(404).json({ status: "error", message: "Conversation not found." });
      return;
    }
    res.status(200).json({ status: "success", data: { conversation: conv } });
  }

  static async getRecentConversations(req: AuthenticatedRequest, res: Response): Promise<void> {
    const convs = await ChatConversation.find({ userId: req.userId })
      .select("title lastMessageAt createdAt")
      .sort({ lastMessageAt: -1 })
      .limit(10)
      .lean();
    res.status(200).json({ status: "success", data: { conversations: convs } });
  }

  static async clearConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    await ChatConversation.deleteOne({ _id: id, userId: req.userId });
    res.status(200).json({ status: "success", message: "Conversation deleted." });
  }

  static async simulate(req: AuthenticatedRequest, res: Response): Promise<void> {
    const result = await SimulationService.runSimulation(req.userId!, req.body);
    res.status(200).json({
      status: "success",
      data: { simulation: result },
    });
  }

  static async parseExpense(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { text } = req.body;
    const parsed = TransactionService.parseNaturalLanguage(text);
    res.status(200).json({ status: "success", data: { parsed } });
  }
}
