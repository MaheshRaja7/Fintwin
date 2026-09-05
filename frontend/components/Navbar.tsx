"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Menu,
  Plus,
  Bell,
  Search,
  ChevronDown,
  Building,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { QuickAddModal } from "./QuickAddModal";

export function Navbar({
  title,
  subtitle,
  onOpenMobileNav,
}: {
  title?: string;
  subtitle?: string;
  onOpenMobileNav?: () => void;
}) {
  const { user } = useAuth();
  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <>
      <header className="h-16 border-b border-white/[0.07] bg-[#090d16]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        {/* Mobile menu trigger + Page Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onOpenMobileNav}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-semibold text-white tracking-tight leading-none">
                {title || "Overview"}
              </h1>
            </div>
            {subtitle && (
              <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Account Selector Badge (Realistic Banking UI) */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-slate-300 font-medium">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <span>Checking ••4921</span>
            <span className="text-slate-500 font-mono">|</span>
            <span className="text-emerald-400 font-medium">INR (₹)</span>
          </div>

          {/* Notifications */}
          <button
            title="Notifications"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          </button>

          {/* Advisory Link */}
          <Link
            href="/ai-assistant"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white text-xs font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Advisory</span>
          </Link>

          {/* + Add Transaction Button */}
          <button
            onClick={() => setIsAddOpen(true)}
            id="btn-add-transaction"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Record Transaction</span>
          </button>
        </div>
      </header>

      {/* Quick Add Modal */}
      <QuickAddModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
    </>
  );
}
