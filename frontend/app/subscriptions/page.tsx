"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Calendar,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";

export default function SubscriptionsPage() {
  const queryClient = useQueryClient();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: async () => {
      const res = await api.subscriptions.get();
      return res.data;
    },
  });

  const handleUpdateStatus = async (id: string, status: "active" | "review" | "cancelled") => {
    try {
      await api.subscriptions.updateStatus(id, status);
      await queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (err: any) {
      alert(err.message || "Failed to update status.");
    }
  };

  const handleScan = async () => {
    setIsScanning(true);
    setScanMessage("Scanning transaction history for recurring vendor signatures...");
    try {
      await api.subscriptions.scan();
      await queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setScanMessage("Scan complete! Recurring charges identified and annualized.");
      setTimeout(() => setScanMessage(""), 4000);
    } catch (err: any) {
      setScanMessage("Scan completed with existing data.");
    } finally {
      setIsScanning(false);
    }
  };

  const subscriptions = data?.subscriptions || [];
  const totalMonthly = data?.totalMonthly || 0;
  const annualized = data?.annualized || 0;

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
          title="Recurring Subscriptions & Outflows"
          subtitle="Audit active digital services, memberships, and annualized cost commitment"
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Top KPI Banner */}
          <div className="p-6 rounded-2xl glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <CreditCard className="w-5 h-5" />
                </span>
                <h2 className="text-xl font-bold text-white">Recurring Commitments</h2>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Continuous background recurring detection across software, entertainment, and utilities.
              </p>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <div className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                <span className="text-[11px] text-gray-400 block">Monthly Run Rate</span>
                <span className="text-xl font-black text-white block mt-0.5">
                  {formatCurrency(totalMonthly)}/mo
                </span>
              </div>

              <div className="px-4 py-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-center">
                <span className="text-[11px] text-emerald-300 block">Annualized Impact</span>
                <span className="text-xl font-black text-emerald-400 block mt-0.5">
                  {formatCurrency(annualized)}/yr
                </span>
              </div>

              <button
                onClick={handleScan}
                disabled={isScanning}
                className="px-4 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-white text-xs font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isScanning ? "animate-spin text-emerald-400" : ""}`} />
                <span>{isScanning ? "Scanning..." : "Scan Transactions"}</span>
              </button>
            </div>
          </div>

          {scanMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-300 flex items-center gap-2 animate-in fade-in">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>{scanMessage}</span>
            </div>
          )}

          {/* Subscriptions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {subscriptions.map((sub: any) => {
              const isActive = sub.status === "active";
              const isReview = sub.status === "review";
              const isCancelled = sub.status === "cancelled";

              return (
                <div
                  key={sub._id}
                  className={`p-5 rounded-2xl glass-card space-y-4 transition-all ${
                    isCancelled
                      ? "opacity-60 bg-black/40"
                      : isReview
                      ? "border-amber-500/30"
                      : "hover:border-emerald-500/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold text-white">{sub.name}</h4>
                      <span className="text-xs text-gray-400 block mt-0.5">
                        {sub.category} • {sub.billingCycle}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        isActive
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : isReview
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {sub.status}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-gray-400 block">Subscription Fee</span>
                      <span className="text-lg font-black text-white">
                        {formatCurrency(sub.amount)}
                        <span className="text-xs text-gray-400 font-normal">
                          /{sub.billingCycle === "yearly" ? "yr" : "mo"}
                        </span>
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-gray-400 block">Next Renewal</span>
                      <span className="text-xs font-semibold text-gray-200">
                        {formatDate(sub.nextBillingDate)}
                      </span>
                    </div>
                  </div>

                  {/* Keep / Review / Cancel Status Toggle (Section 19) */}
                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-1.5">
                    <button
                      onClick={() => handleUpdateStatus(sub._id, "active")}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        isActive
                          ? "bg-emerald-500 text-gray-950"
                          : "bg-white/[0.03] text-gray-400 hover:text-white"
                      }`}
                    >
                      Keep
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(sub._id, "review")}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        isReview
                          ? "bg-amber-500 text-gray-950"
                          : "bg-white/[0.03] text-gray-400 hover:text-white"
                      }`}
                    >
                      Review
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(sub._id, "cancelled")}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        isCancelled
                          ? "bg-rose-500 text-gray-950"
                          : "bg-white/[0.03] text-gray-400 hover:text-white"
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
