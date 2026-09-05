"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  ShieldCheck,
  LineChart as LineChartIcon,
  AlertTriangle,
  Calendar,
  CreditCard,
  Target,
  ChevronRight,
  ShieldAlert,
  Loader2,
  Building,
  TrendingUp,
  Receipt,
  CheckCircle2,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { api } from "@/lib/api";
import { formatCurrency, formatDate, CATEGORY_COLORS } from "@/lib/utils";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { WowMomentBanner } from "@/components/WowMomentBanner";

export default function DashboardPage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await api.dashboard.getDashboard();
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090d16] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-7 h-7 text-emerald-400 animate-spin" />
          <p className="text-xs font-medium text-slate-400">Loading Financial Ledger & Accounts...</p>
        </div>
      </div>
    );
  }

  const cards = data?.cards || {};
  const forecast = data?.forecastSummary || {};
  const overspending = data?.overspendingRisk || {};
  const dailySpendingTrend = data?.dailySpendingTrend || [];
  const categoryDistribution = data?.categoryDistribution || [];
  const incomeVsExpense = data?.incomeVsExpense || [];
  const budgets = data?.budgets || [];
  const goals = data?.goals || [];
  const subscriptions = data?.subscriptions || { items: [], count: 0, monthlyTotal: 0 };
  const recommendations = data?.recommendations || [];
  const recentTransactions = data?.recentTransactions || [];
  const alerts = data?.alerts || [];
  const needVsWant = data?.needVsWant || { needs: 50, wants: 30, savings: 20, debt: 0 };

  return (
    <div className="flex min-h-screen bg-[#090d16] text-slate-100">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden md:flex shrink-0" />

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/70" onClick={() => setMobileNavOpen(false)} />
          <Sidebar className="relative z-10 w-64" />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          title="Financial Overview"
          subtitle="Cash Flow, Liquid Reserves & Budget Performance"
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-7 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Interactive Feature Tour (Dismissible / Collapsible) */}
          <WowMomentBanner />

          {/* Critical Risk Alerts */}
          {alerts.length > 0 && (
            <div className="space-y-2">
              {alerts.map((alt: any) => (
                <div
                  key={alt.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium ${
                    alt.type === "warning"
                      ? "bg-amber-500/10 border-amber-500/25 text-amber-200"
                      : "bg-blue-500/10 border-blue-500/25 text-blue-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <div>
                      <span className="font-semibold mr-1.5">{alt.title}:</span>
                      <span>{alt.message}</span>
                    </div>
                  </div>
                  {alt.probability && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold shrink-0">
                      {Math.round(alt.probability * 100)}% Risk
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Top 5 Metrics Cards (Institutional Layout) */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {/* Total Balance */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#0f1624] border border-white/[0.08]">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Liquid Reserves</span>
                <Wallet className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white tabular-nums">
                {formatCurrency(cards.totalBalance || 0)}
              </div>
              <span className="text-[11px] text-emerald-400 font-medium mt-1 block">
                Checking + Savings
              </span>
            </div>

            {/* Monthly Income */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#0f1624] border border-white/[0.08]">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Monthly Inflow</span>
                <ArrowDownRight className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white tabular-nums">
                {formatCurrency(cards.monthlyIncome || 0)}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Regular cash flow</span>
            </div>

            {/* Monthly Expenses */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#0f1624] border border-white/[0.08]">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Monthly Outflow</span>
                <ArrowUpRight className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white tabular-nums">
                {formatCurrency(cards.monthlyExpenses || 0)}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Settled this month
              </span>
            </div>

            {/* Monthly Savings */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#0f1624] border border-white/[0.08]">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Net Savings</span>
                <PiggyBank className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white tabular-nums">
                {formatCurrency(cards.monthlySavings || 0)}
              </div>
              <span className="text-[11px] text-emerald-400 font-medium mt-1 block">
                {cards.savingsRate || 0}% Savings Rate
              </span>
            </div>

            {/* Financial Health Score */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#0f1624] border border-white/[0.08] col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Health Index</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-bold text-emerald-400 tabular-nums">
                  {cards.financialHealth?.score || 82}
                </span>
                <span className="text-xs text-slate-500 font-mono">/100</span>
              </div>
              <span className="text-[11px] text-emerald-300 font-medium block mt-1">
                Tier 1 • {cards.financialHealth?.rating || "Prime"}
              </span>
            </div>
          </div>

          {/* Real-time Spending Forecast Card */}
          <div className="p-5 sm:p-6 rounded-xl bg-[#0f1624] border border-white/[0.08]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <LineChartIcon className="w-4 h-4 text-slate-300" />
                  <h3 className="text-sm sm:text-base font-semibold text-white">
                    30-Day Cash Flow Projections
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Calculated against historical spending pace and upcoming scheduled recurring expenses
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/[0.04] border border-white/[0.08] text-slate-300">
                  Confidence: {forecast.confidence || 87}%
                </span>
                <Link
                  href="/predictions"
                  className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-slate-300 transition-colors flex items-center gap-1"
                >
                  <span>Detailed Projection</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Forecast 4-box Metric Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                <span className="text-[11px] text-slate-400 block mb-1 font-medium">Today&apos;s Outflow</span>
                <span className="text-base sm:text-lg font-bold text-white tabular-nums">
                  {formatCurrency(forecast.todaySpending || 850)}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Recorded today</span>
              </div>

              <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                <span className="text-[11px] text-slate-400 block mb-1 font-medium">Rolling Daily Average</span>
                <span className="text-base sm:text-lg font-bold text-white tabular-nums">
                  {formatCurrency(forecast.averageDailySpending || 720)}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">30-day baseline</span>
              </div>

              <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                <span className="text-[11px] text-slate-400 block mb-1 font-medium">Projected Daily Pace</span>
                <span className="text-base sm:text-lg font-bold text-teal-400 tabular-nums">
                  {formatCurrency(forecast.projectedDailySpending || 790)}
                </span>
                <span className="text-[10px] text-teal-400/80 block mt-0.5">Current velocity</span>
              </div>

              <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20">
                <span className="text-[11px] text-emerald-300 block mb-1 font-medium">Expected Month-End</span>
                <span className="text-base sm:text-lg font-bold text-emerald-400 tabular-nums">
                  {formatCurrency(forecast.predictedMonthEndExpense || 31850)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Range: {formatCurrency(forecast.likelyRange?.likelyLower || 29900)} – {formatCurrency(forecast.likelyRange?.likelyUpper || 34200)}
                </span>
              </div>
            </div>
          </div>

          {/* Analytics Charts Grid: Daily Trend & Category Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Daily Expense Trend (Area Chart) */}
            <div className="p-5 sm:p-6 rounded-xl bg-[#0f1624] border border-white/[0.08] lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">Daily Spending Velocity</h3>
                  <p className="text-xs text-slate-400">Trailing 30 days transaction flow</p>
                </div>
                <span className="text-[11px] font-mono text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
                  Past 30 Days
                </span>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailySpendingTrend}>
                    <defs>
                      <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => d.slice(8)}
                      stroke="#475569"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#475569"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(v) => `₹${v}`}
                    />
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(val), "Outflow"]}
                      labelFormatter={(lbl) => `Date: ${lbl}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorSpend)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Distribution (Donut Chart) */}
            <div className="p-5 sm:p-6 rounded-xl bg-[#0f1624] border border-white/[0.08]">
              <h3 className="text-sm font-semibold text-white mb-1">Expense Breakdown</h3>
              <p className="text-xs text-slate-400 mb-3">Top categories by volume</p>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {categoryDistribution.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CATEGORY_COLORS[entry.name] || "#64748b"}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend List */}
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-24 overflow-y-auto text-xs">
                {categoryDistribution.slice(0, 6).map((cat: any) => (
                  <div key={cat.name} className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[cat.name] || "#64748b" }}
                    />
                    <span className="text-slate-300 truncate text-[11px]">{cat.name}:</span>
                    <span className="font-semibold text-white text-[11px] tabular-nums">{cat.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Need vs Want 50/30/20 & Income vs Expense */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* 50/30/20 Rule Breakdown */}
            <div className="p-5 sm:p-6 rounded-xl bg-[#0f1624] border border-white/[0.08]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">50/30/20 Allocation</h3>
                  <p className="text-xs text-slate-400">Needs, Wants, and Net Capital Growth</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/[0.04] text-slate-300 border border-white/10">
                  Standard
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">Needs (Target 50%)</span>
                    <span className="font-bold text-white tabular-nums">{needVsWant.needs}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${needVsWant.needs}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">Wants (Target 30%)</span>
                    <span className="font-bold text-white tabular-nums">{needVsWant.wants}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${needVsWant.wants}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">Savings & Investments (Target 20%)</span>
                    <span className="font-bold text-white tabular-nums">{needVsWant.savings}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${needVsWant.savings}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Income vs Expense Bar Chart */}
            <div className="p-5 sm:p-6 rounded-xl bg-[#0f1624] border border-white/[0.08] lg:col-span-2">
              <h3 className="text-sm font-semibold text-white mb-1">Monthly Flow Comparison</h3>
              <p className="text-xs text-slate-400 mb-3">Inflows vs Outflows vs Net Accumulation</p>

              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={incomeVsExpense}>
                    <XAxis dataKey="month" stroke="#475569" fontSize={11} tickLine={false} />
                    <YAxis stroke="#475569" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip formatter={(v: any) => formatCurrency(v)} />
                    <Bar dataKey="income" name="Inflows" fill="#10b981" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="expenses" name="Outflows" fill="#f43f5e" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="savings" name="Retained" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Budget Adherence & Optimization Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Category Budgets & Limits */}
            <div className="p-5 sm:p-6 rounded-xl bg-[#0f1624] border border-white/[0.08]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">Budget Adherence</h3>
                  <p className="text-xs text-slate-400">Category limits and current utilization</p>
                </div>
                <Link
                  href="/budgets"
                  className="text-xs font-medium text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <span>Manage Limits</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3.5">
                {budgets.slice(0, 5).map((b: any) => (
                  <div key={b.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-white flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLORS[b.category] || "#10b981" }}
                        />
                        {b.category}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 tabular-nums">
                          {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            b.status === "exceeded"
                              ? "bg-rose-500/20 text-rose-300"
                              : b.status === "warning"
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-emerald-500/20 text-emerald-300"
                          }`}
                        >
                          {b.utilization}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          b.status === "exceeded"
                            ? "bg-rose-500"
                            : b.status === "warning"
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(100, b.utilization)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Opportunities & Optimizations */}
            <div className="p-5 sm:p-6 rounded-xl bg-[#0f1624] border border-white/[0.08]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">Savings Opportunities</h3>
                  <p className="text-xs text-slate-400">Automated patterns detected across discretionary spending</p>
                </div>
                <span className="text-xs text-slate-400 font-mono">Active Analysis</span>
              </div>

              <div className="space-y-3">
                {recommendations.slice(0, 3).map((rec: any, i: number) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:border-white/10 transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{rec.title}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                          rec.priority === "HIGH"
                            ? "bg-rose-500/20 text-rose-300"
                            : "bg-blue-500/20 text-blue-300"
                        }`}
                      >
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">{rec.evidence}</p>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/[0.04]">
                      <span className="text-emerald-400 font-medium tabular-nums">
                        Potential: +{formatCurrency(rec.estimatedMonthlySaving)}/mo
                      </span>
                      <span className="text-slate-500 truncate max-w-[160px]">{rec.suggestedAction}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Transactions Table */}
          <div className="p-5 sm:p-6 rounded-xl bg-[#0f1624] border border-white/[0.08]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Recent Ledger Transactions</h3>
                <p className="text-xs text-slate-400">Synchronized from connected accounts</p>
              </div>
              <Link
                href="/transactions"
                className="text-xs font-medium text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>View Full Ledger</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-slate-400">
                    <th className="pb-2.5 font-medium">Date</th>
                    <th className="pb-2.5 font-medium">Description</th>
                    <th className="pb-2.5 font-medium">Category</th>
                    <th className="pb-2.5 font-medium">Merchant / Counterparty</th>
                    <th className="pb-2.5 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {recentTransactions.slice(0, 7).map((t: any) => (
                    <tr key={t.id || t._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 text-slate-400 font-mono text-[11px]">
                        {formatDate(t.date)}
                      </td>
                      <td className="py-2.5 font-medium text-slate-200">
                        {t.description}
                      </td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.04] text-slate-300 border border-white/[0.06]">
                          {t.category}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-400">
                        {t.merchant || "Direct Transfer"}
                      </td>
                      <td className={`py-2.5 text-right font-semibold tabular-nums ${
                        t.type === "income" ? "text-emerald-400" : "text-slate-200"
                      }`}>
                        {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
