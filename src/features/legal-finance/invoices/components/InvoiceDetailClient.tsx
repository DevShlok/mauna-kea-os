"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Printer,
  DollarSign,
  Ban,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";
import RecordPaymentModal from "@/features/legal-finance/payments/components/RecordPaymentModal";
import { cancelInvoiceAction, issueCreditNoteAction, reversePaymentAction } from "@/actions/legal-finance";
import { numberToWordsINR } from "@/lib/number-to-words";

interface InvoiceDetailProps {
  invoice: {
    id: string;
    invoiceNumber: string;
    clientId: string;
    clientName: string | null;
    clientGst: string | null;
    clientAddress: string | null;
    contractNumber: string | null;
    invoiceDate: string;
    dueDate: string;
    joiningDate: string | null;
    annualCtc: number | null;
    commercialPct: number | null;
    feeBeforeTax: number | null;
    gstRate: number | null;
    gstAmount: number | null;
    cgstAmount: number | null;
    sgstAmount: number | null;
    igstAmount: number | null;
    totalAmount: number | null;
    amountPaid: number | null;
    amountOutstanding: number | null;
    status: string;
    poNumber: string | null;
    currency: string | null;
    hsnSacCode: string | null;
    notes: string | null;
    consultant: string | null;
    payments: any[];
  };
}

export default function InvoiceDetailClient({ invoice }: InvoiceDetailProps) {
  const router = useRouter();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const handleCancel = async () => {
    const reason = prompt(`Reason for cancelling invoice ${invoice.invoiceNumber}?`);
    if (!reason) return;

    try {
      await cancelInvoiceAction(invoice.id, reason);
      toast.success("Invoice cancelled.");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel invoice.");
    }
  };

  const handleIssueCreditNote = async () => {
    const reason = prompt(`Reason for issuing Credit Note against ${invoice.invoiceNumber}?`);
    if (!reason) return;

    try {
      const res = await issueCreditNoteAction(invoice.id, reason);
      toast.success(`Credit Note ${res.cnNumber} issued!`);
      router.push(`/dashboard/legal-finance/invoices/${res.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to issue Credit Note.");
    }
  };

  const handleReversePayment = async (paymentId: number) => {
    const reason = prompt("Reason for reversing this payment?");
    if (!reason) return;

    try {
      await reversePaymentAction(paymentId, reason);
      toast.success("Payment reversed.");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Reversal failed.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const totalWords = numberToWordsINR(invoice.totalAmount || 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Action Bar (Hidden on print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/legal-finance/invoices"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-serif">
                {invoice.invoiceNumber}
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {invoice.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Client: <strong className="text-slate-800">{invoice.clientName || "Unknown"}</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {invoice.status !== "Paid" && invoice.status !== "Cancelled" && (
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-xs"
            >
              <DollarSign className="w-3.5 h-3.5" /> Record Payment
            </button>
          )}

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" /> Print / Save PDF
          </button>

          {invoice.status !== "Cancelled" && invoice.status !== "Credit Note" && (
            <button
              onClick={handleIssueCreditNote}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors"
            >
              Issue Credit Note
            </button>
          )}

          {invoice.status !== "Cancelled" && (
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors"
            >
              <Ban className="w-3.5 h-3.5" /> Cancel Invoice
            </button>
          )}
        </div>
      </div>

      {/* Tax Invoice Document Box (Printable) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6 print:shadow-none print:border-none print:p-0">
        {/* Invoice Header */}
        <div className="flex justify-between items-start border-b border-slate-200 pb-6">
          <div>
            <h2 className="text-xl font-bold text-[#133255] font-serif">MAUNA KEA OS</h2>
            <p className="text-xs text-slate-500 mt-1">Executive Search & Talent Advisory</p>
            <p className="text-xs text-slate-500">SAC Code: {invoice.hsnSacCode || "998313"} (Recruitment Services)</p>
          </div>
          <div className="text-right">
            <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wide">Tax Invoice</h3>
            <p className="text-xs font-bold text-[#133255] mt-1">{invoice.invoiceNumber}</p>
            <p className="text-xs text-slate-500">Date: {invoice.invoiceDate}</p>
            <p className="text-xs text-slate-500">Due Date: {invoice.dueDate}</p>
          </div>
        </div>

        {/* Bill To & Details */}
        <div className="grid grid-cols-2 gap-6 text-xs border-b border-slate-200 pb-6">
          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Billed To</span>
            <p className="font-bold text-slate-900 text-sm">{invoice.clientName}</p>
            <p className="text-slate-600 mt-1">{invoice.clientAddress || "Address not recorded"}</p>
            <p className="text-slate-600 mt-1"><strong>GSTIN:</strong> {invoice.clientGst || "N/A"}</p>
          </div>
          <div className="text-right space-y-1">
            <p><strong>Linked Contract:</strong> {invoice.contractNumber || "Standard Contract"}</p>
            <p><strong>PO Number:</strong> {invoice.poNumber || "N/A"}</p>
            <p><strong>Consultant:</strong> {invoice.consultant || "MK Team"}</p>
            <p><strong>Annual CTC:</strong> ₹{(invoice.annualCtc || 0)} Lakhs</p>
            <p><strong>Fee Structure:</strong> {invoice.commercialPct}% Success Fee</p>
          </div>
        </div>

        {/* Line Items Table */}
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
              <th className="p-3">Description</th>
              <th className="p-3 text-right">SAC Code</th>
              <th className="p-3 text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="p-3">
                <p className="font-semibold text-slate-900">Executive Search Professional Fee</p>
                <p className="text-slate-500 text-[11px]">
                  Success fee ({invoice.commercialPct}%) for Placement against Annual CTC of ₹{invoice.annualCtc} Lakhs
                </p>
              </td>
              <td className="p-3 text-right text-slate-600">{invoice.hsnSacCode || "998313"}</td>
              <td className="p-3 text-right font-semibold text-slate-900">
                ₹{(invoice.feeBeforeTax || 0).toLocaleString("en-IN")}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Breakdown & Totals */}
        <div className="flex justify-end pt-2 border-t border-slate-200">
          <div className="w-72 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Subtotal (Excl GST):</span>
              <span className="font-semibold text-slate-900">
                ₹{(invoice.feeBeforeTax || 0).toLocaleString("en-IN")}
              </span>
            </div>
            {invoice.cgstAmount ? (
              <>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">CGST (9%):</span>
                  <span className="font-semibold text-slate-900">
                    ₹{invoice.cgstAmount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">SGST (9%):</span>
                  <span className="font-semibold text-slate-900">
                    ₹{invoice.sgstAmount?.toLocaleString("en-IN")}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">IGST ({invoice.gstRate || 18}%):</span>
                <span className="font-semibold text-slate-900">
                  ₹{(invoice.igstAmount || invoice.gstAmount || 0).toLocaleString("en-IN")}
                </span>
              </div>
            )}
            <div className="flex justify-between py-2 border-t-2 border-slate-900 font-bold text-sm text-[#133255]">
              <span>Total Invoice Value:</span>
              <span>₹{(invoice.totalAmount || 0).toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Amount in Words */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
          <strong>Amount in Words:</strong> {totalWords}
        </div>
      </div>

      {/* Payment Ledger Section (Hidden on print) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4 print:hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900">Payment Collection Ledger</h3>
          <div className="text-xs text-slate-500">
            Paid: <strong className="text-emerald-600">₹{(invoice.amountPaid || 0).toLocaleString("en-IN")}</strong> | 
            Outstanding: <strong className="text-amber-600">₹{(invoice.amountOutstanding || 0).toLocaleString("en-IN")}</strong>
          </div>
        </div>

        {invoice.payments.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No payment entries recorded yet.</p>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                <th className="p-2.5">Date</th>
                <th className="p-2.5">Mode</th>
                <th className="p-2.5">UTR / Ref</th>
                <th className="p-2.5 text-right">Amount (₹)</th>
                <th className="p-2.5">Recorded By</th>
                <th className="p-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.payments.map((p: any) => (
                <tr key={p.id} className={p.isReversed ? "opacity-50 line-through bg-slate-50" : ""}>
                  <td className="p-2.5">{p.paymentDate}</td>
                  <td className="p-2.5 font-semibold">{p.mode || "NEFT"}</td>
                  <td className="p-2.5">{p.utrNumber || p.referenceNumber || "-"}</td>
                  <td className="p-2.5 text-right font-bold text-emerald-600">
                    ₹{(p.amount || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="p-2.5 text-slate-500">{p.recordedBy || "System"}</td>
                  <td className="p-2.5 text-right">
                    {!p.isReversed && (
                      <button
                        onClick={() => handleReversePayment(p.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Reverse Payment"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        invoiceId={invoice.id}
        invoiceNumber={invoice.invoiceNumber}
        outstandingAmount={invoice.amountOutstanding || 0}
      />
    </div>
  );
}
