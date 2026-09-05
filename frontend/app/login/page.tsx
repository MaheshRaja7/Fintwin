"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Building2, ArrowRight, Lock, Mail, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const { login, demoLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
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
      <div className="w-full max-w-sm">
        {/* Brand Logo */}
        <div className="text-center mb-8">
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
            Test the live platform preloaded with 4 months of transactions and cash flow analytics.
          </p>
          <button
            onClick={handleDemo}
            disabled={isDemoLoading}
            id="btn-demo-login"
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

        {/* Form Card */}
        <div className="p-6 rounded-xl bg-[#0f1624] border border-white/[0.08]">
          <h2 className="text-base font-bold text-white mb-1">Sign In</h2>
          <p className="text-xs text-slate-400 mb-5">Enter your email and password to access your account.</p>

          {error && (
            <div className="mb-4 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">Password</label>
                <a href="#" className="text-[11px] text-emerald-400 hover:underline">Forgot password?</a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Sign In to Account"}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-white/[0.06] text-center text-xs text-slate-400">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-emerald-400 font-medium hover:underline">
              Register now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
