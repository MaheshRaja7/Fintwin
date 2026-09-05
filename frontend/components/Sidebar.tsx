"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  LineChart,
  Target,
  CreditCard,
  SlidersHorizontal,
  Sparkles,
  FileSpreadsheet,
  LogOut,
  Building2,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Transactions", href: "/transactions", icon: Receipt },
  { label: "Budgets & Limits", href: "/budgets", icon: PieChart },
  { label: "Cash Flow Projections", href: "/predictions", icon: LineChart },
  { label: "Savings Goals", href: "/goals", icon: Target },
  { label: "Recurring Subscriptions", href: "/subscriptions", icon: CreditCard },
  { label: "Scenario Simulator", href: "/simulator", icon: SlidersHorizontal },
  { label: "Financial Advisory", href: "/ai-assistant", icon: Sparkles, badge: "Gemini" },
  { label: "Statements & Reports", href: "/reports", icon: FileSpreadsheet },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside
      className={cn(
        "flex flex-col w-64 bg-[#0a0f1d] border-r border-white/[0.07] min-h-screen text-slate-300 select-none",
        className
      )}
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-white/[0.07]">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 group-hover:border-emerald-500/40 transition-colors">
            <Building2 className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-white">FinTwin</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-white/10">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Wealth & Cash Flow</p>
          </div>
        </Link>

        {/* Institution Connection Indicator */}
        <div className="mt-4 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span className="text-xs text-slate-300 font-medium">All Accounts Synced</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">100% Verified</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Menu
        </p>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150",
                isActive
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-semibold"
                  : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-emerald-400" : "text-slate-400"
                  )}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded bg-slate-800 text-slate-300 border border-white/10">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-3.5 border-t border-white/[0.07] bg-[#070b14]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-semibold text-white shrink-0">
              {user?.fullName?.charAt(0) || "U"}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-slate-200 truncate">{user?.fullName || "Account Holder"}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email || "user@fintwin.com"}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
