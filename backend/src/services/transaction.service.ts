import mongoose from "mongoose";
import { Transaction, ITransaction, TransactionType, ExpenseNature } from "../models/Transaction.js";
import { Subscription } from "../models/Subscription.js";
import { FinancialHealthService } from "./financialHealth.service.js";

// Standard category & nature heuristics
const NEED_CATEGORIES = new Set(["Rent", "Groceries", "Bills", "Healthcare", "Education", "Transport"]);
const WANT_CATEGORIES = new Set(["Food", "Shopping", "Entertainment", "Travel", "Subscriptions", "Other"]);
const SAVING_CATEGORIES = new Set(["Investment", "Savings", "Emergency Fund"]);
const DEBT_CATEGORIES = new Set(["Debt", "Loan", "EMI", "Credit Card Payment"]);

export class TransactionService {
  static classifyNature(category: string, type: TransactionType): ExpenseNature {
    if (type === "income") return "saving";
    if (NEED_CATEGORIES.has(category)) return "need";
    if (SAVING_CATEGORIES.has(category)) return "saving";
    if (DEBT_CATEGORIES.has(category)) return "debt";
    return "want";
  }

  static parseNaturalLanguage(text: string): {
    amount: number;
    type: TransactionType;
    category: string;
    merchant: string;
    description: string;
    nature: ExpenseNature;
    isRecurring: boolean;
  } {
    const raw = text.trim();
    let amount = 0;
    let type: TransactionType = "expense";
    let category = "Other";
    let merchant = "";
    let isRecurring = false;

    // Detect amount: ₹500, Rs 500, Rs. 500, 500 INR, 500 rupees, or bare numbers
    const amountMatch = raw.match(/(?:(?:₹|rs\.?|inr|\$)\s*([\d,]+(?:\.\d+)?))|(?:([\d,]+(?:\.\d+)?)\s*(?:₹|rs\.?|inr|rupees|\$))/i)
      || raw.match(/\b(\d+(?:,\d+)*(?:\.\d+)?)\b/);

    if (amountMatch) {
      const numStr = (amountMatch[1] || amountMatch[2] || amountMatch[0]).replace(/,/g, "");
      amount = parseFloat(numStr) || 0;
    }

    const lower = raw.toLowerCase();

    // Type detection: income vs expense
    if (lower.includes("salary") || lower.includes("received") || lower.includes("got") || lower.includes("earned") || lower.includes("credited") || lower.includes("bonus") || lower.includes("freelance")) {
      type = "income";
      category = "Income";
      merchant = lower.includes("salary") ? "Employer" : "Client";
    } else {
      type = "expense";
    }

    // Merchant & category detection
    if (lower.includes("swiggy") || lower.includes("zomato") || lower.includes("mcdonald") || lower.includes("starbucks") || lower.includes("pizza") || lower.includes("restaurant") || lower.includes("dinner") || lower.includes("lunch") || lower.includes("cafe")) {
      category = "Food";
      merchant = lower.includes("swiggy") ? "Swiggy" : lower.includes("zomato") ? "Zomato" : "Restaurant";
    } else if (lower.includes("blinkit") || lower.includes("zepto") || lower.includes("instamart") || lower.includes("grocery") || lower.includes("supermarket") || lower.includes("vegetables") || lower.includes("dmart") || lower.includes("bigbasket")) {
      category = "Groceries";
      merchant = lower.includes("blinkit") ? "Blinkit" : lower.includes("zepto") ? "Zepto" : lower.includes("instamart") ? "Instamart" : "Supermarket";
    } else if (lower.includes("uber") || lower.includes("ola") || lower.includes("rapido") || lower.includes("metro") || lower.includes("petrol") || lower.includes("fuel") || lower.includes("cab") || lower.includes("auto")) {
      category = "Transport";
      merchant = lower.includes("uber") ? "Uber" : lower.includes("ola") ? "Ola" : lower.includes("rapido") ? "Rapido" : "Fuel Station";
    } else if (lower.includes("amazon") || lower.includes("flipkart") || lower.includes("myntra") || lower.includes("zara") || lower.includes("cloth") || lower.includes("shoes") || lower.includes("shopping") || lower.includes("gadget")) {
      category = "Shopping";
      merchant = lower.includes("amazon") ? "Amazon" : lower.includes("flipkart") ? "Flipkart" : lower.includes("myntra") ? "Myntra" : "Retail Store";
    } else if (lower.includes("netflix") || lower.includes("spotify") || lower.includes("prime") || lower.includes("hotstar") || lower.includes("youtube") || lower.includes("gym") || lower.includes("subscription")) {
      category = "Subscriptions";
      isRecurring = true;
      merchant = lower.includes("netflix") ? "Netflix" : lower.includes("spotify") ? "Spotify" : lower.includes("prime") ? "Amazon Prime" : lower.includes("hotstar") ? "Disney+ Hotstar" : "Subscription";
    } else if (lower.includes("rent") || lower.includes("landlord")) {
      category = "Rent";
      merchant = "Landlord";
    } else if (lower.includes("electricity") || lower.includes("wifi") || lower.includes("broadband") || lower.includes("airtel") || lower.includes("jio") || lower.includes("water bill") || lower.includes("bill")) {
      category = "Bills";
      merchant = lower.includes("airtel") ? "Airtel" : lower.includes("jio") ? "Jio" : "Utility Board";
    } else if (lower.includes("movie") || lower.includes("cinema") || lower.includes("game") || lower.includes("pvr") || lower.includes("bookmyshow") || lower.includes("party")) {
      category = "Entertainment";
      merchant = lower.includes("pvr") ? "PVR Cinemas" : lower.includes("bookmyshow") ? "BookMyShow" : "Entertainment";
    } else if (lower.includes("doctor") || lower.includes("pharmacy") || lower.includes("medicine") || lower.includes("hospital") || lower.includes("apollo") || lower.includes("1mg")) {
      category = "Healthcare";
      merchant = lower.includes("apollo") ? "Apollo Pharmacy" : lower.includes("1mg") ? "Tata 1mg" : "Clinic";
    } else if (lower.includes("emi") || lower.includes("loan") || lower.includes("credit card payment")) {
      category = "Debt";
      merchant = "Bank / Card";
    } else if (lower.includes("mutual fund") || lower.includes("stocks") || lower.includes("zerodha") || lower.includes("groww") || lower.includes("invest")) {
      category = "Investment";
      type = "income";
      merchant = lower.includes("zerodha") ? "Zerodha" : lower.includes("groww") ? "Groww" : "Investment Platform";
    }

    const nature = this.classifyNature(category, type);

    return {
      amount,
      type,
      category,
      merchant,
      description: text,
      nature,
      isRecurring,
    };
  }

  static async createTransaction(
    userId: mongoose.Types.ObjectId,
    data: {
      amount: number;
      type: TransactionType;
      category: string;
      subcategory?: string;
      merchant?: string;
      description: string;
      date?: Date | string;
      paymentMethod?: string;
      tags?: string[];
      isRecurring?: boolean;
      nature?: ExpenseNature;
    }
  ): Promise<ITransaction> {
    const nature = data.nature || this.classifyNature(data.category, data.type);

    const transaction = await Transaction.create({
      userId,
      amount: data.amount,
      type: data.type,
      category: data.category,
      subcategory: data.subcategory || "",
      merchant: data.merchant || "",
      description: data.description,
      date: data.date ? new Date(data.date) : new Date(),
      paymentMethod: data.paymentMethod || "UPI",
      tags: data.tags || [],
      isRecurring: data.isRecurring || false,
      nature,
    });

    // Auto-detect recurring subscription if applicable
    if (data.isRecurring || data.category === "Subscriptions") {
      const vendorName = data.merchant || data.description;
      await Subscription.findOneAndUpdate(
        { userId, name: new RegExp(`^${vendorName.trim()}$`, "i") },
        {
          userId,
          name: vendorName.trim(),
          amount: data.amount,
          billingCycle: "monthly",
          category: data.category,
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: "active",
          detectedFromMerchant: data.merchant || "",
        },
        { upsert: true, new: true }
      );
    }

    // Trigger asynchronous background recalculation of financial health and snapshot
    setImmediate(async () => {
      try {
        await FinancialHealthService.calculateAndSaveSnapshot(userId);
      } catch (err) {
        console.error("[TransactionService] Background analytics recalculation failed:", err);
      }
    });

    return transaction;
  }

  static async getTransactions(
    userId: mongoose.Types.ObjectId,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      category?: string;
      type?: TransactionType;
      startDate?: string;
      endDate?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    }
  ) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { userId };

    if (options.type) {
      filter.type = options.type;
    }

    if (options.category && options.category !== "All") {
      filter.category = options.category;
    }

    if (options.search) {
      filter.$or = [
        { description: { $regex: options.search, $options: "i" } },
        { merchant: { $regex: options.search, $options: "i" } },
        { category: { $regex: options.search, $options: "i" } },
      ];
    }

    if (options.startDate || options.endDate) {
      filter.date = {};
      if (options.startDate) filter.date.$gte = new Date(options.startDate);
      if (options.endDate) filter.date.$lte = new Date(options.endDate);
    }

    const sortField = options.sortBy || "date";
    const sortDir = options.sortOrder === "asc" ? 1 : -1;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter).sort({ [sortField]: sortDir }).skip(skip).limit(limit).lean(),
      Transaction.countDocuments(filter),
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async updateTransaction(
    userId: mongoose.Types.ObjectId,
    id: string,
    data: Partial<ITransaction>
  ): Promise<ITransaction | null> {
    const updated = await Transaction.findOneAndUpdate(
      { _id: id, userId },
      { $set: data },
      { new: true }
    );

    if (updated) {
      setImmediate(async () => {
        try {
          await FinancialHealthService.calculateAndSaveSnapshot(userId);
        } catch (err) {
          console.error("[TransactionService] Background recalculation error:", err);
        }
      });
    }

    return updated;
  }

  static async deleteTransaction(
    userId: mongoose.Types.ObjectId,
    id: string
  ): Promise<boolean> {
    const result = await Transaction.deleteOne({ _id: id, userId });
    if (result.deletedCount > 0) {
      setImmediate(async () => {
        try {
          await FinancialHealthService.calculateAndSaveSnapshot(userId);
        } catch (err) {
          console.error("[TransactionService] Background recalculation error:", err);
        }
      });
      return true;
    }
    return false;
  }
}
