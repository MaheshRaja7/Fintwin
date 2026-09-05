import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { signupSchema, loginSchema, onboardingSchema } from "../validators/auth.validator.js";

const router = Router();

router.post("/signup", validateBody(signupSchema), AuthController.signup);
router.post("/login", validateBody(loginSchema), AuthController.login);
router.post("/logout", AuthController.logout);
router.post("/demo-login", AuthController.demoLogin);
router.get("/me", authenticateToken, AuthController.getMe);
router.post("/onboarding", authenticateToken, validateBody(onboardingSchema), AuthController.updateOnboarding);

export default router;
