"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ReceiptText,
  Search,
  Filter,
  Download,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate, CATEGORY_COLORS } from "@/lib/utils";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { QuickAddModal } from "@/components/QuickAddModal";

const CATEGORIES = [
  "All",
  "Food",
  "Groceries",
  "Transport",
  "Shopping",
  "Bills",
  "Rent",
  "Healthcare",
  "Entertainment",
  "Travel",
  "Subscriptions",
  "Investment",
  "Debt",
  "Income",
  "Other",
];

export default function TransactionsPage() {
  const queryClient = useQueryClient();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [type, setType] = useState<string>("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Natural Language Bar in Header
  const [nlpInput, setNlpInput] = useState("");
  const [nlpSuccess, setNlpSuccess] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["transactions", page, search, category, type, sortBy, sortOrder],
    queryFn: async () => {
      const res = await api.transactions.get({
        page,
        limit: 15,
        search: search.trim() || undefined,
        category: category !== "All" ? category : undefined,
        type: type || undefined,
        sortBy,
        sortOrder,
      });
      return res.data;
    },
  });

  const handleNlpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlpInput.trim()) return;

    try {
      await api.transactions.parseNaturalLanguage(nlpInput.trim(), true);
      setNlpSuccess(`Added: "${nlpInput.trim()}"`);
      setNlpInput("");
      setTimeout(() => setNlpSuccess(""), 4000);
      await queryClient.invalidateQueries({ queryKey: ["transactions"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (err: any) {
      alert(err.message || "Could not parse transaction.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;
    try {
      await api.transactions.delete(id);
      await queryClient.invalidateQueries({ queryKey: ["transactions"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (err: any) {
      alert(err.message || "Failed to delete.");
    }
  };

  const handleExport = (format: "csv" | "json") => {
    window.open(`/api/transactions/export?format=${format}`, "_blank");
  };

  const transactions = data?.transactions || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

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
          title="Transaction Ledger"
          subtitle="Comprehensive audit trail of settled inflows and categorized expenditures"
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-7 space-y-5 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Quick Transaction Entry Bar */}
          <div className="p-4 rounded-xl bg-[#0f1624] border border-white/[0.08]">
            <div className="flex items-center gap-2 mb-2 text-xs font-medium text-slate-300">
              <ReceiptText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Quick Ledger Entry (Natural Language)</span>
            </div>
            <form onSubmit={handleNlpSubmit} className="flex gap-2">
              <input
                type="text"
                value={nlpInput}
                onChange={(e) => setNlpInput(e.target.value)}
                placeholder='e.g. "Spent ₹450 on Swiggy for lunch", "Zepto groceries ₹620", "Received salary ₹50000"'
                className="flex-1 bg-black/40 border border-white/[0.08] rounded-lg px-3.5 py-2 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs shadow-sm transition-all shrink-0"
              >
                Record Entry
              </button>
            </form>
            {nlpSuccess && (
              <div className="mt-2 text-xs text-emerald-300 flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{nlpSuccess} (Ledger updated)</span>
              </div>
            )}
          </div>

          {/* Filter Bar & Export Actions */}
          <div className="p-4 rounded-xl bg-[#0f1624] border border-white/[0.08] space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search description, merchant, or category..."
                  className="w-full bg-[#111827] border border-white/[0.1] rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500"
                />
                <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-2.5" />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value);
                    setPage(1);
                  }}
                  className="bg-[#111827] border border-white/[0.1] rounded-xl px-3 py-2 text-xs font-medium text-gray-300 focus:outline-none"
                >
                  <option value="">All Types</option>
                  <option value="expense">Expenses Only</option>
                  <option value="income">Income Only</option>
                </select>

                <button
                  onClick={() => handleExport("csv")}
                  className="px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-semibold text-gray-300 flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>

                <button
                  onClick={() => handleExport("json")}
                  className="px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-semibold text-gray-300 flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>JSON</span>
                </button>

                <button
                  onClick={() => setIsAddOpen(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all ml-auto sm:ml-0"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>New Entry</span>
                </button>
              </div>
            </div>

            {/* Category Pills Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setCategory(c);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    category === c
                      ? "bg-emerald-500 text-gray-950 font-bold"
                      : "bg-white/[0.04] text-gray-400 hover:text-white"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Transactions Table */}
          <div className="p-5 sm:p-6 rounded-2xl glass-card">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-gray-400 font-semibold">
                Showing {transactions.length} of {pagination.total} transactions
              </span>
            </div>

            {isLoading ? (
              <div className="py-16 text-center text-gray-400 text-sm">
                Loading records...
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-sm">
                No matching transactions found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-gray-400">
                      <th className="pb-3 font-semibold">Date</th>
                      <th className="pb-3 font-semibold">Description</th>
                      <th className="pb-3 font-semibold">Category</th>
                      <th className="pb-3 font-semibold">Merchant</th>
                      <th className="pb-3 font-semibold">Method</th>
                      <th className="pb-3 font-semibold text-right">Amount</th>
                      <th className="pb-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {transactions.map((t: any) => (
                      <tr key={t._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 text-gray-400 whitespace-nowrap">{formatDate(t.date)}</td>
                        <td className="py-3 font-medium text-white max-w-xs truncate">{t.description}</td>
                        <td className="py-3">
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold"
                            style={{
                              backgroundColor: `${CATEGORY_COLORS[t.category] || "#10b981"}20`,
                              color: CATEGORY_COLORS[t.category] || "#10b981",
                            }}
                          >
                            {t.category}
                          </span>
                        </td>
                        <td className="py-3 text-gray-300">{t.merchant || "—"}</td>
                        <td className="py-3 text-gray-400 font-mono text-[11px]">{t.paymentMethod || "UPI"}</td>
                        <td
                          className={`py-3 text-right font-bold whitespace-nowrap ${
                            t.type === "income" ? "text-emerald-400" : "text-gray-100"
                          }`}
                        >
                          {t.type === "income" ? "+" : "-"}
                          {formatCurrency(t.amount)}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleDelete(t._id)}
                            title="Delete"
                            className="p-1.5 rounded text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/[0.08] text-xs">
                <span className="text-gray-400">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg bg-white/[0.04] text-gray-300 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                    disabled={page === pagination.totalPages}
                    className="p-1.5 rounded-lg bg-white/[0.04] text-gray-300 disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <QuickAddModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
    </div>
  );
}
