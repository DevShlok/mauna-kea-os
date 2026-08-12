"use client";

import { useState } from "react";
import { DollarSign, TrendingUp, Receipt, BarChart3, Download, AlertTriangle, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

interface ReportsProps {
  summary: {
    totalBilled: number;
    totalCollected: number;
    totalOutstanding: number;
    overdueAmount: number;
    byClient: { clientName: string; billed: number; paid: number; outstanding: number }[];
    aging: { bucket0_30: number; bucket31_60: number; bucket61_90: number; bucket90_plus: number };
    gstSummary?: {
      totalCgst: number;
      totalSgst: number;
      totalIgst: number;
      totalGst: number;
    };
    contractRenewals?: { contractNumber: string; clientName: string; endDate: string; daysToExpiry: number; renewalType: string }[];
  };
}

type Tab = "overview" | "aging" | "gst" | "renewals";

const fmt = (n: number) => `₹${(n / 100000).toFixed(2)} L`;
const fmtCr = (n: number) => n >= 10000000 ? `₹${(n / 10000000).toFixed(2)} Cr` : fmt(n);

function CollectionBar({ billed, paid }: { billed: number; paid: number }) {
  const pct = billed > 0 ? Math.min(100, (paid / billed) * 100) : 0;
  const color = pct >= 90 ? "bg-emerald-500" : pct >= 60 ? "bg-blue-500" : pct >= 30 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-bold text-slate-500 w-10 text-right">{pct.toFixed(0)}%</span>
    </div>
  );
}

export default function ReportsClient({ summary }: ReportsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const handleExport = async (data: any[], filename: string) => {
    try {
      const mod = await import("@/lib/export-excel");
      mod.exportToExcel(data, filename);
    } catch {
      toast.error("Export failed.");
    }
  };

  const collectionRate = summary.totalBilled > 0
    ? ((summary.totalCollected / summary.totalBilled) * 100).toFixed(1)
    : "0.0";

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: "Revenue Overview", icon: TrendingUp },
    { id: "aging", label: "Aging Analysis", icon: BarChart3 },
    { id: "gst", label: "GST Summary", icon: Receipt },
    { id: "renewals", label: "Contract Renewals", icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-serif">
            Financial Reports
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Revenue, collections, GST, and contract renewals analytics
          </p>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Billed", value: fmtCr(summary.totalBilled), color: "text-[#133255]", sub: "All-time invoiced" },
          { label: "Total Collected", value: fmtCr(summary.totalCollected), color: "text-emerald-600", sub: `${collectionRate}% collection rate` },
          { label: "Outstanding", value: fmtCr(summary.totalOutstanding), color: "text-amber-600", sub: "Awaiting payment" },
          { label: "Overdue", value: fmtCr(summary.overdueAmount), color: "text-rose-600", sub: "Past due date" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-1">
            <span className="text-xs text-slate-400 font-semibold block">{kpi.label}</span>
            <span className={`text-2xl font-bold font-serif ${kpi.color}`}>{kpi.value}</span>
            <span className="text-[11px] text-slate-400 block">{kpi.sub}</span>
          </div>
        ))}
      </div>

      {/* Tab Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
                activeTab === id
                  ? "border-[#133255] text-[#133255] bg-slate-50/80"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* ─── OVERVIEW TAB ──────────────────────────────────── */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">Revenue & Collections by Client</h2>
                <button
                  onClick={() => handleExport(
                    summary.byClient.map(c => ({
                      "Client": c.clientName,
                      "Total Billed (₹)": c.billed,
                      "Collected (₹)": c.paid,
                      "Outstanding (₹)": c.outstanding,
                      "Collection %": c.billed > 0 ? ((c.paid / c.billed) * 100).toFixed(1) + "%" : "0%",
                    })),
                    `Revenue_by_Client_${new Date().toISOString().split("T")[0]}`
                  )}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" /> Export
                </button>
              </div>

              {summary.byClient.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No client revenue data yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                        <th className="p-3">Client</th>
                        <th className="p-3 text-right">Billed</th>
                        <th className="p-3 text-right">Collected</th>
                        <th className="p-3 text-right">Outstanding</th>
                        <th className="p-3 w-36">Collection Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {summary.byClient.map((c, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-3 font-semibold text-slate-900">{c.clientName}</td>
                          <td className="p-3 text-right font-medium text-slate-700">{fmt(c.billed)}</td>
                          <td className="p-3 text-right font-semibold text-emerald-600">{fmt(c.paid)}</td>
                          <td className="p-3 text-right font-semibold text-amber-600">{fmt(c.outstanding)}</td>
                          <td className="p-3"><CollectionBar billed={c.billed} paid={c.paid} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ─── AGING TAB ──────────────────────────────────────── */}
          {activeTab === "aging" && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Accounts Receivable Aging Analysis</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-center">
                {[
                  { label: "0 – 30 Days", value: summary.aging.bucket0_30, color: "emerald" },
                  { label: "31 – 60 Days", value: summary.aging.bucket31_60, color: "blue" },
                  { label: "61 – 90 Days", value: summary.aging.bucket61_90, color: "amber" },
                  { label: "> 90 Days", value: summary.aging.bucket90_plus, color: "rose" },
                ].map(({ label, value, color }) => (
                  <div key={label} className={`p-4 bg-${color}-50 rounded-xl border border-${color}-200`}>
                    <span className={`text-${color}-800 font-semibold block`}>{label}</span>
                    <span className={`text-xl font-bold text-${color}-900 mt-1 block`}>{fmt(value)}</span>
                    {summary.totalOutstanding > 0 && (
                      <span className={`text-[11px] text-${color}-600 font-medium`}>
                        {((value / summary.totalOutstanding) * 100).toFixed(0)}% of total
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-600 border border-slate-200">
                <p className="font-bold text-slate-800 mb-1">Aging Risk Signal</p>
                {summary.aging.bucket90_plus > 0 ? (
                  <p className="text-rose-700">
                    <span className="font-semibold">{fmt(summary.aging.bucket90_plus)}</span> overdue past 90 days —
                    escalation or legal notice recommended for affected accounts.
                  </p>
                ) : (
                  <p className="text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> No receivables past 90 days. Collection health is strong.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ─── GST TAB ────────────────────────────────────────── */}
          {activeTab === "gst" && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900">GST Tax Liability Summary</h2>
              {summary.gstSummary ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  {[
                    { label: "Total CGST", value: summary.gstSummary.totalCgst, color: "text-indigo-600" },
                    { label: "Total SGST", value: summary.gstSummary.totalSgst, color: "text-purple-600" },
                    { label: "Total IGST", value: summary.gstSummary.totalIgst, color: "text-blue-600" },
                    { label: "Total GST", value: summary.gstSummary.totalGst, color: "text-[#133255]" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-white border border-slate-200 rounded-xl p-4 text-center">
                      <span className="text-slate-400 font-semibold block">{label}</span>
                      <span className={`text-xl font-bold font-serif ${color} block mt-1`}>{fmt(value)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>GST summary data not available. Ensure invoices have GST amounts recorded.</p>
                </div>
              )}
              <p className="text-[11px] text-slate-400 bg-slate-50 border border-slate-100 rounded-xl p-3">
                GST figures are derived from issued + paid invoices. Cancelled and draft invoices are excluded. 
                Always cross-verify with your CA or tax filing before submission.
              </p>
            </div>
          )}

          {/* ─── RENEWALS TAB ───────────────────────────────────── */}
          {activeTab === "renewals" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">Contract Renewal Tracker</h2>
                {summary.contractRenewals && summary.contractRenewals.length > 0 && (
                  <button
                    onClick={() => handleExport(
                      (summary.contractRenewals || []).map(c => ({
                        "Contract": c.contractNumber,
                        "Client": c.clientName,
                        "End Date": c.endDate,
                        "Days to Expiry": c.daysToExpiry,
                        "Renewal Type": c.renewalType,
                      })),
                      `Contract_Renewals_${new Date().toISOString().split("T")[0]}`
                    )}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" /> Export
                  </button>
                )}
              </div>
              {!summary.contractRenewals || summary.contractRenewals.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>No contracts expiring in the next 90 days.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {summary.contractRenewals.map((c, i) => {
                    const isExpired = c.daysToExpiry < 0;
                    const isUrgent = c.daysToExpiry <= 30;
                    return (
                      <div
                        key={i}
                        className={`flex items-center justify-between p-3.5 rounded-xl border text-xs ${
                          isExpired ? "bg-rose-50 border-rose-200" :
                          isUrgent ? "bg-amber-50 border-amber-200" :
                          "bg-yellow-50 border-yellow-200"
                        }`}
                      >
                        <div>
                          <p className="font-bold text-slate-900">{c.contractNumber} — {c.clientName}</p>
                          <p className="text-slate-500 mt-0.5">Ends: {c.endDate} · {c.renewalType}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                          isExpired ? "bg-rose-200 text-rose-900" :
                          isUrgent ? "bg-amber-200 text-amber-900" :
                          "bg-yellow-200 text-yellow-900"
                        }`}>
                          {isExpired ? `Expired ${Math.abs(c.daysToExpiry)}d ago` : `${c.daysToExpiry}d left`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
