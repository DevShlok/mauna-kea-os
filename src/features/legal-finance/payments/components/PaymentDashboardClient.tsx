"use client";

import { useState } from "react";
import Link from "next/link";
import { DollarSign, AlertTriangle, CheckCircle2, Clock, Layers, TrendingUp, Download } from "lucide-react";
import MultiInvoicePaymentModal from "./MultiInvoicePaymentModal";

interface OutstandingInvoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  dueDate: string;
  totalAmount: number;
  amountPaid: number;
  amountOutstanding: number;
  status: string;
  isOverdue: boolean;
}

interface PaymentDashboardClientProps {
  kpis: {
    totalCollectedMonth: number;
    totalOutstandingAll: number;
    overdueCount: number;
    overdueAmount: number;
    avgDaysToPayment: number;
  };
  outstandingInvoices: OutstandingInvoice[];
}

const fmt = (n: number) =>
  n >= 10000000
    ? `₹${(n / 10000000).toFixed(2)} Cr`
    : `₹${(n / 100000).toFixed(2)} L`;

export default function PaymentDashboardClient({
  kpis,
  outstandingInvoices,
}: PaymentDashboardClientProps) {
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  const kpiCards = [
    {
      label: "Collected This Month",
      value: fmt(kpis.totalCollectedMonth),
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
    },
    {
      label: "Total Outstanding",
      value: fmt(kpis.totalOutstandingAll),
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
    },
    {
      label: "Overdue Amount",
      value: fmt(kpis.overdueAmount),
      icon: AlertTriangle,
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-200",
    },
    {
      label: "Avg Days to Payment",
      value: `${kpis.avgDaysToPayment}d`,
      icon: CheckCircle2,
      color: "text-[#133255]",
      bg: "bg-slate-50",
      border: "border-slate-200",
    },
  ];

  const handleExport = () => {
    import("@/lib/export-excel").then((mod) => {
      mod.exportToExcel(
        outstandingInvoices.map((inv) => ({
          "Invoice No.": inv.invoiceNumber,
          "Client": inv.clientName,
          "Due Date": inv.dueDate,
          "Total Amount (₹)": inv.totalAmount,
          "Paid (₹)": inv.amountPaid,
          "Outstanding (₹)": inv.amountOutstanding,
          "Status": inv.status,
          "Overdue": inv.isOverdue ? "Yes" : "No",
        })),
        `Outstanding_Invoices_${new Date().toISOString().split("T")[0]}`
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-serif">
            Payments Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Collection KPIs, outstanding invoices, and bulk payment tools
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            Export Outstanding
          </button>
          <button
            onClick={() => setIsBulkOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#133255] rounded-xl hover:bg-[#1a3d66] transition-all shadow-sm"
          >
            <Layers className="w-3.5 h-3.5" />
            Bulk Payment
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(({ label, value, icon: Icon, color, bg, border }) => (
          <div
            key={label}
            className={`${bg} border ${border} rounded-2xl p-5 space-y-2`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-semibold">{label}</span>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <span className={`text-2xl font-bold font-serif ${color}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* Outstanding Invoices Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#133255]" />
            Outstanding Invoices ({outstandingInvoices.length})
          </h2>
          <Link
            href="/dashboard/legal-finance/payments"
            className="text-xs font-semibold text-[#133255] hover:underline"
          >
            View Full Ledger →
          </Link>
        </div>

        <div className="overflow-x-auto">
          {outstandingInvoices.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-500" />
              <p className="font-semibold">All invoices are settled!</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Invoice No.</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4 text-right">Total</th>
                  <th className="py-3.5 px-4 text-right">Outstanding</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {outstandingInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{inv.clientName}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold ${
                          inv.isOverdue ? "text-rose-600" : "text-slate-700"
                        }`}
                      >
                        {inv.dueDate}
                        {inv.isOverdue && (
                          <span className="ml-1.5 px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded-full text-[10px]">
                            Overdue
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-700">
                      ₹{inv.totalAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-amber-700">
                      ₹{inv.amountOutstanding.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                          inv.status === "Overdue"
                            ? "bg-rose-100 text-rose-700"
                            : inv.status === "Partially Paid"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/dashboard/legal-finance/invoices/${inv.id}`}
                        className="text-[10px] font-semibold text-[#133255] hover:underline"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Bulk Payment Modal */}
      <MultiInvoicePaymentModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        invoices={outstandingInvoices.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          clientName: inv.clientName,
          amountOutstanding: inv.amountOutstanding,
        }))}
      />
    </div>
  );
}
