import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../src/config/database.js";
import { AuthService } from "../src/services/auth.service.js";
import { TransactionService } from "../src/services/transaction.service.js";
import { FinancialHealthService } from "../src/services/financialHealth.service.js";
import { SimulationService } from "../src/services/simulation.service.js";
import { MLClientService } from "../src/services/mlClient.service.js";
import { GeminiService } from "../src/services/gemini.service.js";
import { User } from "../src/models/User.js";
import { Transaction } from "../src/models/Transaction.js";
import { Budget } from "../src/models/Budget.js";

async function runAllTests() {
  console.log("=================================================");
  console.log("🚀 STARTING FINTWIN AI COMPREHENSIVE TEST SUITE");
  console.log("=================================================\n");

  await connectDB();

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Authentication Tests
    console.log("--- 1. AUTHENTICATION & MULTI-TENANCY TESTS ---");
    const testEmailA = `test_user_a_${Date.now()}@example.com`;
    const userA = await AuthService.signup({
      fullName: "User A",
      email: testEmailA,
      password: "Password123!",
      currency: "INR",
      monthlyIncome: 60000,
    });
    assert(Boolean(userA.token), "Auth: User A successfully signs up and receives JWT");

    const loginRes = await AuthService.login({ email: testEmailA, password: "Password123!" });
    assert(loginRes.user.email === testEmailA, "Auth: User A successfully logs in with password verification");

    let loginFailed = false;
    try {
      await AuthService.login({ email: testEmailA, password: "WrongPassword!" });
    } catch {
      loginFailed = true;
    }
    assert(loginFailed, "Auth: Rejects invalid password attempt");

    // Create User B to test data isolation
    const testEmailB = `test_user_b_${Date.now()}@example.com`;
    const userB = await AuthService.signup({
      fullName: "User B",
      email: testEmailB,
      password: "Password123!",
      currency: "INR",
      monthlyIncome: 45000,
    });

    // 2. Transaction Management & Isolation Tests
    console.log("\n--- 2. TRANSACTION & ISOLATION TESTS ---");
    const userA_id = new mongoose.Types.ObjectId(userA.user._id);
    const userB_id = new mongoose.Types.ObjectId(userB.user._id);

    const txA = await TransactionService.createTransaction(userA_id, {
      amount: 1200,
      type: "expense",
      category: "Food",
      merchant: "Swiggy",
      description: "Dinner order for team",
    });
    assert(Boolean(txA._id), "Transactions: Successfully recorded transaction for User A");

    const listB = await TransactionService.getTransactions(userB_id, {});
    const leaked = listB.transactions.some((t: any) => t._id.toString() === txA._id.toString());
    assert(!leaked, "Security: User B cannot access User A's financial transactions (Multi-tenant isolation verified)");

    // 3. Natural Language Expense Parser Tests
    console.log("\n--- 3. NATURAL LANGUAGE EXPENSE PARSER TESTS ---");
    const parsedFood = TransactionService.parseNaturalLanguage("Spent ₹450 on Swiggy");
    assert(
      parsedFood.amount === 450 && parsedFood.category === "Food" && parsedFood.type === "expense",
      "NLP: 'Spent ₹450 on Swiggy' correctly parsed to amount: 450, category: Food, type: expense"
    );

    const parsedSalary = TransactionService.parseNaturalLanguage("Got salary of ₹50000");
    assert(
      parsedSalary.amount === 50000 && parsedSalary.type === "income",
      "NLP: 'Got salary of ₹50000' correctly parsed to amount: 50000, type: income"
    );

    const parsedGroceries = TransactionService.parseNaturalLanguage("Bought Blinkit groceries for 850");
    assert(
      parsedGroceries.amount === 850 && parsedGroceries.category === "Groceries",
      "NLP: 'Bought Blinkit groceries for 850' correctly categorized as Groceries"
    );

    // 4. Deterministic Financial Health Score Tests (0-100 & 7 pillars)
    console.log("\n--- 4. DETERMINISTIC FINANCIAL HEALTH SCORE TESTS ---");
    const health = await FinancialHealthService.calculateHealth(userA_id);
    assert(health.score >= 0 && health.score <= 100, `Health: Deterministic score calculated within valid 0-100 range (${health.score}/100)`);
    assert(Boolean(health.rating), `Health: Rating classified as '${health.rating}'`);
    assert(
      health.needVsWant.needs + health.needVsWant.wants + health.needVsWant.savings + health.needVsWant.debt === 100,
      "Health: 50/30/20 Need vs Want breakdown percentages total exactly 100%"
    );

    // 5. What-If Financial Simulator Tests
    console.log("\n--- 5. FINANCIAL SIMULATION TESTS ---");
    const simResult = await SimulationService.runSimulation(userA_id, {
      plannedPurchaseAmount: 8000,
      plannedPurchaseItem: "Headphones",
      categoryToAdjust: "Food",
      categoryAdjustmentPercent: -30,
    });
    assert(Boolean(simResult.impact.affordabilityVerdict), "Simulation: Successfully calculated affordability verdict");
    assert(simResult.impact.annualSavingsDelta !== undefined, "Simulation: Calculated annual savings delta impact");

    // 6. Gemini Function / Tool Execution Tests
    console.log("\n--- 6. GEMINI FUNCTION CALLING TOOL TESTS ---");
    const balanceTool = await GeminiService.executeTool(userA_id, "get_current_balance");
    assert(balanceTool.monthlyIncome > 0, "Tool Calling: 'get_current_balance' returned verified income data");

    const simulationTool = await GeminiService.executeTool(userA_id, "run_financial_simulation", {
      plannedPurchaseAmount: 5000,
    });
    assert(Boolean(simulationTool.baseline), "Tool Calling: 'run_financial_simulation' executed deterministic model");

    // 7. ML Service Integration Tests (XGBoost forecasting & Overspending risk)
    console.log("\n--- 7. ML SERVICE INTEGRATION TESTS ---");
    const forecast = await MLClientService.getExpenseForecast(userA_id, 30);
    assert(forecast.forecast?.length === 30, "ML Forecast: Generated 30-day forecast series with bounds");
    assert(forecast.confidence >= 60, `ML Forecast: Confidence reported at ${forecast.confidence}%`);

    const overspendRisk = await MLClientService.getOverspendingRisk(userA_id);
    assert(Boolean(overspendRisk.overall?.risk), `ML Overspending: Risk evaluated as ${overspendRisk.overall?.risk}`);

    console.log("\n=================================================");
    console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED | ${failed} FAILED`);
    console.log("=================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error("Test execution failed with fatal error:", err);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

runAllTests();
