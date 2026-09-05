"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PieChart,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  Edit2,
  Trash2,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency, CATEGORY_COLORS } from "@/lib/utils";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";

export default function BudgetsPage() {
  const queryClient = useQueryClient();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Edit/Create Budget Modal state
  const [isEditing, setIsEditing] = useState(false);
  const [editingCategory, setEditingCategory] = useState("Food");
  const [editingLimit, setEditingLimit] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["budgets"],
    queryFn: async () => {
      const res = await api.budgets.get();
      return res.data;
    },
  });

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const limitNum = parseFloat(editingLimit);
    if (isNaN(limitNum) || limitNum <= 0) {
      alert("Please enter a valid limit.");
      return;
    }

    try {
      await api.budgets.set({
        category: editingCategory,
        limit: limitNum,
        period: "monthly",
      });
      await queryClient.invalidateQueries({ queryKey: ["budgets"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setIsEditing(false);
      setEditingLimit("");
    } catch (err: any) {
      alert(err.message || "Failed to update budget.");
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!confirm("Are you sure you want to delete this budget category?")) return;
    try {
      await api.budgets.delete(id);
      await queryClient.invalidateQueries({ queryKey: ["budgets"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (err: any) {
      alert(err.message || "Failed to delete.");
    }
  };

  const budgets = data?.budgets || [];
  const summary = data?.summary || { totalLimit: 0, totalSpent: 0, totalRemaining: 0, overallUtilization: 0, daysRemaining: 15 };

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
          title="Budgets & Spending Limits"
          subtitle="Category allocation thresholds and spending limit controls"
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Top Summary Banner */}
          <div className="p-6 rounded-2xl glass-card flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <span className="text-xs font-semibold text-gray-400">Total Monthly Budget</span>
              <div className="text-3xl font-black text-white mt-1">
                {formatCurrency(summary.totalLimit)}
              </div>
              <p className="text-xs text-emerald-400 font-semibold mt-1">
                {formatCurrency(summary.totalRemaining)} remaining for next {summary.daysRemaining} days
              </p>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <div className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                <span className="text-[11px] text-gray-400 block">Spent So Far</span>
                <span className="text-base font-bold text-rose-400 block mt-0.5">
                  {formatCurrency(summary.totalSpent)}
                </span>
              </div>

              <div className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                <span className="text-[11px] text-gray-400 block">Overall Utilization</span>
                <span
                  className={`text-base font-bold block mt-0.5 ${
                    summary.overallUtilization > 90
                      ? "text-rose-400"
                      : summary.overallUtilization > 75
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }`}
                >
                  {summary.overallUtilization}%
                </span>
              </div>

              <button
                onClick={() => {
                  setEditingCategory("Food");
                  setEditingLimit("6000");
                  setIsEditing(true);
                }}
                className="px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Adjust Budget Limit</span>
              </button>
            </div>
          </div>

          {/* Category Budgets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {budgets.map((b: any) => {
              const isExceeded = b.status === "exceeded";
              const isWarning = b.status === "warning";

              return (
                <div
                  key={b.category}
                  className={`p-5 rounded-2xl glass-card space-y-4 transition-all ${
                    isExceeded
                      ? "border-rose-500/40 bg-rose-950/10"
                      : isWarning
                      ? "border-amber-500/30"
                      : "hover:border-emerald-500/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[b.category] || "#10b981" }}
                      />
                      <h4 className="text-base font-bold text-white">{b.category}</h4>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        isExceeded
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : isWarning
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      }`}
                    >
                      {b.utilization}% Used
                    </span>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between text-xs mb-1.5">
                      <span className="text-gray-400">Spent: {formatCurrency(b.spent)}</span>
                      <span className="font-bold text-white">Limit: {formatCurrency(b.limit)}</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-white/[0.08] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isExceeded
                            ? "bg-rose-500"
                            : isWarning
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(100, b.utilization)}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <div>
                      <span className="text-gray-400 block text-[11px]">Projected Month-End</span>
                      <span
                        className={`font-semibold ${
                          b.projectedOverspend ? "text-rose-400" : "text-gray-200"
                        }`}
                      >
                        {formatCurrency(b.projectedMonthEnd)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditingCategory(b.category);
                          setEditingLimit(String(b.limit));
                          setIsEditing(true);
                        }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06]"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBudget(b._id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* Adjust Budget Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0b0f19] border border-white/[0.12] rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Set Budget Limit</h3>
            <form onSubmit={handleSaveBudget} className="space-y-3.5">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Category</label>
                <select
                  value={editingCategory}
                  onChange={(e) => setEditingCategory(e.target.value)}
                  className="w-full bg-[#111827] border border-white/[0.12] rounded-xl px-3 py-2 text-sm text-white"
                >
                  {[
                    "Food",
                    "Groceries",
                    "Transport",
                    "Shopping",
                    "Bills",
                    "Rent",
                    "Entertainment",
                    "Healthcare",
                    "Subscriptions",
                  ].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Monthly Limit (₹)</label>
                <input
                  type="number"
                  value={editingLimit}
                  onChange={(e) => setEditingLimit(e.target.value)}
                  placeholder="e.g. 6000"
                  required
                  className="w-full bg-[#111827] border border-white/[0.12] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs shadow-md shadow-emerald-500/20"
                >
                  Save Limit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
