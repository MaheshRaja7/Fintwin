"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Zap,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  Home,
  Target,
  PiggyBank,
  CreditCard,
  Sparkles,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const GOAL_OPTIONS = [
  { name: "Emergency Fund", icon: "🛡️", defaultTarget: 150000 },
  { name: "MacBook / Laptop", icon: "💻", defaultTarget: 75000 },
  { name: "Bike / Vehicle", icon: "🏍️", defaultTarget: 120000 },
  { name: "Vacation / Travel", icon: "✈️", defaultTarget: 80000 },
  { name: "Education / Upskilling", icon: "🎓", defaultTarget: 50000 },
  { name: "Home Down Payment", icon: "🏠", defaultTarget: 500000 },
  { name: "Stocks / Investment", icon: "📈", defaultTarget: 100000 },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, updateOnboarding } = useAuth();

  const [step, setStep] = useState(1);
  const [monthlyIncome, setMonthlyIncome] = useState(user?.monthlyIncome || 50000);
  const [fixedExpenses, setFixedExpenses] = useState(16000);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(["Emergency Fund", "MacBook / Laptop"]);
  const [monthlySavingsTarget, setMonthlySavingsTarget] = useState(10000);
  const [hasDebt, setHasDebt] = useState(false);
  const [debtAmount, setDebtAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleGoal = (goalName: string) => {
    if (selectedGoals.includes(goalName)) {
      setSelectedGoals(selectedGoals.filter((g) => g !== goalName));
    } else {
      setSelectedGoals([...selectedGoals, goalName]);
    }
  };

  const handleNext = async () => {
    if (step < 5) {
      setStep(step + 1);
      return;
    }

    if (step === 5) {
      // Transition to final Step 6 evaluation
      setStep(6);
      return;
    }

    // Step 6 finish
    setIsSubmitting(true);
    try {
      const formattedGoals = selectedGoals.map((name) => {
        const template = GOAL_OPTIONS.find((g) => g.name === name);
        return {
          name,
          targetAmount: template?.defaultTarget || 50000,
          currentAmount: 0,
          targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        };
      });

      await updateOnboarding({
        step: 6,
        monthlyIncome,
        fixedMonthlyExpenses: fixedExpenses,
        monthlySavingsTarget,
        goals: formattedGoals,
        hasDebt,
        debtAmount,
        riskTolerance: "moderate",
      });

      router.push("/dashboard");
    } catch (err: any) {
      alert(err.message || "Failed to finalize onboarding.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 6 Computed Metrics
  const estimatedSavingsRate = Math.round((monthlySavingsTarget / Math.max(1, monthlyIncome)) * 100);
  const initialHealthScore = Math.min(
    95,
    Math.max(
      45,
      Math.round(
        50 +
          (estimatedSavingsRate >= 20 ? 25 : estimatedSavingsRate) -
          (hasDebt ? 15 : 0) +
          (fixedExpenses / monthlyIncome <= 0.4 ? 15 : 5)
      )
    )
  );

  return (
    <div className="min-h-screen bg-[#030712] text-white flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-xl">
        {/* Step Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span className="font-bold text-emerald-400">Step {step} of 6</span>
            <span>{Math.round((step / 6) * 100)}% Complete</span>
          </div>
          <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
              style={{ width: `${(step / 6) * 100}%` }}
            />
          </div>
        </div>

        {/* Main Card */}
        <div className="p-6 sm:p-8 rounded-2xl glass-card relative overflow-hidden">
          {/* Step 1: Income */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">What is your monthly net income?</h2>
                <p className="text-xs text-gray-400 mt-1">Take-home salary, freelancing, or steady incoming cash flow.</p>
              </div>

              <div className="pt-3">
                <label className="text-xs text-gray-400 block mb-1">Monthly Income (₹)</label>
                <input
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(parseFloat(e.target.value) || 0)}
                  className="w-full text-2xl font-extrabold bg-[#111827] border border-white/[0.12] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2">
                {[30000, 50000, 75000, 100000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setMonthlyIncome(amt)}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-gray-300 border border-white/[0.05]"
                  >
                    ₹{(amt / 1000).toFixed(0)}k
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Fixed Expenses */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Home className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">What are your fixed monthly expenses?</h2>
                <p className="text-xs text-gray-400 mt-1">Rent, utility bills, internet, insurance, and regular essentials.</p>
              </div>

              <div className="pt-3">
                <label className="text-xs text-gray-400 block mb-1">Fixed Expenses (₹)</label>
                <input
                  type="number"
                  value={fixedExpenses}
                  onChange={(e) => setFixedExpenses(parseFloat(e.target.value) || 0)}
                  className="w-full text-2xl font-extrabold bg-[#111827] border border-white/[0.12] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  Represents {Math.round((fixedExpenses / Math.max(1, monthlyIncome)) * 100)}% of your monthly income.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Goals */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">What are your primary financial goals?</h2>
                <p className="text-xs text-gray-400 mt-1">Select targets you are saving towards right now.</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2 max-h-64 overflow-y-auto pr-1">
                {GOAL_OPTIONS.map((g) => {
                  const isSelected = selectedGoals.includes(g.name);
                  return (
                    <button
                      key={g.name}
                      type="button"
                      onClick={() => toggleGoal(g.name)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-emerald-500/15 border-emerald-500/50 text-white"
                          : "bg-white/[0.03] border-white/[0.08] text-gray-400 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{g.icon}</span>
                        <span className="text-xs font-semibold">{g.name}</span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: Savings Target */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                <PiggyBank className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">How much do you want to save each month?</h2>
                <p className="text-xs text-gray-400 mt-1">We recommend setting aside at least 20% of net income.</p>
              </div>

              <div className="pt-3">
                <label className="text-xs text-gray-400 block mb-1">Monthly Savings Goal (₹)</label>
                <input
                  type="number"
                  value={monthlySavingsTarget}
                  onChange={(e) => setMonthlySavingsTarget(parseFloat(e.target.value) || 0)}
                  className="w-full text-2xl font-extrabold bg-[#111827] border border-white/[0.12] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                />
                <p className="text-xs text-emerald-400 font-semibold mt-1.5">
                  Savings Target: {estimatedSavingsRate}% of net income ({estimatedSavingsRate >= 20 ? "Excellent" : "Decent start"})
                </p>
              </div>
            </div>
          )}

          {/* Step 5: Debt / Loans */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Do you have existing loans or debt obligations?</h2>
                <p className="text-xs text-gray-400 mt-1">Credit cards, student loans, EMI obligations, or personal debt.</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setHasDebt(false)}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    !hasDebt
                      ? "bg-emerald-500/15 border-emerald-500/50 text-white font-bold"
                      : "bg-white/[0.03] border-white/[0.08] text-gray-400"
                  }`}
                >
                  No Debt / Paid Off
                </button>
                <button
                  type="button"
                  onClick={() => setHasDebt(true)}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    hasDebt
                      ? "bg-amber-500/15 border-amber-500/50 text-white font-bold"
                      : "bg-white/[0.03] border-white/[0.08] text-gray-400"
                  }`}
                >
                  Yes, Active Loans/EMI
                </button>
              </div>

              {hasDebt && (
                <div className="pt-2 animate-in fade-in duration-200">
                  <label className="text-xs text-gray-400 block mb-1">Total Outstanding Debt Amount (₹)</label>
                  <input
                    type="number"
                    value={debtAmount}
                    onChange={(e) => setDebtAmount(parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 45000"
                    className="w-full text-lg font-bold bg-[#111827] border border-white/[0.12] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 6: Initial Synthesis & Twin Calibration */}
          {step === 6 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Financial Twin Calibrated</span>
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-white">Your Initial Baseline Overview</h2>
                <p className="text-xs text-gray-400 mt-1">Here is the baseline profile generated from your inputs:</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                  <span className="text-[11px] text-gray-400 block">Initial Health Score</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-emerald-400">{initialHealthScore}</span>
                    <span className="text-xs text-gray-500">/100</span>
                  </div>
                  <span className="text-[10px] text-emerald-300 font-semibold">
                    {initialHealthScore >= 75 ? "Strong Foundation" : "Good Starting Position"}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                  <span className="text-[11px] text-gray-400 block">Recommended Budget</span>
                  <span className="text-xl font-bold text-white block mt-1">
                    {formatCurrency(monthlyIncome - monthlySavingsTarget)}
                  </span>
                  <span className="text-[10px] text-gray-400">Target Monthly Living Spend</span>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                  <span className="text-[11px] text-gray-400 block">Emergency Target</span>
                  <span className="text-xl font-bold text-white block mt-1">
                    {formatCurrency(fixedExpenses * 3)}
                  </span>
                  <span className="text-[10px] text-gray-400">3-Month Safety Cushion</span>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                  <span className="text-[11px] text-gray-400 block">Risk Profile</span>
                  <span className="text-xl font-bold text-emerald-400 block mt-1">Moderate</span>
                  <span className="text-[10px] text-gray-400">Balanced Wealth Growth</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-white/[0.08]">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 rounded-xl text-gray-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div></div>
            )}

            <button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-95"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : step === 6 ? (
                <>
                  <span>Enter My FinTwin Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
