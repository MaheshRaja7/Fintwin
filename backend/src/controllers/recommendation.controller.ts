import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { RecommendationService } from "../services/recommendation.service.js";
import { Recommendation } from "../models/Recommendation.js";

export class RecommendationController {
  static async getRecommendations(req: AuthenticatedRequest, res: Response): Promise<void> {
    const recommendations = await RecommendationService.getRecommendations(req.userId!);
    res.status(200).json({ status: "success", data: { recommendations } });
  }

  static async refreshRecommendations(req: AuthenticatedRequest, res: Response): Promise<void> {
    const recommendations = await RecommendationService.generateRecommendations(req.userId!);
    res.status(200).json({ status: "success", message: "Recommendations recalculated.", data: { recommendations } });
  }

  static async updateStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { status } = req.body;
    const rec = await Recommendation.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { status },
      { new: true }
    );
    if (!rec) {
      res.status(404).json({ status: "error", message: "Recommendation not found." });
      return;
    }
    res.status(200).json({ status: "success", data: { recommendation: rec } });
  }
}
