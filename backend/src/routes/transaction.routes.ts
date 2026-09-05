import { Router } from "express";
import { TransactionController } from "../controllers/transaction.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { createTransactionSchema, updateTransactionSchema, naturalLanguageExpenseSchema } from "../validators/transaction.validator.js";

const router = Router();

router.use(authenticateToken);

router.get("/", TransactionController.getTransactions);
router.post("/", validateBody(createTransactionSchema), TransactionController.createTransaction);
router.post("/parse", validateBody(naturalLanguageExpenseSchema), TransactionController.parseNaturalLanguage);
router.put("/:id", validateBody(updateTransactionSchema), TransactionController.updateTransaction);
router.delete("/:id", TransactionController.deleteTransaction);
router.get("/export", TransactionController.exportTransactions);

export default router;
