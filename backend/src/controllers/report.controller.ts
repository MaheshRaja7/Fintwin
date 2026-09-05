import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { ReportService } from "../services/report.service.js";

export class ReportController {
  static async getReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    const period = (req.query.period as "weekly" | "monthly" | "quarterly") || "monthly";
    const report = await ReportService.generateReport(req.userId!, period);
    res.status(200).json({ status: "success", data: { report } });
  }
}
