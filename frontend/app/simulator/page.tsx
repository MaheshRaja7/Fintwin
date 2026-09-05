"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  SlidersHorizontal,
  ArrowRight,
  Target,
  PiggyBank,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";

const PRESET_SCENARIOS = [
  {
    title: "Reduce Shopping by 30%",
    categoryToAdjust: "Shopping",
    categoryAdjustmentPercent: -30,
    plannedPurchaseAmount: 0,
    incomeChange: 0,
  },
  {
    title: "Increase Inflow (+₹5,000)",
    categoryToAdjust: "",
    categoryAdjustmentPercent: 0,
    plannedPurchaseAmount: 0,
    incomeChange: 5000,
  },
  {
    title: "Rent Increase (+₹2,000)",
    categoryToAdjust: "",
    categoryAdjustmentPercent: 0,
    plannedPurchaseAmount: 0,
    recurringExpenseChange: 2000,
    incomeChange: 0,
  },
  {
    title: "Capital Purchase (₹8,000)",
    categoryToAdjust: "",
    categoryAdjustmentPercent: 0,
    plannedPurchaseAmount: 8000,
    plannedPurchaseItem: "Sony WH-1000XM5 Headphones",
    incomeChange: 0,
  },
  {
    title: "Extra Savings (+₹3,000/mo)",
    categoryToAdjust: "",
    categoryAdjustmentPercent: 0,
    plannedPurchaseAmount: 0,
    extraMonthlySavings: 3000,
    incomeChange: 0,
  },
];

export default function SimulatorPage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Scenario parameters
  const [categoryToAdjust, setCategoryToAdjust] = useState("Shopping");
  const [categoryAdjustmentPercent, setCategoryAdjustmentPercent] = useState(-30);
  const [plannedPurchaseAmount, setPlannedPurchaseAmount] = useState(0);
  const [plannedPurchaseItem, setPlannedPurchaseItem] = useState("");
  const [incomeChange, setIncomeChange] = useState(0);
  const [recurringExpenseChange, setRecurringExpenseChange] = useState(0);

  const { data: simData, isLoading } = useQuery({
    queryKey: [
      "simulation",
      categoryToAdjust,
      categoryAdjustmentPercent,
      plannedPurchaseAmount,
      incomeChange,
      recurringExpenseChange,
    ],
    queryFn: async () => {
      const res = await api.ai.simulate({
        categoryToAdjust: categoryToAdjust || undefined,
        categoryAdjustmentPercent,
        plannedPurchaseAmount,
        plannedPurchaseItem,
        incomeChange,
        recurringExpenseChange,
      });
      return res.data?.simulation;
    },
  });

  const applyPreset = (preset: any) => {
    setCategoryToAdjust(preset.categoryToAdjust || "");
    setCategoryAdjustmentPercent(preset.categoryAdjustmentPercent || 0);
    setPlannedPurchaseAmount(preset.plannedPurchaseAmount || 0);
    setPlannedPurchaseItem(preset.plannedPurchaseItem || "");
    setIncomeChange(preset.incomeChange || 0);
    setRecurringExpenseChange(preset.recurringExpenseChange || 0);
  };

  const sim = simData || {
    baseline: { monthlyIncome: 50000, monthlyExpenses: 30000, monthlySavings: 20000, healthScore: 82 },
    projected: { monthlyIncome: 50000, monthlyExpenses: 27900, monthlySavings: 22100, healthScore: 85 },
    impact: {
      monthlySavingsDelta: 2100,
      annualSavingsDelta: 25200,
      healthScoreDelta: 3,
      affordabilityVerdict: "Highly Affordable",
      goalImpact: {
        goalName: "MacBook Pro / Laptop",
        originalMonthsRemaining: 4.2,
        simulatedMonthsRemaining: 3.5,
        deltaMonths: -0.7,
        explanation: "You will achieve your MacBook Pro / Laptop goal 0.7 months earlier!",
      },
    },
    narrativeSummary: "Trimming Shopping by 30% adds ₹2,100 to monthly savings.",
  };

  const comparisonData = [
    {
      metric: "Monthly Outflows",
      Baseline: sim.baseline.monthlyExpenses,
      Simulated: sim.projected.monthlyExpenses,
    },
    {
      metric: "Monthly Net Savings",
      Baseline: sim.baseline.monthlySavings,
      Simulated: sim.projected.monthlySavings,
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#090d16] text-slate-100">
      <Sidebar className="hidden md:flex shrink-0" />

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/70" onClick={() => setMobileNavOpen(false)} />
          <Sidebar className="relative z-10 w-64" />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          title="Scenario & Capital Modeler"
          subtitle="Simulate major life purchases, savings acceleration, and lifestyle adjustments"
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-7 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Preset Scenarios Strip */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Standard Financial Scenarios
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {PRESET_SCENARIOS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => applyPreset(p)}
                  className="p-3 rounded-lg bg-[#0f1624] hover:bg-white/[0.04] border border-white/[0.08] hover:border-white/20 text-left text-xs font-medium text-slate-200 transition-all active:scale-[0.98]"
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Interactive Simulator Controls */}
            <div className="p-5 sm:p-6 rounded-xl bg-[#0f1624] border border-white/[0.08] space-y-5 lg:col-span-1">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Simulation Variables</h3>
              </div>

              {/* 1. Category Adjustment */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Target Category</span>
                  <select
                    value={categoryToAdjust}
                    onChange={(e) => setCategoryToAdjust(e.target.value)}
                    className="bg-black/40 border border-white/[0.08] rounded-md px-2.5 py-1 text-xs text-white"
                  >
                    <option value="Shopping">Shopping</option>
                    <option value="Food">Food / Dining</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Subscriptions">Subscriptions</option>
                    <option value="Travel">Travel</option>
                  </select>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Adjustment Rate</span>
                  <span className="font-semibold text-white font-mono">
                    {categoryAdjustmentPercent > 0 ? `+${categoryAdjustmentPercent}%` : `${categoryAdjustmentPercent}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-70"
                  max="50"
                  step="5"
                  value={categoryAdjustmentPercent}
                  onChange={(e) => setCategoryAdjustmentPercent(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500 bg-slate-700 h-1 rounded-lg cursor-pointer"
                />
              </div>

              {/* 2. Planned Purchase */}
              <div className="space-y-2 pt-3 border-t border-white/[0.06]">
                <label className="text-xs font-medium text-slate-300 block">
                  One-Time Capital Purchase (₹)
                </label>
                <input
                  type="number"
                  value={plannedPurchaseAmount || ""}
                  onChange={(e) => setPlannedPurchaseAmount(parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 8000"
                  className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  value={plannedPurchaseItem}
                  onChange={(e) => setPlannedPurchaseItem(e.target.value)}
                  placeholder="Item description (e.g. Headphones, Appliance)"
                  className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* 3. Income Change */}
              <div className="space-y-2 pt-3 border-t border-white/[0.06]">
                <label className="text-xs font-medium text-slate-300 block">
                  Monthly Income Delta (+ / - ₹)
                </label>
                <input
                  type="number"
                  value={incomeChange || ""}
                  onChange={(e) => setIncomeChange(parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 5000 (Promotion / Increment)"
                  className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setCategoryAdjustmentPercent(0);
                  setPlannedPurchaseAmount(0);
                  setPlannedPurchaseItem("");
                  setIncomeChange(0);
                  setRecurringExpenseChange(0);
                }}
                className="w-full py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-xs font-medium text-slate-400 transition-colors"
              >
                Reset Parameters
              </button>
            </div>

            {/* Simulation Impact & Before/After Visualizer */}
            <div className="p-5 sm:p-6 rounded-xl bg-[#0f1624] border border-white/[0.08] lg:col-span-2 space-y-5">
              {/* Verdict Banner */}
              <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.08] flex items-start gap-3">
                <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-white">
                      Assessment: {sim.impact?.affordabilityVerdict || "Viable"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {sim.narrativeSummary}
                  </p>
                </div>
              </div>

              {/* 4 Impact Summary KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-[11px] text-slate-400 block font-medium">Monthly Savings Delta</span>
                  <span
                    className={`text-base font-bold block mt-0.5 tabular-nums ${
                      sim.impact?.monthlySavingsDelta >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {sim.impact?.monthlySavingsDelta >= 0 ? "+" : ""}
                    {formatCurrency(sim.impact?.monthlySavingsDelta || 0)}
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-[11px] text-slate-400 block font-medium">Annualized Delta</span>
                  <span
                    className={`text-base font-bold block mt-0.5 tabular-nums ${
                      sim.impact?.annualSavingsDelta >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {sim.impact?.annualSavingsDelta >= 0 ? "+" : ""}
                    {formatCurrency(sim.impact?.annualSavingsDelta || 0)}
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-[11px] text-slate-400 block font-medium">Health Index Shift</span>
                  <span className="text-base font-bold text-white block mt-0.5 tabular-nums">
                    {sim.impact?.healthScoreDelta >= 0 ? "+" : ""}
                    {sim.impact?.healthScoreDelta || 0} pts
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-[11px] text-slate-400 block font-medium">Goal Timeline Variance</span>
                  <span className="text-xs font-semibold text-teal-300 block mt-1 truncate">
                    {sim.impact?.goalImpact?.deltaMonths !== undefined
                      ? sim.impact.goalImpact.deltaMonths <= 0
                        ? `${Math.abs(sim.impact.goalImpact.deltaMonths)} mos earlier`
                        : `${sim.impact.goalImpact.deltaMonths} mos delay`
                      : "On schedule"}
                  </span>
                </div>
              </div>

              {/* Before vs After Bar Comparison Chart */}
              <div>
                <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
                  Baseline vs Simulated Outflow & Savings Comparison
                </h4>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData}>
                      <XAxis dataKey="metric" stroke="#475569" fontSize={11} tickLine={false} />
                      <YAxis stroke="#475569" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                      <Tooltip formatter={(v: any) => formatCurrency(v)} />
                      <Bar dataKey="Baseline" fill="#475569" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="Simulated" fill="#10b981" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Detailed Goal Timeline Shift Card */}
              {sim.impact?.goalImpact && (
                <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Target className="w-4 h-4 text-emerald-400" />
                    <div>
                      <h5 className="text-xs font-semibold text-white">
                        Impact on {sim.impact.goalImpact.goalName} Goal
                      </h5>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {sim.impact.goalImpact.explanation}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-300 shrink-0">
                    {sim.impact.goalImpact.simulatedMonthsRemaining} months remaining
                  </span>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
