"use client";

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  X,
  Play,
  ArrowRight,
  Sparkles,
  Info,
} from "lucide-react";
import { api } from "@/lib/api";

const STEPS = [
  { step: 1, title: "1. Log Transaction", desc: "Test real-time ledger update", badge: "Ledger" },
  { step: 2, title: "2. Velocity Spike", desc: "Dining category surge (+28%)", badge: "Velocity" },
  { step: 3, title: "3. Cash Flow Forecast", desc: "XGBoost monthly projection", badge: "Forecast" },
  { step: 4, title: "4. Risk Assessment", desc: "Budget adherence alert", badge: "Compliance" },
  { step: 5, title: "5. Smart Reallocation", desc: "Discretionary trim rule", badge: "Optimization" },
  { step: 6, title: "6. Advisory Query", desc: "Capital purchase evaluation", badge: "Advisory" },
  { step: 7, title: "7. Scenario Model", desc: "Timeline acceleration (+₹3k)", badge: "Simulation" },
];

export function WowMomentBanner({ onTriggerAdd }: { onTriggerAdd?: () => void }) {
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(1);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simMessage, setSimMessage] = useState("");
  const [isDismissed, setIsDismissed] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const runStepOne = async () => {
    setIsSimulating(true);
    setSimMessage("Posting 'Swiggy ₹850' to live ledger...");
    try {
      await api.transactions.create({
        amount: 850,
        type: "expense",
        category: "Food",
        merchant: "Swiggy",
        description: "Dinner meal delivery via Swiggy",
        paymentMethod: "UPI",
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["predictions"] }),
        queryClient.invalidateQueries({ queryKey: ["budgets"] }),
        queryClient.invalidateQueries({ queryKey: ["recommendations"] }),
      ]);

      setSimMessage("Transaction verified and recorded. Cash flow analytics and forecasts recomputed.");
      setActiveStep(2);
      setTimeout(() => setSimMessage(""), 4500);
    } catch (err: any) {
      setSimMessage(err.message || "Execution error.");
    } finally {
      setIsSimulating(false);
    }
  };

  if (isDismissed) {
    return (
      <div className="flex justify-end">
        <button
          onClick={() => setIsDismissed(false)}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 py-1 px-2.5 rounded-lg border border-white/[0.08] bg-white/[0.02]"
        >
          <Info className="w-3.5 h-3.5 text-emerald-400" />
          <span>Interactive Feature Tour</span>
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[#0f1624] border border-white/[0.08] p-4 text-slate-200 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-semibold text-white tracking-tight">
                Interactive Guided Tour: Real-Time Ledger Cascade
              </h2>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/10">
                Sandbox Simulation
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 max-w-xl">
              Simulate an incoming ₹850 dining transaction to inspect how transactions automatically update your ledger, forecast trajectory, and budget adherence.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={runStepOne}
            disabled={isSimulating}
            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>{isSimulating ? "Processing..." : "Simulate Swiggy ₹850"}</span>
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            title={isCollapsed ? "Expand Tour" : "Collapse Tour"}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            title="Dismiss Tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {simMessage && (
        <div className="mt-3 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{simMessage}</span>
        </div>
      )}

      {/* Steps List (Collapsible) */}
      {!isCollapsed && (
        <div className="mt-3 pt-3 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {STEPS.map((s) => (
            <div
              key={s.step}
              onClick={() => setActiveStep(s.step)}
              className={`p-2 rounded-lg border text-left cursor-pointer transition-colors ${
                activeStep === s.step
                  ? "bg-emerald-500/10 border-emerald-500/30 text-white"
                  : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12] text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
                <span className="font-semibold text-slate-300">0{s.step}</span>
                <span className="px-1 py-0.2 rounded text-[9px] bg-white/[0.05] text-slate-400">
                  {s.badge}
                </span>
              </div>
              <div className="text-[11px] font-medium text-slate-200 truncate">
                {s.title}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
