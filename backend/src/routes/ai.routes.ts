import { Router } from "express";
import { AIController } from "../controllers/ai.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authenticateToken);

router.post("/chat", AIController.chat);
router.get("/conversations", AIController.getRecentConversations);
router.get("/conversations/:id", AIController.getConversation);
router.delete("/conversations/:id", AIController.clearConversation);
router.post("/simulation", AIController.simulate);
router.post("/expense-parser", AIController.parseExpense);

export default router;
