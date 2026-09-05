import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { ENV } from "./config/env.js";
import { connectDB } from "./config/database.js";
import { seedDemoData } from "./utils/seedData.js";
import { errorHandler } from "./middleware/error.middleware.js";

// Routes
import authRoutes from "./routes/auth.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import budgetRoutes from "./routes/budget.routes.js";
import goalRoutes from "./routes/goal.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import predictionRoutes from "./routes/prediction.routes.js";
import recommendationRoutes from "./routes/recommendation.routes.js";
import reportRoutes from "./routes/report.routes.js";
import aiRoutes from "./routes/ai.routes.js";

const app = express();

// Security & Parsing
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: [ENV.FRONTEND_URL, "http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  })
);
app.use(cookieParser(ENV.COOKIE_SECRET));
app.use(express.json({ limit: "10mb" }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { status: "error", message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    platform: "FinTwin AI Platform",
    version: "1.0.0",
    geminiLive: Boolean(ENV.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/predictions", predictionRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/ai", aiRoutes);

// Global Error Handler
app.use(errorHandler);

async function startServer() {
  await connectDB();
  await seedDemoData();

  app.listen(ENV.PORT, () => {
    console.log(`=======================================================`);
    console.log(` FinTwin AI Backend Service Online!`);
    console.log(` Port: ${ENV.PORT} | Environment: ${ENV.NODE_ENV}`);
    console.log(` ML Engine: ${ENV.ML_SERVICE_URL}`);
    console.log(` Gemini Mode: ${ENV.GEMINI_API_KEY ? "Live Google GenAI SDK" : "Deterministic Engine (Offline Ready)"}`);
    console.log(`=======================================================`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start FinTwin Backend:", err);
  process.exit(1);
});
