"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Target,
  Plus,
  Calendar,
  PiggyBank,
  CheckCircle2,
  Trash2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";

export default function GoalsPage() {
  const queryClient = useQueryClient();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // New Goal Modal state
  const [isNewGoalOpen, setIsNewGoalOpen] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [newGoalDate, setNewGoalDate] = useState("");

  // Contribute Modal state
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const res = await api.goals.get();
      return res.data?.goals;
    },
  });

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetAmt = parseFloat(newGoalTarget);
    if (!newGoalName.trim() || isNaN(targetAmt) || targetAmt <= 0 || !newGoalDate) {
      alert("Please fill in valid goal details.");
      return;
    }

    try {
      await api.goals.create({
        name: newGoalName.trim(),
        targetAmount: targetAmt,
        currentAmount: 0,
        targetDate: newGoalDate,
      });
      await queryClient.invalidateQueries({ queryKey: ["goals"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setIsNewGoalOpen(false);
      setNewGoalName("");
      setNewGoalTarget("");
      setNewGoalDate("");
    } catch (err: any) {
      alert(err.message || "Failed to create goal.");
    }
  };

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(contributeAmount);
    if (!contributeGoalId || isNaN(amt) || amt <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    try {
      await api.goals.contribute(contributeGoalId, amt);
      await queryClient.invalidateQueries({ queryKey: ["goals"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setContributeGoalId(null);
      setContributeAmount("");
    } catch (err: any) {
      alert(err.message || "Contribution failed.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this goal?")) return;
    try {
      await api.goals.delete(id);
      await queryClient.invalidateQueries({ queryKey: ["goals"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (err: any) {
      alert(err.message || "Failed to delete.");
    }
  };

  const goals = data || [];

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
          title="Savings Goals & Milestones"
          subtitle="Target capital amounts, required monthly contributions, and progress trajectory"
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Top Banner */}
          <div className="p-6 rounded-2xl glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Target className="w-5 h-5" />
                </span>
                <h2 className="text-xl font-bold text-white">Active Savings Targets</h2>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                You have {goals.length} target goals tracked with automated monthly pace calculation.
              </p>
            </div>

            <button
              onClick={() => setIsNewGoalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create New Goal</span>
            </button>
          </div>

          {/* Goals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((g: any) => (
              <div
                key={g._id}
                className="p-6 rounded-2xl glass-card space-y-4 hover:border-emerald-500/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-white/[0.04] text-emerald-400">
                      <PiggyBank className="w-4 h-4" />
                    </span>
                    <h4 className="text-base font-bold text-white">{g.name}</h4>
                  </div>
                  <button
                    onClick={() => handleDelete(g._id)}
                    className="p-1.5 text-gray-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-bold text-emerald-400">{formatCurrency(g.currentAmount)}</span>
                    <span className="text-gray-400">Target: {formatCurrency(g.targetAmount)}</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-white/[0.08] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
                      style={{ width: `${g.percentageCompleted}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-400 pt-0.5">
                    <span>{g.percentageCompleted}% Achieved</span>
                    <span>{formatCurrency(g.remainingAmount)} Remaining</span>
                  </div>
                </div>

                {/* Pace Details */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[11px]">Required Monthly</span>
                    <span className="font-bold text-white mt-0.5 block">
                      {formatCurrency(g.requiredMonthlySavings)}/mo
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Est. Completion</span>
                    <span className="font-bold text-teal-300 mt-0.5 block">
                      {g.monthsRemaining} months
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">
                    Target: {formatDate(g.targetDate)}
                  </span>
                  <button
                    onClick={() => {
                      setContributeGoalId(g._id);
                      setContributeAmount("5000");
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-colors"
                  >
                    + Add Savings
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* New Goal Modal */}
      {isNewGoalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0b0f19] border border-white/[0.12] rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Create Financial Goal</h3>
            <form onSubmit={handleCreateGoal} className="space-y-3.5">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Goal Name</label>
                <input
                  type="text"
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  placeholder="e.g. MacBook Pro, Japan Trip"
                  required
                  className="w-full bg-[#111827] border border-white/[0.12] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Target Amount (₹)</label>
                <input
                  type="number"
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                  placeholder="75000"
                  required
                  className="w-full bg-[#111827] border border-white/[0.12] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Target Date</label>
                <input
                  type="date"
                  value={newGoalDate}
                  onChange={(e) => setNewGoalDate(e.target.value)}
                  required
                  className="w-full bg-[#111827] border border-white/[0.12] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewGoalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.04] text-xs font-semibold text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contribute Modal */}
      {contributeGoalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0b0f19] border border-white/[0.12] rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Add Savings to Goal</h3>
            <p className="text-xs text-gray-400">
              This records a savings contribution and accelerates your estimated completion date.
            </p>
            <form onSubmit={handleContribute} className="space-y-3.5">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Contribution Amount (₹)</label>
                <input
                  type="number"
                  value={contributeAmount}
                  onChange={(e) => setContributeAmount(e.target.value)}
                  placeholder="5000"
                  required
                  className="w-full bg-[#111827] border border-white/[0.12] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setContributeGoalId(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.04] text-xs font-semibold text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs"
                >
                  Record Contribution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
