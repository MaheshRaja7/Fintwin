import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "INR"): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return "₹0";
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  if (currency === "INR") {
    // Format according to Indian numbering format (e.g. 1,00,000)
    const formatted = new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0,
    }).format(absAmount);
    return `${isNegative ? "-" : ""}₹${formatted}`;
  }

  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(absAmount);
  return `${isNegative ? "-" : ""}$${formatted}`;
}

export function formatDate(dateStr: string | Date): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelativeDate(dateStr: string | Date): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffHours = Math.round((now.getTime() - d.getTime()) / (1000 * 60 * 60));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffHours < 48) return "Yesterday";
  return formatDate(d);
}

export const CATEGORY_COLORS: Record<string, string> = {
  Food: "#f59e0b",
  Groceries: "#10b981",
  Transport: "#06b6d4",
  Shopping: "#ec4899",
  Bills: "#8b5cf6",
  Rent: "#3b82f6",
  Healthcare: "#ef4444",
  Entertainment: "#a855f7",
  Travel: "#14b8a6",
  Subscriptions: "#6366f1",
  Investment: "#22c55e",
  Debt: "#f43f5e",
  Income: "#10b981",
  Other: "#64748b",
};
