"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Printer,
  Calendar,
  Sparkles,
  TrendingUp,
  Target,
  ShieldCheck,
  AlertTriangle,
  Download,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate, CATEGORY_COLORS } from "@/lib/utils";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";

export default function ReportsPage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [period, setPeriod] = useState<"weekly" | "monthly" | "quarterly">("monthly");

  const { data, isLoading } = useQuery({
    queryKey: ["reports", period],
    queryFn: async () => {
      const res = await api.reports.get(period);
      return res.data?.report;
    },
  });

  const handlePrint = () => {
    window.print();
  };

  const report = data || {};
  const meta = report.metadata || {};
  const summary = report.summary || {};
  const topCategories = report.topCategories || [];
  const budgets = report.budgetAdherence || [];
  const recs = report.recommendationsSnippet || [];
  const goals = report.goalsSnippet || [];

  return (
    <div className="flex min-h-screen bg-[#090d16] text-slate-100">
      <Sidebar className="hidden md:flex shrink-0 print:hidden" />

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden print:hidden">
          <div className="fixed inset-0 bg-black/70" onClick={() => setMobileNavOpen(false)} />
          <Sidebar className="relative z-10 w-64" />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="print:hidden">
          <Navbar
            title="Financial Statements & Reports"
            subtitle="Executive cash flow summaries and periodic ledger statements"
            onOpenMobileNav={() => setMobileNavOpen(true)}
          />
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto max-w-5xl mx-auto w-full">
          {/* Controls Bar (hidden during print) */}
          <div className="p-4 sm:p-5 rounded-2xl glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
            {/* Period Selector */}
            <div className="flex items-center bg-[#111827] border border-white/[0.1] p-1 rounded-xl">
              {[
                { label: "Weekly Briefing", val: "weekly" },
                { label: "Monthly Statement", val: "monthly" },
                { label: "Quarterly Review", val: "quarterly" },
              ].map((p) => (
                <button
                  key={p.val}
                  onClick={() => setPeriod(p.val as any)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    period === p.val
                      ? "bg-emerald-500 text-gray-950 shadow-md"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all self-start sm:self-auto"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Export PDF</span>
            </button>
          </div>

          {/* Printable Report Document Card */}
          <div className="p-8 sm:p-12 rounded-2xl bg-[#090d16] border border-white/[0.1] shadow-2xl space-y-8 print:border-none print:shadow-none print:p-0">
            {/* Report Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/[0.1] pb-6 gap-4">
              <div>
                <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider block mb-1">
                  FinTwin AI Intelligence Statement
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white">
                  {meta.periodTitle || "Financial Statement"}
                </h1>
                <p className="text-xs text-gray-400 mt-1">
                  Prepared for: <strong className="text-white">{meta.userName}</strong> ({meta.email})
                </p>
              </div>

              <div className="text-right sm:text-right text-xs text-gray-400 font-mono">
                <div>Statement ID: {meta.reportId}</div>
                <div>Generated: {formatDate(meta.generatedAt || new Date())}</div>
                <div>Currency: {meta.currency || "INR"}</div>
              </div>
            </div>

            {/* Executive KPI Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <span className="text-xs text-gray-400 block mb-1">Total Inflow</span>
                <span className="text-xl font-black text-emerald-400">
                  {formatCurrency(summary.totalIncome || 0)}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <span className="text-xs text-gray-400 block mb-1">Total Outflow</span>
                <span className="text-xl font-black text-rose-400">
                  {formatCurrency(summary.totalExpense || 0)}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <span className="text-xs text-gray-400 block mb-1">Net Savings</span>
                <span className="text-xl font-black text-blue-400">
                  {formatCurrency(summary.netSavings || 0)}
                </span>
                <span className="text-[11px] text-gray-400 block mt-0.5">
                  Savings Rate: {summary.savingsRate || 0}%
                </span>
              </div>

              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                <span className="text-xs text-emerald-300 block mb-1">Health Score</span>
                <span className="text-2xl font-black text-emerald-400">
                  {summary.financialHealthScore || 82}/100
                </span>
                <span className="text-[11px] text-emerald-300 font-semibold block mt-0.5">
                  Rating: {summary.healthRating || "Good"}
                </span>
              </div>
            </div>

            {/* Top Categories Breakdown Table */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Top Spending Allocations
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-gray-400">
                      <th className="pb-2">Category</th>
                      <th className="pb-2 text-right">Amount</th>
                      <th className="pb-2 text-right">% of Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {topCategories.map((c: any) => (
                      <tr key={c.category} className="py-2">
                        <td className="py-2.5 font-medium text-white flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: CATEGORY_COLORS[c.category] || "#10b981" }}
                          />
                          {c.category}
                        </td>
                        <td className="py-2.5 text-right font-bold text-gray-200">
                          {formatCurrency(c.amount)}
                        </td>
                        <td className="py-2.5 text-right text-gray-400 font-mono">
                          {c.percentage}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Budget Performance */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Budget Compliance
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {budgets.slice(0, 4).map((b: any) => (
                  <div key={b.category} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs">
                    <span className="font-semibold text-white block truncate">{b.category}</span>
                    <span className="text-gray-400 block text-[11px] mt-1">
                      {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                    </span>
                    <span
                      className={`font-bold text-[10px] mt-1 block uppercase ${
                        b.utilization > 100
                          ? "text-rose-400"
                          : b.utilization > 80
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {b.utilization}% Limit Used
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Actionable Recommendations Snippet */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                AI Optimization Recommendations
              </h3>
              <div className="space-y-2">
                {recs.map((r: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{r.title}</span>
                      <span className="text-emerald-400 font-semibold">
                        +{formatCurrency(r.estimatedMonthlySaving)}/mo potential
                      </span>
                    </div>
                    <p className="text-gray-400 text-[11px]">{r.suggestedAction}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Document Verification Footer */}
            <div className="pt-6 border-t border-white/[0.08] text-center text-[11px] text-gray-500">
              <p>
                FinTwin AI Platform — Certified Machine Learning & Deterministic Financial Synthesis.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
