"use client";

import Link from "next/link";
import { useState } from "react";
import { DollarSign, RotateCcw, Search, CheckCircle2, AlertCircle, Download } from "lucide-react";
import toast from "react-hot-toast";
import { reversePaymentAction } from "@/actions/legal-finance";

interface PaymentRow {
  payment: {
    id: number;
    invoiceId: string;
    paymentDate: string;
    amount: number;
    mode: string | null;
    utrNumber: string | null;
    referenceNumber: string | null;
    isReversed: boolean | null;
    recordedBy: string | null;
    createdAt: string;
  };
  invoiceNumber: string | null;
  clientName: string | null;
}

export default function PaymentsClient({
  initialData,
}: {
  initialData: {
    rows: PaymentRow[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  };
}) {
  const [search, setSearch] = useState("");

  const handleReverse = async (paymentId: number, invoiceNum: string) => {
    const reason = prompt(`Reason for reversing payment for invoice ${invoiceNum}?`);
    if (!reason) return;

    try {
      await reversePaymentAction(paymentId, reason);
      toast.success("Payment reversed successfully.");
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Failed to reverse payment.");
    }
  };

  const filteredRows = search
    ? initialData.rows.filter(
        (r) =>
          r.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
          r.clientName?.toLowerCase().includes(search.toLowerCase()) ||
          r.payment.utrNumber?.toLowerCase().includes(search.toLowerCase())
      )
    : initialData.rows;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-serif">
            Payment Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Track all incoming payments, collections, UTR numbers, and reversals
          </p>
        </div>
        <div>
          <button
            onClick={() => {
              const exportData = filteredRows.map(({ payment, invoiceNumber, clientName }) => ({
                "Payment Date": payment.paymentDate,
                "Invoice Number": invoiceNumber || payment.invoiceId,
                "Client Name": clientName || "N/A",
                "Mode": payment.mode || "NEFT",
                "UTR / Ref": payment.utrNumber || payment.referenceNumber || "N/A",
                "Amount Received ₹": payment.amount || 0,
                "Status": payment.isReversed ? "Reversed" : "Active",
                "Recorded By": payment.recordedBy || "System",
              }));
              import("@/lib/export-excel").then((mod) =>
                mod.exportToExcel(exportData, `Payments_Ledger_${new Date().toISOString().split("T")[0]}`)
              );
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-xs"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice no, client, UTR..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#133255]/20"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Payment Date</th>
                <th className="py-3.5 px-4">Invoice No.</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Mode</th>
                <th className="py-3.5 px-4">UTR / Ref</th>
                <th className="py-3.5 px-4 text-right">Amount Received</th>
                <th className="py-3.5 px-4">Recorded By</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <DollarSign className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="font-medium text-slate-600">No payment events recorded</p>
                  </td>
                </tr>
              ) : (
                filteredRows.map(({ payment, invoiceNumber, clientName }) => (
                  <tr
                    key={payment.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      payment.isReversed ? "opacity-50 bg-slate-50/50 line-through" : ""
                    }`}
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium">{payment.paymentDate}</td>
                    <td className="py-3.5 px-4 font-semibold text-[#133255]">
                      <Link
                        href={`/dashboard/legal-finance/invoices/${payment.invoiceId}`}
                        className="hover:underline"
                      >
                        {invoiceNumber || payment.invoiceId}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">{clientName || "-"}</td>
                    <td className="py-3.5 px-4 font-semibold">{payment.mode || "NEFT"}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      {payment.utrNumber || payment.referenceNumber || "-"}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                      ₹{(payment.amount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{payment.recordedBy || "System"}</td>
                    <td className="py-3.5 px-4 text-right">
                      {!payment.isReversed && (
                        <button
                          onClick={() => handleReverse(payment.id, invoiceNumber || "")}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Reverse Payment"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
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
