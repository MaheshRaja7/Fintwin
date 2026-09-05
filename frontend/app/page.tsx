"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Building2,
  TrendingUp,
  ShieldCheck,
  LineChart,
  ArrowRight,
  PieChart,
  CheckCircle2,
  Lock,
  Zap,
  Sparkles,
  ArrowUpRight,
  Wallet,
} from "lucide-react";

export default function LandingPage() {
  const { user, demoLogin, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      {/* Navigation */}
      <header className="h-18 border-b border-white/[0.07] px-6 sm:px-12 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
            <Building2 className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-white">FinTwin</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-white/10">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Wealth & Cash Flow Intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors"
            >
              Access Dashboard
            </Link>
          ) : (
            <>
              <button
                onClick={demoLogin}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/10 text-xs font-medium transition-colors"
              >
                <span>Demo Account</span>
              </button>
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-lg text-slate-300 hover:text-white text-xs font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs shadow-sm transition-colors"
              >
                Open Account
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-6 sm:px-12 py-16 sm:py-20 flex flex-col items-center text-center">
        {/* Institutional Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300 text-xs font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Next-Generation Financial Operating System</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-3xl text-white leading-[1.15]">
          Institutional-Grade Cash Flow & Wealth Intelligence.
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          Continuous ledger analytics, algorithmic expense forecasting, automated lifestyle category detection, and proactive liquidity risk management.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            onClick={demoLogin}
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <span>Explore Live Demo (Alex Sharma)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <Link
            href="/signup"
            className="w-full sm:w-auto px-5 py-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/10 font-medium text-sm transition-colors"
          >
            Create New Account
          </Link>
        </div>

        {/* Live Terminal Preview Card (Stripe / Mercury Style) */}
        <div className="mt-14 w-full max-w-4xl rounded-xl bg-[#0f1624] border border-white/[0.08] p-5 sm:p-6 text-left shadow-2xl">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
              <span className="text-xs font-mono text-slate-400 ml-2">fintwin.terminal.preview // primary-checking</span>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Status: <span className="text-emerald-400 font-semibold">Active Ledger</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[11px] text-slate-400 block font-medium">Current Portfolio Balance</span>
              <span className="text-xl font-bold text-white mt-1 block tabular-nums">₹1,42,500.00</span>
              <span className="text-[11px] text-emerald-400 mt-0.5 block">+18.4% vs last quarter</span>
            </div>
            <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[11px] text-slate-400 block font-medium">Monthly Inflow / Salary</span>
              <span className="text-xl font-bold text-white mt-1 block tabular-nums">₹50,000.00</span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Disbursed on 1st of month</span>
            </div>
            <div className="p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[11px] text-slate-400 block font-medium">Financial Health Index</span>
              <span className="text-xl font-bold text-emerald-400 mt-1 block tabular-nums">84 / 100</span>
              <span className="text-[11px] text-emerald-300 mt-0.5 block">Tier 1 • Prime Rating</span>
            </div>
          </div>

          {/* Mini Table */}
          <div className="border border-white/[0.06] rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.06] flex justify-between text-xs font-medium text-slate-400">
              <span>Recent Ledger Entries</span>
              <span>Settlement Status</span>
            </div>
            <div className="divide-y divide-white/[0.04] text-xs">
              <div className="px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-[10px]">IN</div>
                  <span className="font-medium text-white">TechCorp Monthly Salary</span>
                </div>
                <span className="font-semibold text-emerald-400 tabular-nums">+₹50,000.00</span>
              </div>
              <div className="px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[10px]">UPI</div>
                  <span className="font-medium text-slate-200">Residential Rent Settlement</span>
                </div>
                <span className="font-semibold text-slate-200 tabular-nums">-₹12,000.00</span>
              </div>
              <div className="px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[10px]">SUB</div>
                  <span className="font-medium text-slate-200">Amazon Prime Membership</span>
                </div>
                <span className="font-semibold text-slate-200 tabular-nums">-₹1,499.00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-5 text-left w-full">
          <div className="p-5 rounded-xl bg-[#0f1624] border border-white/[0.07]">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
              <LineChart className="w-5 h-5 stroke-[2]" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1.5">Algorithmic Forecasting</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Continuous 30-day spending projection models cross-referenced against historical temporal cycles.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#0f1624] border border-white/[0.07]">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5 stroke-[2]" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1.5">Multi-Tenant Isolation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every financial transaction and budget record is strictly isolated per account with zero cross-tenant leakage.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#0f1624] border border-white/[0.07]">
            <div className="w-9 h-9 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center mb-3">
              <PieChart className="w-5 h-5 stroke-[2]" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1.5">Discretionary Audits</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automatic 50/30/20 need-versus-want classification with actionable recommendations to maximize monthly net margin.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.07] py-6 px-6 sm:px-12 text-center text-xs text-slate-500 max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>© 2026 FinTwin Financial Technologies Inc. All rights reserved.</p>
        <div className="flex items-center gap-4 text-slate-400">
          <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
          <Link href="/signup" className="hover:text-white transition-colors">Register</Link>
          <span className="text-slate-600">|</span>
          <span className="text-slate-500">Security: AES-256 TLS 1.3</span>
        </div>
      </footer>
    </div>
  );
}
