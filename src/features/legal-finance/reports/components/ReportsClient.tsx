"use client";

import { useState } from "react";
import { DollarSign, TrendingUp, Sparkles, PieChart, Search, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { askLegalFinanceQuery } from "@/actions/legal-finance-ai";

interface ReportsProps {
  summary: {
    totalBilled: number;
    totalCollected: number;
    totalOutstanding: number;
    overdueAmount: number;
    byClient: { clientName: string; billed: number; paid: number; outstanding: number }[];
    aging: { bucket0_30: number; bucket31_60: number; bucket61_90: number; bucket90_plus: number };
  };
}

export default function ReportsClient({ summary }: ReportsProps) {
  const [aiQuery, setAiQuery] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);

  const handleAiAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    setIsAsking(true);
    setAiAnswer(null);

    try {
      const res = await askLegalFinanceQuery(aiQuery);
      setAiAnswer(res.answer);
    } catch (err: any) {
      toast.error("AI query failed.");
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-serif">
          Revenue & Collection Analytics
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Multi-dimensional financial reporting, aging analysis, and AI assistant
        </p>
      </div>

      {/* AI Assistant Search Bar */}
      <div className="bg-gradient-to-r from-[#133255] to-[#1e40af] p-5 rounded-2xl text-white shadow-md space-y-3">
        <div className="flex items-center gap-2 font-bold text-sm">
          <Sparkles className="w-4 h-4 text-[#D8B15B]" />
          <span>Ask Legal & Finance AI Assistant</span>
        </div>
        <form onSubmit={handleAiAsk} className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. 'Show clients with 20% success fee' or 'How much is overdue past 30 days?'"
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            className="flex-1 px-4 py-2 text-xs bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:bg-white/20"
          />
          <button
            type="submit"
            disabled={isAsking}
            className="px-4 py-2 text-xs font-bold bg-[#D8B15B] text-[#133255] rounded-xl hover:bg-[#e0bb66] transition-colors"
          >
            {isAsking ? "Thinking..." : "Ask AI"}
          </button>
        </form>

        {aiAnswer && (
          <div className="p-3 bg-white/10 rounded-xl text-xs text-white/90 border border-white/10 leading-relaxed">
            {aiAnswer}
          </div>
        )}
      </div>

      {/* Financial Stat Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-1">
          <span className="text-xs text-slate-400 font-semibold block">Total Billed</span>
          <span className="text-2xl font-bold text-[#133255] font-serif">
            ₹{(summary.totalBilled / 100000).toFixed(2)} L
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-1">
          <span className="text-xs text-slate-400 font-semibold block">Total Collected</span>
          <span className="text-2xl font-bold text-emerald-600 font-serif">
            ₹{(summary.totalCollected / 100000).toFixed(2)} L
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-1">
          <span className="text-xs text-slate-400 font-semibold block">Total Outstanding</span>
          <span className="text-2xl font-bold text-amber-600 font-serif">
            ₹{(summary.totalOutstanding / 100000).toFixed(2)} L
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-1">
          <span className="text-xs text-slate-400 font-semibold block">Overdue Amount</span>
          <span className="text-2xl font-bold text-rose-600 font-serif">
            ₹{(summary.overdueAmount / 100000).toFixed(2)} L
          </span>
        </div>
      </div>

      {/* Aging Analysis Buckets */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
          Accounts Receivable Aging Analysis
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-center">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <span className="text-emerald-800 font-semibold block">0 – 30 Days</span>
            <span className="text-base font-bold text-emerald-900 mt-1 block">
              ₹{(summary.aging.bucket0_30 / 100000).toFixed(2)} L
            </span>
          </div>

          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
            <span className="text-blue-800 font-semibold block">31 – 60 Days</span>
            <span className="text-base font-bold text-blue-900 mt-1 block">
              ₹{(summary.aging.bucket31_60 / 100000).toFixed(2)} L
            </span>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
            <span className="text-amber-800 font-semibold block">61 – 90 Days</span>
            <span className="text-base font-bold text-amber-900 mt-1 block">
              ₹{(summary.aging.bucket61_90 / 100000).toFixed(2)} L
            </span>
          </div>

          <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
            <span className="text-rose-800 font-semibold block">&gt; 90 Days</span>
            <span className="text-base font-bold text-rose-900 mt-1 block">
              ₹{(summary.aging.bucket90_plus / 100000).toFixed(2)} L
            </span>
          </div>
        </div>
      </div>

      {/* Revenue By Client Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-900">
          Revenue & Collections by Client
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500">
                <th className="p-3">Client Name</th>
                <th className="p-3 text-right">Total Billed</th>
                <th className="p-3 text-right">Collected</th>
                <th className="p-3 text-right">Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summary.byClient.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No client revenue records yet.
                  </td>
                </tr>
              ) : (
                summary.byClient.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-900">{c.clientName}</td>
                    <td className="p-3 text-right font-medium text-slate-900">
                      ₹{(c.billed / 100000).toFixed(2)} L
                    </td>
                    <td className="p-3 text-right font-semibold text-emerald-600">
                      ₹{(c.paid / 100000).toFixed(2)} L
                    </td>
                    <td className="p-3 text-right font-semibold text-amber-600">
                      ₹{(c.outstanding / 100000).toFixed(2)} L
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
