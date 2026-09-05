import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { Transaction } from "../models/Transaction.js";
import { Budget } from "../models/Budget.js";
import { FinancialGoal } from "../models/FinancialGoal.js";
import { Subscription } from "../models/Subscription.js";
import { FinancialHealthService } from "../services/financialHealth.service.js";
import { RecommendationService } from "../services/recommendation.service.js";

export async function seedDemoData(): Promise<any> {
  const email = "demo@fintwin.ai";
  let user = await User.findOne({ email });

  if (user) {
    console.log("[SeedData] Demo user already initialized.");
    return user;
  }

  console.log("[SeedData] Seeding comprehensive realistic 4-month fintech demo account...");
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("DemoUser123!", salt);

  user = await User.create({
    fullName: "Alex Sharma",
    email,
    passwordHash,
    currency: "INR",
    monthlyIncome: 50000,
    isOnboarded: true,
    onboardingStep: 6,
    fixedMonthlyExpenses: 16000,
    monthlySavingsTarget: 10000,
    hasDebt: false,
    riskTolerance: "moderate",
    isDemoUser: true,
  });

  const userId = user._id;

  // 1. Seed Budgets
  const budgets = [
    { category: "Food", limit: 6000 },
    { category: "Groceries", limit: 5000 },
    { category: "Rent", limit: 12000 },
    { category: "Transport", limit: 3500 },
    { category: "Bills", limit: 4000 },
    { category: "Shopping", limit: 5000 },
    { category: "Entertainment", limit: 2500 },
    { category: "Subscriptions", limit: 2000 },
  ];

  for (const b of budgets) {
    await Budget.create({ userId, ...b, period: "monthly" });
  }

  // 2. Seed Financial Goals
  const goals = [
    {
      name: "MacBook Pro / Laptop",
      targetAmount: 75000,
      currentAmount: 35000,
      targetDate: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000), // ~8 months
      category: "Gadgets",
      color: "#3b82f6",
    },
    {
      name: "Emergency Fund (6 Months)",
      targetAmount: 150000,
      currentAmount: 65000,
      targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      category: "Savings",
      color: "#10b981",
    },
    {
      name: "Japan Vacation Trip",
      targetAmount: 120000,
      currentAmount: 25000,
      targetDate: new Date(Date.now() + 420 * 24 * 60 * 60 * 1000),
      category: "Travel",
      color: "#f59e0b",
    },
  ];

  for (const g of goals) {
    await FinancialGoal.create({ userId, ...g });
  }

  // 3. Seed Subscriptions
  const subscriptions = [
    {
      name: "Netflix Premium",
      amount: 649,
      billingCycle: "monthly",
      category: "Entertainment",
      nextBillingDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      status: "active",
      detectedFromMerchant: "Netflix",
    },
    {
      name: "Spotify Premium",
      amount: 119,
      billingCycle: "monthly",
      category: "Entertainment",
      nextBillingDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
      status: "active",
      detectedFromMerchant: "Spotify",
    },
    {
      name: "Amazon Prime",
      amount: 1499,
      billingCycle: "yearly",
      category: "Shopping",
      nextBillingDate: new Date(Date.now() + 110 * 24 * 60 * 60 * 1000),
      status: "active",
      detectedFromMerchant: "Amazon Prime",
    },
    {
      name: "Cult.fit Gym Membership",
      amount: 1200,
      billingCycle: "monthly",
      category: "Healthcare",
      nextBillingDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: "review",
      detectedFromMerchant: "Cult.fit",
    },
  ];

  for (const s of subscriptions) {
    await Subscription.create({ userId, ...s });
  }

  // 4. Generate 4 Months of Realistic Transactions (~120 days)
  const transactions: any[] = [];
  const now = new Date();

  for (let m = 3; m >= 0; m--) {
    const baseDate = new Date(now.getFullYear(), now.getMonth() - m, 1);

    // Monthly Salary on 1st
    transactions.push({
      userId,
      amount: 50000,
      type: "income",
      category: "Income",
      merchant: "Tech Corp Bangalore",
      description: "Monthly Salary Credit",
      date: new Date(baseDate.getFullYear(), baseDate.getMonth(), 1, 9, 30),
      paymentMethod: "Bank Transfer",
      nature: "saving",
    });

    // Rent on 3rd
    transactions.push({
      userId,
      amount: 12000,
      type: "expense",
      category: "Rent",
      merchant: "Landlord",
      description: "Apartment Rent Payment",
      date: new Date(baseDate.getFullYear(), baseDate.getMonth(), 3, 11, 0),
      paymentMethod: "UPI",
      nature: "need",
    });

    // Bills on 5th
    transactions.push({
      userId,
      amount: 2400,
      type: "expense",
      category: "Bills",
      merchant: "BESCOM Bangalore",
      description: "Electricity Utility Bill",
      date: new Date(baseDate.getFullYear(), baseDate.getMonth(), 5, 14, 0),
      paymentMethod: "UPI",
      nature: "need",
    });

    transactions.push({
      userId,
      amount: 1199,
      type: "expense",
      category: "Bills",
      merchant: "Airtel Broadband",
      description: "Fiber Internet 200Mbps",
      date: new Date(baseDate.getFullYear(), baseDate.getMonth(), 6, 16, 0),
      paymentMethod: "UPI",
      nature: "need",
    });

    // Subscriptions on 10th
    transactions.push({
      userId,
      amount: 649,
      type: "expense",
      category: "Subscriptions",
      merchant: "Netflix",
      description: "Netflix 4K UHD Plan",
      date: new Date(baseDate.getFullYear(), baseDate.getMonth(), 10, 10, 0),
      paymentMethod: "Card",
      nature: "want",
      isRecurring: true,
    });

    transactions.push({
      userId,
      amount: 119,
      type: "expense",
      category: "Subscriptions",
      merchant: "Spotify",
      description: "Spotify Individual Premium",
      date: new Date(baseDate.getFullYear(), baseDate.getMonth(), 12, 12, 0),
      paymentMethod: "Card",
      nature: "want",
      isRecurring: true,
    });

    // Daily & weekly recurring: Groceries, Food, Transport, Shopping
    const daysInMonth = m === 0 ? Math.min(28, now.getDate()) : 28;
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), day);

      // Groceries every ~4 days
      if (day % 4 === 0) {
        transactions.push({
          userId,
          amount: 850 + (day % 3) * 200,
          type: "expense",
          category: "Groceries",
          merchant: day % 8 === 0 ? "Blinkit" : "Zepto",
          description: "Fresh vegetables and dairy groceries",
          date: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 18, 30),
          paymentMethod: "UPI",
          nature: "need",
        });
      }

      // Food / Swiggy / Zomato every ~3 days
      if (day % 3 === 0) {
        transactions.push({
          userId,
          amount: 320 + (day % 5) * 80,
          type: "expense",
          category: "Food",
          merchant: day % 2 === 0 ? "Swiggy" : "Zomato",
          description: day % 2 === 0 ? "Dinner meal delivery via Swiggy" : "Lunch bowl via Zomato",
          date: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 20, 15),
          paymentMethod: "UPI",
          nature: "want",
        });
      }

      // Transport every ~2 days
      if (day % 2 === 0) {
        transactions.push({
          userId,
          amount: 180 + (day % 3) * 50,
          type: "expense",
          category: "Transport",
          merchant: day % 4 === 0 ? "Uber" : "Namma Metro",
          description: "Commute to office workspace",
          date: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 15),
          paymentMethod: "UPI",
          nature: "need",
        });
      }

      // Occasional shopping on weekends
      if (day === 7 || day === 14 || day === 21) {
        transactions.push({
          userId,
          amount: 1450 + (day % 4) * 500,
          type: "expense",
          category: "Shopping",
          merchant: "Amazon",
          description: "Books, electronics accessories, and apparel",
          date: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 15, 0),
          paymentMethod: "Credit Card",
          nature: "want",
        });
      }

      // Weekend movies / entertainment
      if (day === 8 || day === 22) {
        transactions.push({
          userId,
          amount: 850,
          type: "expense",
          category: "Entertainment",
          merchant: "PVR Cinemas",
          description: "Weekend IMAX movie tickets & snacks",
          date: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 19, 0),
          paymentMethod: "UPI",
          nature: "want",
        });
      }
    }

    // Historical Anomaly in Month -2 (e.g. Unusual Electronics Spike)
    if (m === 2) {
      transactions.push({
        userId,
        amount: 8500,
        type: "expense",
        category: "Shopping",
        merchant: "Croma Retail",
        description: "Mechanical Keyboard & Ergonomic Chair Accessory",
        date: new Date(baseDate.getFullYear(), baseDate.getMonth(), 15, 17, 0),
        paymentMethod: "Credit Card",
        nature: "want",
      });
    }
  }

  await Transaction.insertMany(transactions);
  console.log(`[SeedData] Created ${transactions.length} realistic transactions for demo user.`);

  // Trigger initial snapshot & recommendations
  await FinancialHealthService.calculateAndSaveSnapshot(userId);
  await RecommendationService.generateRecommendations(userId);

  console.log("[SeedData] Demo environment seed complete.");
  return user;
}
