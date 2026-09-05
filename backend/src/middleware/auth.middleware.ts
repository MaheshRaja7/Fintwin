import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";
import { User, IUser } from "../models/User.js";
import mongoose from "mongoose";

export interface AuthenticatedRequest extends Request {
  user?: IUser;
  userId?: mongoose.Types.ObjectId;
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(" ");
      if (parts.length === 2 && parts[0] === "Bearer") {
        token = parts[1];
      }
    }

    if (!token) {
      res.status(401).json({
        status: "error",
        message: "Authentication required. Please log in to continue.",
      });
      return;
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET) as { userId: string };
    if (!decoded || !decoded.userId) {
      res.status(401).json({
        status: "error",
        message: "Invalid or expired authentication session.",
      });
      return;
    }

    const user = await User.findById(decoded.userId).select("-passwordHash");
    if (!user) {
      res.status(401).json({
        status: "error",
        message: "User session is no longer valid.",
      });
      return;
    }

    req.user = user;
    req.userId = user._id as mongoose.Types.ObjectId;
    next();
  } catch (err: any) {
    res.status(401).json({
      status: "error",
      message: "Authentication failed. Session expired or token invalid.",
    });
  }
}
