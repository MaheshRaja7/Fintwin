"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Building2, ArrowRight, User, Mail, Lock, Loader2, AlertCircle } from "lucide-react";

export default function SignupPage() {
  const { signup, demoLogin } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [monthlyIncome, setMonthlyIncome] = useState("50000");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setIsLoading(true);
    try {
      await signup({
        fullName,
        email,
        password,
        confirmPassword,
        currency,
        monthlyIncome: parseFloat(monthlyIncome) || 50000,
      });
    } catch (err: any) {
      setError(err.message || "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemo = async () => {
    setError("");
    setIsDemoLoading(true);
    try {
      await demoLogin();
    } catch (err: any) {
      setError(err.message || "Failed to start demo session.");
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Brand Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <Building2 className="w-5 h-5 stroke-[2]" />
            </div>
            <div className="text-left">
              <span className="font-bold text-lg tracking-tight text-white">FinTwin</span>
              <p className="text-[11px] text-slate-400 font-medium">Wealth & Cash Flow</p>
            </div>
          </Link>
        </div>

        {/* Demo Fast Track */}
        <div className="mb-5 p-4 rounded-xl bg-[#0f1624] border border-white/[0.08]">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-200">Interactive Demo Account</span>
            <span className="text-[10px] font-mono text-emerald-400 font-medium">Alex Sharma</span>
          </div>
          <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
            Instant evaluation with preloaded transactions, goals, and recurring budgets.
          </p>
          <button
            onClick={handleDemo}
            disabled={isDemoLoading}
            id="btn-signup-demo"
            className="w-full py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isDemoLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <span>Sign In as Demo User</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {/* Signup Card */}
        <div className="p-6 rounded-xl bg-[#0f1624] border border-white/[0.08]">
          <h2 className="text-base font-bold text-white mb-1">Create an Account</h2>
          <p className="text-xs text-slate-400 mb-5">Set up your portfolio and configure your financial ledger.</p>

          {error && (
            <div className="mb-4 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Priya Patel"
                required
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="priya@example.com"
                required
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Monthly Inflow (₹)</label>
                <input
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  placeholder="50000"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Complete Account Registration"}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-white/[0.06] text-center text-xs text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="text-emerald-400 font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
