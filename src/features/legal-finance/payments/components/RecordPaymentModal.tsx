"use client";

import { useState } from "react";
import { X, DollarSign, Percent, Link2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { recordPaymentAction } from "@/actions/legal-finance";

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string;
  invoiceNumber: string;
  outstandingAmount: number;
  invoiceTdsRate?: number | null;
}

export default function RecordPaymentModal({
  isOpen,
  onClose,
  invoiceId,
  invoiceNumber,
  outstandingAmount,
  invoiceTdsRate,
}: RecordPaymentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    paymentDate: new Date().toISOString().split("T")[0],
    amount: outstandingAmount,
    mode: "NEFT",
    referenceNumber: "",
    utrNumber: "",
    notes: "",
    tdsApplicable: false,
    tdsRate: invoiceTdsRate ?? 10,
    tdsEvidenceUrl: "",
  });

  if (!isOpen) return null;

  const tdsAmount = formData.tdsApplicable
    ? Math.round((formData.amount * formData.tdsRate) / 100)
    : 0;
  const netReceived = formData.amount - tdsAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) {
      toast.error("Payment amount must be greater than zero.");
      return;
    }

    setIsSubmitting(true);
    try {
      await recordPaymentAction({
        invoiceId,
        paymentDate: formData.paymentDate,
        amount: formData.amount,
        mode: formData.mode,
        referenceNumber: formData.referenceNumber,
        utrNumber: formData.utrNumber,
        notes: formData.notes,
        tdsRate: formData.tdsApplicable ? formData.tdsRate : 0,
        tdsAmount: tdsAmount,
        tdsEvidenceUrl: formData.tdsApplicable ? formData.tdsEvidenceUrl : undefined,
      });

      toast.success("Payment recorded successfully!");
      onClose();
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Failed to record payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Record Payment for {invoiceNumber}
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Payment Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Date *</label>
            <input
              type="date"
              value={formData.paymentDate}
              onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#133255]/20"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Gross Amount Billed (₹) * 
              <span className="text-slate-400 font-normal ml-1">(Outstanding: ₹{outstandingAmount.toLocaleString("en-IN")})</span>
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#133255]/20"
            />
          </div>

          {/* Mode + UTR */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode</label>
              <select
                value={formData.mode}
                onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              >
                <option value="NEFT">NEFT</option>
                <option value="RTGS">RTGS</option>
                <option value="IMPS">IMPS</option>
                <option value="Cheque">Cheque</option>
                <option value="UPI">UPI</option>
                <option value="TDS Only">TDS Only</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">UTR / Reference No.</label>
              <input
                type="text"
                placeholder="e.g. UTR984210"
                value={formData.utrNumber}
                onChange={(e) => setFormData({ ...formData, utrNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          {/* TDS Section */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.tdsApplicable}
                onChange={(e) => setFormData({ ...formData, tdsApplicable: e.target.checked })}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <span className="text-xs font-bold text-amber-900">Client Has Deducted TDS</span>
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            </label>

            {formData.tdsApplicable && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-amber-800 mb-1">TDS Rate (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="30"
                        value={formData.tdsRate}
                        onChange={(e) => setFormData({ ...formData, tdsRate: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 text-xs bg-white border border-amber-200 rounded-xl focus:outline-none pr-8"
                      />
                      <Percent className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-amber-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-amber-800 mb-1">TDS Amount (₹)</label>
                    <div className="px-3 py-2 text-xs bg-amber-100 border border-amber-200 rounded-xl font-bold text-amber-900">
                      ₹{tdsAmount.toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>

                {/* Net received summary */}
                <div className="bg-white rounded-lg border border-amber-200 p-2.5 text-xs flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Net Amount to be Received</span>
                  <span className="font-bold text-emerald-700">₹{netReceived.toLocaleString("en-IN")}</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-amber-800 mb-1">TDS Certificate / Evidence URL</label>
                  <div className="relative">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-500" />
                    <input
                      type="url"
                      placeholder="https://... (cloud link to TDS certificate)"
                      value={formData.tdsEvidenceUrl}
                      onChange={(e) => setFormData({ ...formData, tdsEvidenceUrl: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-amber-200 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Bank Details</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-xs"
            >
              {isSubmitting ? "Recording..." : "Save Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
