import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { MLClientService } from "../services/mlClient.service.js";
import { FinancialHealthService } from "../services/financialHealth.service.js";

export class PredictionController {
  static async getForecast(req: AuthenticatedRequest, res: Response): Promise<void> {
    const horizonDays = req.query.horizon ? parseInt(req.query.horizon as string, 10) : 30;
    const forecast = await MLClientService.getExpenseForecast(req.userId!, horizonDays);
    res.status(200).json({ status: "success", data: { forecast } });
  }

  static async getOverspendingRisk(req: AuthenticatedRequest, res: Response): Promise<void> {
    const overspending = await MLClientService.getOverspendingRisk(req.userId!);
    res.status(200).json({ status: "success", data: { overspending } });
  }

  static async getAnomalies(req: AuthenticatedRequest, res: Response): Promise<void> {
    const anomalies = await MLClientService.getAnomalies(req.userId!);
    res.status(200).json({ status: "success", data: anomalies });
  }

  static async getFinancialHealth(req: AuthenticatedRequest, res: Response): Promise<void> {
    const health = await FinancialHealthService.calculateHealth(req.userId!);
    res.status(200).json({ status: "success", data: { health } });
  }
}
