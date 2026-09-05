"use client";

import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  Send,
  User,
  Trash2,
  Copy,
  Check,
  Search,
  CheckCircle2,
  SlidersHorizontal,
  DollarSign,
  Loader2,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";

const SUGGESTED_PROMPTS = [
  "Can I afford ₹8,000 for headphones?",
  "Where am I overspending this month?",
  "What if I reduce shopping by 30%?",
  "How much can I save this month?",
  "When will I reach my MacBook Pro goal?",
  "Analyze my 50/30/20 budget adherence",
];

export default function AIAssistantPage() {
  const queryClient = useQueryClient();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<any[]>([
    {
      role: "model",
      content:
        "Welcome Alex. I am your **FinTwin Wealth & Cash Flow Advisory** desk. I monitor your live transactions, monthly budgets, savings goals, and cash flow forecasts in real time.\n\nAsk about capital affordability, scenario simulations, or budget optimization opportunities.",
      toolCalls: [],
      createdAt: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    setInputMessage("");
    const userMsg = { role: "user", content: text, createdAt: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await api.ai.chat(text, conversationId);
      if (res.data?.conversationId) {
        setConversationId(res.data.conversationId);
      }
      if (res.data?.message) {
        setMessages((prev) => [...prev, res.data.message]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content: "I encountered an issue analyzing your financial records. Please ensure the backend service is reachable.",
          createdAt: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (content: string, idx: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleClear = () => {
    setMessages([
      {
        role: "model",
        content: "Advisory thread cleared. How can I assist with your portfolio or cash flow today?",
        toolCalls: [],
        createdAt: new Date(),
      },
    ]);
    setConversationId(undefined);
  };

  return (
    <div className="flex min-h-screen bg-[#090d16] text-slate-100">
      <Sidebar className="hidden md:flex shrink-0" />

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/70" onClick={() => setMobileNavOpen(false)} />
          <Sidebar className="relative z-10 w-64" />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Navbar
          title="Financial Advisory Desk"
          subtitle="Portfolio decisions and capital allocation with live ledger analysis"
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />

        {/* Chat Conversation Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-4xl mx-auto w-full">
          {messages.map((m, idx) => {
            const isUser = m.role === "user";

            return (
              <div
                key={idx}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} transition-all`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 stroke-[2]" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-xl p-4 text-xs sm:text-sm space-y-2.5 ${
                    isUser
                      ? "bg-emerald-600 text-white font-medium ml-10 shadow-sm"
                      : "bg-[#0f1624] text-slate-200 border border-white/[0.08] mr-10"
                  }`}
                >
                  {/* Tool Execution Tag Chips */}
                  {!isUser && m.toolCalls && m.toolCalls.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pb-2 border-b border-white/[0.06]">
                      {m.toolCalls.map((tc: any, i: number) => (
                        <div
                          key={i}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.04] border border-white/[0.08] text-slate-300 flex items-center gap-1"
                        >
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>Verified: {tc.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Message Content */}
                  <div className="whitespace-pre-wrap leading-relaxed space-y-2">
                    {m.content}
                  </div>

                  {/* Embedded Rich Financial Card if Present */}
                  {m.financialCard && (
                    <div className="p-3 rounded-lg bg-black/40 border border-white/[0.08] space-y-2 mt-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Ledger Simulation Output</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          {m.financialCard.type}
                        </span>
                      </div>
                      {m.financialCard.type === "simulation" && (
                        <div className="text-xs space-y-1 text-slate-300">
                          <div>
                            Monthly Buffer Impact:{" "}
                            <span className="font-semibold text-white">
                              {formatCurrency(m.financialCard.data?.impact?.monthlySavingsDelta || 0)}
                            </span>
                          </div>
                          <div>
                            Annual Savings Variance:{" "}
                            <span className="font-semibold text-emerald-400">
                              {formatCurrency(m.financialCard.data?.impact?.annualSavingsDelta || 0)}
                            </span>
                          </div>
                          <div>
                            Goal Timeline Shift:{" "}
                            <span className="font-semibold text-teal-300">
                              {m.financialCard.data?.impact?.goalImpact?.explanation || "On schedule"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Action Footer */}
                  {!isUser && (
                    <div className="flex items-center justify-between pt-2 text-[10px] text-slate-500 border-t border-white/[0.04]">
                      <span>FinTwin Advisory Desk</span>
                      <button
                        onClick={() => handleCopy(m.content, idx)}
                        className="hover:text-slate-200 flex items-center gap-1 transition-colors"
                      >
                        {copiedIdx === idx ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-white/10 text-slate-300 flex items-center justify-center shrink-0 text-xs font-semibold">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 justify-start animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 stroke-[2]" />
              </div>
              <div className="p-3.5 rounded-xl bg-[#0f1624] border border-white/[0.08] text-xs text-slate-400 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>Auditing ledger records and calculating scenario impact...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input & Suggested Prompts Bar */}
        <div className="p-4 border-t border-white/[0.07] bg-[#0c121e]">
          <div className="max-w-4xl mx-auto space-y-3">
            {/* Suggested Prompts Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap mr-1">
                Common Inquiries:
              </span>
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => handleSend(p)}
                  disabled={isLoading}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] text-slate-300 hover:text-white whitespace-nowrap text-xs transition-colors shrink-0 disabled:opacity-50"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask a question about your portfolio, budget limits, or upcoming expenses..."
                  disabled={isLoading}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-lg bg-black/40 border border-white/[0.08] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Submit</span>
              </button>

              <button
                type="button"
                onClick={handleClear}
                title="Clear Conversation"
                className="p-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-white/[0.06] transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
