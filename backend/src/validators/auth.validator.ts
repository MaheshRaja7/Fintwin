import { z } from "zod";

export const signupSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Please provide a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
    currency: z.string().default("INR"),
    monthlyIncome: z.number().min(0, "Monthly income cannot be negative").default(50000),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const onboardingSchema = z.object({
  step: z.number().min(1).max(6),
  monthlyIncome: z.number().min(0).optional(),
  fixedMonthlyExpenses: z.number().min(0).optional(),
  monthlySavingsTarget: z.number().min(0).optional(),
  goals: z
    .array(
      z.object({
        name: z.string().min(1),
        targetAmount: z.number().min(1),
        currentAmount: z.number().min(0).default(0),
        targetDate: z.string(),
      })
    )
    .optional(),
  hasDebt: z.boolean().optional(),
  debtAmount: z.number().min(0).optional(),
  riskTolerance: z.enum(["low", "moderate", "high"]).optional(),
});
