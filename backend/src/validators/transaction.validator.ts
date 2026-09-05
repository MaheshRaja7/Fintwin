import { z } from "zod";

export const createTransactionSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().optional(),
  merchant: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  date: z.string().optional(),
  paymentMethod: z.string().default("UPI"),
  tags: z.array(z.string()).optional(),
  isRecurring: z.boolean().default(false),
  nature: z.enum(["need", "want", "saving", "debt"]).optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const naturalLanguageExpenseSchema = z.object({
  text: z.string().min(2, "Input phrase is too short"),
});
