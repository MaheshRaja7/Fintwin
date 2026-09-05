import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGODB_URI: process.env.MONGODB_URI || "",
  JWT_SECRET: process.env.JWT_SECRET || "fintwin_super_secret_jwt_key_2026_production_grade_token",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  ML_SERVICE_URL: process.env.ML_SERVICE_URL || "http://localhost:8000",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  COOKIE_SECRET: process.env.COOKIE_SECRET || "fintwin_cookie_secret_99812",
};
