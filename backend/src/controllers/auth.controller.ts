import { Response } from "express";
import { AuthService } from "../services/auth.service.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { seedDemoData } from "../utils/seedData.js";
import { User } from "../models/User.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export class AuthController {
  static async signup(req: AuthenticatedRequest, res: Response): Promise<void> {
    const result = await AuthService.signup(req.body);
    res.cookie("token", result.token, COOKIE_OPTIONS);
    res.status(201).json({
      status: "success",
      message: "Account created successfully.",
      data: result,
    });
  }

  static async login(req: AuthenticatedRequest, res: Response): Promise<void> {
    const result = await AuthService.login(req.body);
    res.cookie("token", result.token, COOKIE_OPTIONS);
    res.status(200).json({
      status: "success",
      message: "Logged in successfully.",
      data: result,
    });
  }

  static async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    res.clearCookie("token");
    res.status(200).json({
      status: "success",
      message: "Logged out successfully.",
    });
  }

  static async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    res.status(200).json({
      status: "success",
      data: { user: req.user },
    });
  }

  static async updateOnboarding(req: AuthenticatedRequest, res: Response): Promise<void> {
    const updated = await AuthService.updateOnboarding(req.userId!, req.body);
    res.status(200).json({
      status: "success",
      message: "Onboarding details saved successfully.",
      data: { user: updated },
    });
  }

  static async demoLogin(req: AuthenticatedRequest, res: Response): Promise<void> {
    let demoUser = await User.findOne({ email: "demo@fintwin.ai" });
    if (!demoUser) {
      demoUser = await seedDemoData();
    }

    const token = AuthService.generateToken(demoUser._id.toString());
    const userJson = demoUser.toObject();
    delete (userJson as any).passwordHash;

    res.cookie("token", token, COOKIE_OPTIONS);
    res.status(200).json({
      status: "success",
      message: "Logged in as Demo User (Alex Sharma).",
      data: { user: userJson, token },
    });
  }
}
