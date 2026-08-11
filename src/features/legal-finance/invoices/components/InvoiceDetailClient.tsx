"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  DollarSign,
  Ban,
  RotateCcw,
  FileX,
} from "lucide-react";
import toast from "react-hot-toast";
import RecordPaymentModal from "@/features/legal-finance/payments/components/RecordPaymentModal";
import { cancelInvoiceAction, issueCreditNoteAction, reversePaymentAction } from "@/actions/legal-finance";
import { numberToWordsINR } from "@/lib/number-to-words";
import { MK_COMPANY, getStateCode } from "@/lib/constants/mk-company";

interface InvoiceDetailProps {
  invoice: {
    id: string;
    invoiceNumber: string;
    clientId: string;
    clientName: string | null;
    clientLegalName?: string | null;
    clientGst: string | null;
    clientAddress: string | null;
    clientRegisteredAddress?: string | null;
    clientState?: string | null;
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
    utgstAmount?: number | null;
    taxType?: string | null;
    lineItems?: any[];
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

const STATUS_STYLES: Record<string, string> = {
  Draft: "bg-amber-50 text-amber-700 border border-amber-200",
  Issued: "bg-blue-50 text-blue-700 border border-blue-200",
  Sent: "bg-violet-50 text-violet-700 border border-violet-200",
  Paid: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Overdue: "bg-rose-50 text-rose-700 border border-rose-200",
  Cancelled: "bg-slate-50 text-slate-500 border border-slate-200",
  "Credit Note": "bg-orange-50 text-orange-700 border border-orange-200",
};

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
    const reason = prompt(`Reason for Credit Note against ${invoice.invoiceNumber}?`);
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

  // Tax calculations
  const feeBeforeTax = invoice.feeBeforeTax || 0;
  const cgst = invoice.cgstAmount || 0;
  const sgst = invoice.sgstAmount || 0;
  const utgst = invoice.utgstAmount || 0;
  const igst = invoice.igstAmount || 0;
  const totalGst = cgst + sgst + utgst + igst;
  const totalAmount = invoice.totalAmount || (feeBeforeTax + totalGst);
  const totalWords = numberToWordsINR(Math.round(totalAmount));

  // Client info
  const clientDisplayName = invoice.clientLegalName || invoice.clientName || "—";
  const clientAddress = invoice.clientRegisteredAddress || invoice.clientAddress || "Address not recorded — update in Client Master";
  const clientState = invoice.clientState || "";
  const clientStateCode = getStateCode(clientState);
  const clientGstin = invoice.clientGst || "Not Available";

  // Tax type
  const taxType = invoice.taxType || "INTRA_STATE";

  // Line items: fall back to single line if no lineItems array
  const sacCode = invoice.hsnSacCode || MK_COMPANY.sacCode;
  const lineItems: any[] = (invoice.lineItems && invoice.lineItems.length > 0)
    ? invoice.lineItems
    : [{
        particulars: `Executive Search Professional Fee — Success fee (${invoice.commercialPct || 0}%) for Placement`,
        feeAmount: feeBeforeTax,
      }];

  // Per line item tax split (proportional)
  const totalFee = lineItems.reduce((s, l) => s + (l.feeAmount || 0), 0);
  const getLineTax = (feeAmount: number, component: "cgst" | "sgst" | "igst" | "utgst") => {
    if (totalFee === 0) return 0;
    const share = feeAmount / totalFee;
    if (component === "cgst") return Math.round(cgst * share);
    if (component === "sgst") return Math.round(sgst * share);
    if (component === "igst") return Math.round(igst * share);
    if (component === "utgst") return Math.round(utgst * share);
    return 0;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* ── Action toolbar (hidden on print) ── */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/legal-finance/invoices" className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 font-serif">{invoice.invoiceNumber}</h1>
            <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded-full mt-0.5 ${STATUS_STYLES[invoice.status] || "bg-slate-100 text-slate-600"}`}>
              {invoice.status}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            <Printer className="w-3.5 h-3.5" /> Print / PDF
          </button>

          {invoice.status !== "Cancelled" && invoice.status !== "Credit Note" && (
            <>
              <button onClick={() => setIsPaymentModalOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors">
                <DollarSign className="w-3.5 h-3.5" /> Record Payment
              </button>
              <button onClick={handleIssueCreditNote} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-200 rounded-xl hover:bg-violet-100 transition-colors">
                <FileX className="w-3.5 h-3.5" /> Credit Note
              </button>
              <button onClick={handleCancel} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors">
                <Ban className="w-3.5 h-3.5" /> Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* TAX INVOICE DOCUMENT — Matches sample invoice layout */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 print:shadow-none print:border-none print:rounded-none" id="invoice-print-area">

        {/* ── HEADER ── */}
        <div className="text-center py-5 px-6 border-b border-slate-300">
          <h1 className="text-4xl font-black tracking-[0.18em] text-slate-900 font-serif uppercase">MAUNA KEA</h1>
          <p className="text-sm font-semibold text-slate-700 mt-0.5 tracking-wide">{MK_COMPANY.tagline}</p>
          <p className="text-[11px] text-slate-600 mt-1">{MK_COMPANY.address}</p>
          <p className="text-[11px] font-bold text-slate-800 mt-1">GSTIN:- {MK_COMPANY.gstin}</p>
          <p className="text-sm font-bold text-slate-900 mt-1 uppercase tracking-widest border-t border-slate-200 pt-2">TAX INVOICE</p>
        </div>

        {/* ── INVOICE METADATA ── */}
        <table className="w-full text-[11px] border-b border-slate-300">
          <tbody>
            <tr className="divide-x divide-slate-300 border-b border-slate-300">
              <td className="px-3 py-1.5 w-28 font-bold text-slate-600 uppercase">Invoice No.</td>
              <td className="px-3 py-1.5 font-semibold text-slate-900">{invoice.invoiceNumber}</td>
              <td className="px-3 py-1.5 w-16 font-bold text-slate-600 uppercase">State</td>
              <td className="px-3 py-1.5 font-semibold text-slate-900 uppercase">{MK_COMPANY.state}</td>
              <td className="px-3 py-1.5 font-bold text-slate-600 uppercase">Original for Recipient</td>
              <td className="px-3 py-1.5 font-semibold text-emerald-700">YES</td>
              <td className="px-3 py-1.5 font-bold text-slate-600 uppercase">Duplicate for Supplier</td>
              <td className="px-3 py-1.5 font-semibold text-slate-900">NO</td>
            </tr>
            <tr className="divide-x divide-slate-300">
              <td className="px-3 py-1.5 font-bold text-slate-600 uppercase">Invoice Date</td>
              <td className="px-3 py-1.5 font-semibold text-slate-900">{invoice.invoiceDate}</td>
              <td className="px-3 py-1.5 font-bold text-slate-600 uppercase">State Code</td>
              <td className="px-3 py-1.5 font-semibold text-slate-900">{MK_COMPANY.stateCode.replace(/^0/, "")}</td>
              {invoice.poNumber && (
                <>
                  <td className="px-3 py-1.5 font-bold text-slate-600 uppercase">PO Number</td>
                  <td className="px-3 py-1.5 font-semibold text-slate-900" colSpan={3}>{invoice.poNumber}</td>
                </>
              )}
              {!invoice.poNumber && <td colSpan={4} />}
            </tr>
          </tbody>
        </table>

        {/* ── RECEIVER + CONSIGNEE ── */}
        <div className="grid grid-cols-2 divide-x divide-slate-300 border-b border-slate-300 text-[11px]">
          {/* Details of Receiver */}
          <div className="px-4 py-3 space-y-2">
            <p className="font-bold text-slate-600 uppercase text-center border-b border-slate-200 pb-1 mb-2">Details of Receiver</p>
            <div className="grid grid-cols-[80px_1fr] gap-y-1.5">
              <span className="font-bold text-slate-600 uppercase text-[10px]">Name</span>
              <span className="font-semibold text-slate-900">{clientDisplayName}</span>
              <span className="font-bold text-slate-600 uppercase text-[10px]">Address</span>
              <span className="text-slate-700">{clientAddress}</span>
              <span className="font-bold text-slate-600 uppercase text-[10px]">State</span>
              <span className="text-slate-700">{clientState || "—"}</span>
              <span className="font-bold text-slate-600 uppercase text-[10px]">State Code</span>
              <span className="text-slate-700">{clientStateCode || "—"}</span>
              <span className="font-bold text-slate-600 uppercase text-[10px]">GSTIN</span>
              <span className="font-semibold text-slate-900">{clientGstin}</span>
            </div>
          </div>
          {/* Details of Consignee (same as receiver for B2B) */}
          <div className="px-4 py-3 space-y-2">
            <p className="font-bold text-slate-600 uppercase text-center border-b border-slate-200 pb-1 mb-2">Details of Consignee</p>
            <div className="grid grid-cols-[80px_1fr] gap-y-1.5">
              <span className="font-bold text-slate-600 uppercase text-[10px]">Name</span>
              <span className="font-semibold text-slate-900">{clientDisplayName}</span>
              <span className="font-bold text-slate-600 uppercase text-[10px]">Address</span>
              <span className="text-slate-700">{clientAddress}</span>
              <span className="font-bold text-slate-600 uppercase text-[10px]">State</span>
              <span className="text-slate-700">{clientState || "—"}</span>
              <span className="font-bold text-slate-600 uppercase text-[10px]">State Code</span>
              <span className="text-slate-700">{clientStateCode || "—"}</span>
              <span className="font-bold text-slate-600 uppercase text-[10px]">GSTIN</span>
              <span className="font-semibold text-slate-900">{clientGstin}</span>
            </div>
          </div>
        </div>

        {/* ── LINE ITEMS TABLE ── */}
        <div className="overflow-x-auto">
          <table className="w-full text-[10.5px] border-b border-slate-300">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-300 text-[10px] font-bold text-slate-700 uppercase">
                <th className="px-2 py-2 text-center border-r border-slate-200 w-8">SR.</th>
                <th className="px-2 py-2 border-r border-slate-200 min-w-[220px]">Description of Services / Goods</th>
                <th className="px-2 py-2 text-center border-r border-slate-200 w-20">HSN/SAC Code</th>
                <th className="px-2 py-2 text-center border-r border-slate-200 w-16">Rate</th>
                <th className="px-2 py-2 text-right border-r border-slate-200 w-24">Amount</th>
                <th className="px-2 py-2 text-right border-r border-slate-200 w-24">Less: Discount</th>
                <th className="px-2 py-2 text-right border-r border-slate-200 w-28 font-bold">Taxable Value</th>
                {(taxType === "INTRA_STATE" || taxType === "UNION_TERRITORY") && (
                  <th className="px-2 py-2 text-center border-r border-slate-200 w-24" colSpan={2}>CGST</th>
                )}
                {taxType === "INTRA_STATE" && (
                  <th className="px-2 py-2 text-center border-r border-slate-200 w-24" colSpan={2}>SGST</th>
                )}
                {taxType === "UNION_TERRITORY" && (
                  <th className="px-2 py-2 text-center border-r border-slate-200 w-24" colSpan={2}>UTGST</th>
                )}
                {taxType === "INTER_STATE" && (
                  <th className="px-2 py-2 text-center border-r border-slate-200 w-24" colSpan={2}>IGST</th>
                )}
                <th className="px-2 py-2 text-right w-28 font-bold">Total</th>
              </tr>
              {/* Sub-header for tax rate/amount columns */}
              <tr className="bg-slate-50 border-b border-slate-300 text-[9px] text-slate-500 uppercase">
                <th className="border-r border-slate-200" colSpan={7} />
                {taxType !== "INTER_STATE" && (
                  <>
                    <th className="px-2 py-1 text-center border-r border-slate-200">Rate</th>
                    <th className="px-2 py-1 text-center border-r border-slate-200">Amount</th>
                    <th className="px-2 py-1 text-center border-r border-slate-200">Rate</th>
                    <th className="px-2 py-1 text-center border-r border-slate-200">Amount</th>
                  </>
                )}
                {taxType === "INTER_STATE" && (
                  <>
                    <th className="px-2 py-1 text-center border-r border-slate-200">Rate</th>
                    <th className="px-2 py-1 text-center border-r border-slate-200">Amount</th>
                  </>
                )}
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lineItems.map((item: any, idx: number) => {
                const fee = item.feeAmount || 0;
                const lineCgst = getLineTax(fee, "cgst");
                const lineSgst = getLineTax(fee, "sgst");
                const lineUtgst = getLineTax(fee, "utgst");
                const lineIgst = getLineTax(fee, "igst");
                return (
                  <tr key={idx} className="divide-x divide-slate-100">
                    <td className="px-2 py-2 text-center text-slate-500 font-bold">{idx + 1}</td>
                    <td className="px-2 py-2 text-slate-800 whitespace-pre-line">{item.particulars || "Executive Search Professional Fee"}</td>
                    <td className="px-2 py-2 text-center text-slate-600 font-mono">{sacCode}</td>
                    <td className="px-2 py-2 text-center text-slate-600">—</td>
                    <td className="px-2 py-2 text-right font-mono text-slate-800">{fee.toLocaleString("en-IN")}</td>
                    <td className="px-2 py-2 text-center text-slate-400">-</td>
                    <td className="px-2 py-2 text-right font-bold font-mono text-slate-900">{fee.toLocaleString("en-IN")}</td>
                    {taxType !== "INTER_STATE" && (
                      <>
                        <td className="px-2 py-2 text-center text-slate-600">9</td>
                        <td className="px-2 py-2 text-right font-mono text-slate-800">{lineCgst.toLocaleString("en-IN")}</td>
                        <td className="px-2 py-2 text-center text-slate-600">9</td>
                        <td className="px-2 py-2 text-right font-mono text-slate-800">
                          {taxType === "UNION_TERRITORY" ? lineUtgst.toLocaleString("en-IN") : lineSgst.toLocaleString("en-IN")}
                        </td>
                      </>
                    )}
                    {taxType === "INTER_STATE" && (
                      <>
                        <td className="px-2 py-2 text-center text-slate-600">18</td>
                        <td className="px-2 py-2 text-right font-mono text-slate-800">{lineIgst.toLocaleString("en-IN")}</td>
                      </>
                    )}
                    <td className="px-2 py-2 text-right font-bold font-mono text-slate-900">{fee.toLocaleString("en-IN")}</td>
                  </tr>
                );
              })}
            </tbody>
            {/* TOTAL row */}
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold text-[11px] divide-x divide-slate-300">
                <td className="px-2 py-2 text-right text-slate-600 uppercase" colSpan={4}>TOTAL</td>
                <td className="px-2 py-2 text-right font-mono text-slate-900">{feeBeforeTax.toLocaleString("en-IN")}</td>
                <td className="px-2 py-2 text-center text-slate-400">-</td>
                <td className="px-2 py-2 text-right font-mono text-slate-900">{feeBeforeTax.toLocaleString("en-IN")}</td>
                {taxType !== "INTER_STATE" && (
                  <>
                    <td className="px-2 py-2" />
                    <td className="px-2 py-2 text-right font-mono text-slate-900">{cgst.toLocaleString("en-IN")}</td>
                    <td className="px-2 py-2" />
                    <td className="px-2 py-2 text-right font-mono text-slate-900">
                      {taxType === "UNION_TERRITORY" ? utgst.toLocaleString("en-IN") : sgst.toLocaleString("en-IN")}
                    </td>
                  </>
                )}
                {taxType === "INTER_STATE" && (
                  <>
                    <td className="px-2 py-2" />
                    <td className="px-2 py-2 text-right font-mono text-slate-900">{igst.toLocaleString("en-IN")}</td>
                  </>
                )}
                <td className="px-2 py-2 text-right font-mono text-slate-900">{feeBeforeTax.toLocaleString("en-IN")}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ── FOOTER: Amount in Words + Bank + Totals + Signatory ── */}
        <div className="grid grid-cols-2 divide-x divide-slate-300 border-b border-slate-300">
          {/* Left: Amount in Words + Bank Details */}
          <div className="px-4 py-3 space-y-3 text-[11px]">
            <div>
              <p className="font-bold text-slate-700 uppercase text-[10px] mb-1">Total Amount in Words:-</p>
              <p className="font-semibold text-slate-900 uppercase">{totalWords}</p>
            </div>
            <div className="space-y-0.5">
              <p className="font-bold text-slate-700 uppercase text-[10px]">Bank Details:- {MK_COMPANY.bank.name}</p>
              <p className="text-slate-700">PAN NO: {MK_COMPANY.pan}</p>
              <p className="text-slate-700">Bank Account No.:- {MK_COMPANY.bank.accountNo}</p>
              <p className="text-slate-700">Bank Branch IFSC:- {MK_COMPANY.bank.ifsc}</p>
            </div>
            <div>
              <p className="font-bold text-slate-600 uppercase text-[10px]">Terms and Conditions</p>
              <p className="text-slate-500 text-[10px] mt-0.5">{MK_COMPANY.termsAndConditions}</p>
            </div>
          </div>

          {/* Right: Tax totals breakdown */}
          <div className="px-4 py-3 text-[11px]">
            <table className="w-full">
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-1 text-slate-600">Total Amount Before Tax</td>
                  <td className="py-1 text-right font-mono font-semibold text-slate-900">{feeBeforeTax.toLocaleString("en-IN")}</td>
                </tr>
                <tr>
                  <td className="py-1 text-slate-600">Add: CGST</td>
                  <td className="py-1 text-right font-mono text-slate-800">{(cgst || 0).toLocaleString("en-IN") || "-"}</td>
                </tr>
                {taxType === "INTRA_STATE" && (
                  <tr>
                    <td className="py-1 text-slate-600">Add: SGST</td>
                    <td className="py-1 text-right font-mono text-slate-800">{(sgst || 0).toLocaleString("en-IN")}</td>
                  </tr>
                )}
                {taxType === "UNION_TERRITORY" && (
                  <tr>
                    <td className="py-1 text-slate-600">Add: UTGST</td>
                    <td className="py-1 text-right font-mono text-slate-800">{(utgst || 0).toLocaleString("en-IN")}</td>
                  </tr>
                )}
                <tr>
                  <td className="py-1 text-slate-600">Add: IGST</td>
                  <td className="py-1 text-right font-mono text-slate-800">{igst > 0 ? igst.toLocaleString("en-IN") : "-"}</td>
                </tr>
                <tr className="border-t border-slate-300">
                  <td className="py-1.5 font-bold text-slate-800 uppercase text-[10px]">Total Amount GST</td>
                  <td className="py-1.5 text-right font-mono font-bold text-slate-900">{totalGst.toLocaleString("en-IN")}</td>
                </tr>
                <tr className="border-t-2 border-slate-900">
                  <td className="py-2 font-bold text-slate-900 text-[12px]">Total Amount After Tax (Rounded Off)</td>
                  <td className="py-2 text-right font-mono font-bold text-[13px] text-[#133255]">{Math.round(totalAmount).toLocaleString("en-IN")}</td>
                </tr>
                <tr className="border-t border-slate-200">
                  <td className="py-1 text-slate-500 text-[10px]">GST Payable on Reverse Charge</td>
                  <td className="py-1 text-right text-slate-500 text-[10px]">{MK_COMPANY.reverseCharge}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── SIGNATORY FOOTER ── */}
        <div className="grid grid-cols-2 divide-x divide-slate-300 text-[11px]">
          <div className="px-4 py-3">
            <p className="font-semibold text-slate-700">{MK_COMPANY.certification}</p>
          </div>
          <div className="px-4 py-3 text-right space-y-3">
            <p className="font-semibold text-slate-700">{MK_COMPANY.signatoryFor}</p>
            <div className="flex justify-end">
              <div className="w-24 h-16 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-300 text-[9px] text-center">
                AUTHORISED<br />SIGNATORY<br />STAMP
              </div>
            </div>
            <p className="font-bold text-slate-900 border-t border-slate-300 pt-2">{MK_COMPANY.authorisedSignatory}</p>
          </div>
        </div>
      </div>

      {/* ── PAYMENT LEDGER (hidden on print) ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4 print:hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900">Payment Collection Ledger</h3>
          <div className="text-xs text-slate-500">
            Paid: <strong className="text-emerald-600">₹{(invoice.amountPaid || 0).toLocaleString("en-IN")}</strong> |{" "}
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
                  <td className="p-2.5 text-right font-bold text-emerald-600">₹{(p.amount || 0).toLocaleString("en-IN")}</td>
                  <td className="p-2.5 text-slate-500">{p.recordedBy || "System"}</td>
                  <td className="p-2.5 text-right">
                    {!p.isReversed && (
                      <button onClick={() => handleReversePayment(p.id)} className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Reverse Payment">
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
