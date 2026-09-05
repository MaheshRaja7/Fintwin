"use client";

import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { X, Sparkles, PlusCircle, Check, ArrowRight, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency, CATEGORY_COLORS } from "@/lib/utils";

const CATEGORIES = [
  "Food",
  "Groceries",
  "Transport",
  "Shopping",
  "Bills",
  "Rent",
  "Education",
  "Healthcare",
  "Entertainment",
  "Travel",
  "Subscriptions",
  "Investment",
  "Debt",
  "Other",
];

export function QuickAddModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"natural" | "manual">("natural");

  // Natural language state
  const [nlText, setNlText] = useState("");
  const [nlParsed, setNlParsed] = useState<any>(null);
  const [isParsing, setIsParsing] = useState(false);

  // Manual state
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [category, setCategory] = useState("Food");
  const [merchant, setMerchant] = useState("");
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Debounced natural language parser
  useEffect(() => {
    if (!nlText.trim()) {
      setNlParsed(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsParsing(true);
      try {
        const res = await api.transactions.parseNaturalLanguage(nlText, false);
        setNlParsed(res.data?.parsed);
      } catch {
        setNlParsed(null);
      } finally {
        setIsParsing(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [nlText]);

  if (!isOpen) return null;

  const handleSaveNatural = async () => {
    if (!nlText.trim()) return;
    setIsSubmitting(true);
    try {
      await api.transactions.parseNaturalLanguage(nlText, true);
      await refreshAllQueries();
      setSuccessMsg("Transaction added & analytics recalculated!");
      setTimeout(() => {
        setSuccessMsg("");
        setNlText("");
        setNlParsed(null);
        onClose();
      }, 900);
    } catch (err: any) {
      alert(err.message || "Failed to add transaction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmt = parseFloat(amount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.transactions.create({
        amount: parsedAmt,
        type,
        category,
        merchant: merchant.trim() || undefined,
        description: description.trim() || `${category} payment`,
        paymentMethod,
      });

      await refreshAllQueries();
      setSuccessMsg("Transaction added & analytics recalculated!");
      setTimeout(() => {
        setSuccessMsg("");
        setAmount("");
        setDescription("");
        setMerchant("");
        onClose();
      }, 900);
    } catch (err: any) {
      alert(err.message || "Failed to add transaction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const refreshAllQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      queryClient.invalidateQueries({ queryKey: ["budgets"] }),
      queryClient.invalidateQueries({ queryKey: ["predictions"] }),
      queryClient.invalidateQueries({ queryKey: ["recommendations"] }),
      queryClient.invalidateQueries({ queryKey: ["goals"] }),
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0b0f19] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Add Transaction</h2>
              <p className="text-xs text-gray-400">Real-time instant twin recalculation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-white/[0.08] bg-black/20 p-1 m-4 rounded-lg">
          <button
            onClick={() => setTab("natural")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${
              tab === "natural"
                ? "bg-emerald-500 text-gray-950 shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Natural Language AI</span>
          </button>
          <button
            onClick={() => setTab("manual")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
              tab === "manual"
                ? "bg-emerald-500 text-gray-950 shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Manual Form
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 pt-0">
          {successMsg ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center animate-bounce">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <p className="text-sm font-bold text-white">{successMsg}</p>
            </div>
          ) : tab === "natural" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Type what you spent or received in plain English:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={nlText}
                    onChange={(e) => setNlText(e.target.value)}
                    placeholder='e.g. "Spent ₹850 on Swiggy" or "Got salary of ₹50000"'
                    className="w-full bg-[#111827] border border-white/[0.12] rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/60"
                    autoFocus
                  />
                  {isParsing && (
                    <div className="absolute right-3 top-3 text-emerald-400 animate-spin">
                      <Loader2 className="w-5 h-5" />
                    </div>
                  )}
                </div>
              </div>

              {/* Sample Prompts */}
              <div className="flex flex-wrap gap-1.5 text-xs">
                <span className="text-gray-500 text-[11px] self-center mr-1">Try:</span>
                {[
                  "Spent ₹850 on Swiggy",
                  "Blinkit groceries 620",
                  "Uber cab ₹340",
                  "Netflix 649",
                  "Got salary ₹50000",
                ].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => setNlText(sample)}
                    className="px-2 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 text-[11px] border border-white/[0.05] transition-colors"
                  >
                    {sample}
                  </button>
                ))}
              </div>

              {/* Real-time Extracted Entity Preview Chip */}
              {nlParsed && nlParsed.amount > 0 && (
                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2 animate-in fade-in-50 duration-150">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Extracted Intelligence:
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        nlParsed.type === "income"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-rose-500/20 text-rose-300"
                      }`}
                    >
                      {nlParsed.type}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-emerald-500/20">
                    <div>
                      <span className="text-gray-400 block text-[11px]">Amount</span>
                      <span className="text-sm font-bold text-white">
                        {formatCurrency(nlParsed.amount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Category</span>
                      <span className="font-semibold text-gray-200">
                        {nlParsed.category}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Merchant</span>
                      <span className="font-semibold text-gray-200">
                        {nlParsed.merchant || "Standard Vendor"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Classification</span>
                      <span className="font-semibold uppercase text-emerald-400 text-[10px]">
                        {nlParsed.nature}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleSaveNatural}
                disabled={isSubmitting || !nlParsed || nlParsed.amount <= 0}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-gray-950 font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Confirm & Add to Digital Twin</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveManual} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Type
                  </label>
                  <select
                    value={type}
                    onChange={(e: any) => setType(e.target.value)}
                    className="w-full bg-[#111827] border border-white/[0.12] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="expense">Expense (-)</option>
                    <option value="income">Income (+)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="850"
                    required
                    className="w-full bg-[#111827] border border-white/[0.12] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#111827] border border-white/[0.12] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Merchant / Store
                  </label>
                  <input
                    type="text"
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    placeholder="e.g. Swiggy, Amazon"
                    className="w-full bg-[#111827] border border-white/[0.12] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Team dinner delivery"
                  className="w-full bg-[#111827] border border-white/[0.12] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-[#111827] border border-white/[0.12] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !amount}
                className="w-full mt-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-gray-950 font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Save Transaction</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
