import { Router } from "express";
import { SubscriptionController } from "../controllers/subscription.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authenticateToken);

router.get("/", SubscriptionController.getSubscriptions);
router.post("/", SubscriptionController.createSubscription);
router.patch("/:id/status", SubscriptionController.updateStatus);
router.post("/scan", SubscriptionController.scan);

export default router;
