import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { SubscriptionService } from "../services/subscription.service.js";

export class SubscriptionController {
  static async getSubscriptions(req: AuthenticatedRequest, res: Response): Promise<void> {
    const data = await SubscriptionService.getSubscriptions(req.userId!);
    res.status(200).json({ status: "success", data });
  }

  static async createSubscription(req: AuthenticatedRequest, res: Response): Promise<void> {
    const sub = await SubscriptionService.createSubscription(req.userId!, req.body);
    res.status(201).json({ status: "success", message: "Subscription added.", data: { subscription: sub } });
  }

  static async updateStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { status } = req.body;
    const sub = await SubscriptionService.updateStatus(req.userId!, req.params.id, status);
    if (!sub) {
      res.status(404).json({ status: "error", message: "Subscription not found." });
      return;
    }
    res.status(200).json({ status: "success", message: `Subscription marked as ${status}.`, data: { subscription: sub } });
  }

  static async scan(req: AuthenticatedRequest, res: Response): Promise<void> {
    await SubscriptionService.scanAndDetect(req.userId!);
    const data = await SubscriptionService.getSubscriptions(req.userId!);
    res.status(200).json({ status: "success", message: "Subscription audit complete.", data });
  }
}
