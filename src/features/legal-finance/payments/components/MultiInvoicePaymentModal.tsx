"use client";

import { useState } from "react";
import { X, DollarSign, CheckCircle2, AlertCircle, Layers } from "lucide-react";
import toast from "react-hot-toast";
import { recordPaymentAction } from "@/actions/legal-finance";

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  clientName: string;
  amountOutstanding: number;
}

interface MultiInvoicePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: InvoiceRow[];
}

export default function MultiInvoicePaymentModal({
  isOpen,
  onClose,
  invoices,
}: MultiInvoicePaymentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [mode, setMode] = useState("NEFT");
  const [utrNumber, setUtrNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [overrideAmounts, setOverrideAmounts] = useState<Record<string, number>>({});

  if (!isOpen) return null;

  const selectedInvoices = invoices.filter((inv) => selectedIds.has(inv.id));
  const totalSelected = selectedInvoices.reduce(
    (sum, inv) => sum + (overrideAmounts[inv.id] ?? inv.amountOutstanding),
    0
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.size === 0) {
      toast.error("Select at least one invoice.");
      return;
    }
    if (!utrNumber.trim()) {
      toast.error("Please enter a UTR / Reference number for the bulk payment.");
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;
    let failCount = 0;

    for (const inv of selectedInvoices) {
      const amount = overrideAmounts[inv.id] ?? inv.amountOutstanding;
      if (amount <= 0) continue;
      try {
        await recordPaymentAction({
          invoiceId: inv.id,
          paymentDate,
          amount,
          mode,
          utrNumber,
          notes: notes || undefined,
        });
        successCount++;
      } catch (err: any) {
        failCount++;
        console.error(`Failed for ${inv.invoiceNumber}:`, err.message);
      }
    }

    setIsSubmitting(false);
    if (successCount > 0) {
      toast.success(`${successCount} payment(s) recorded successfully!`);
      if (failCount > 0) toast.error(`${failCount} payment(s) failed — check console.`);
      onClose();
      window.location.reload();
    } else {
      toast.error("All payments failed. Check amounts and try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#133255]" />
            Multi-Invoice Bulk Payment
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Invoice Selection */}
          <div>
            <p className="text-xs font-bold text-slate-700 mb-2">
              Select Invoices to Pay ({selectedIds.size} selected)
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {invoices.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No outstanding invoices.</p>
              ) : (
                invoices.map((inv) => (
                  <label
                    key={inv.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all text-xs ${
                      selectedIds.has(inv.id)
                        ? "bg-emerald-50 border-emerald-300"
                        : "bg-slate-50 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(inv.id)}
                      onChange={() => toggleSelect(inv.id)}
                      className="w-4 h-4 rounded text-emerald-600"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900">{inv.invoiceNumber}</p>
                      <p className="text-slate-500 truncate">{inv.clientName}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {selectedIds.has(inv.id) ? (
                        <input
                          type="number"
                          value={overrideAmounts[inv.id] ?? inv.amountOutstanding}
                          onChange={(e) =>
                            setOverrideAmounts((prev) => ({
                              ...prev,
                              [inv.id]: parseFloat(e.target.value) || 0,
                            }))
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="w-28 px-2 py-1 text-xs text-right bg-white border border-emerald-200 rounded-lg font-bold"
                        />
                      ) : (
                        <span className="font-bold text-amber-700">
                          ₹{inv.amountOutstanding.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Total */}
          {selectedIds.size > 0 && (
            <div className="bg-[#133255] text-white rounded-xl p-3 flex justify-between items-center text-xs">
              <span className="text-slate-300">Total Payment Amount</span>
              <span className="text-lg font-bold font-serif text-emerald-400">
                ₹{totalSelected.toLocaleString("en-IN")}
              </span>
            </div>
          )}

          {/* Payment Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Date *</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              >
                <option value="NEFT">NEFT</option>
                <option value="RTGS">RTGS</option>
                <option value="IMPS">IMPS</option>
                <option value="Cheque">Cheque</option>
                <option value="UPI">UPI</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              UTR / Reference No. * <span className="text-slate-400 font-normal">(applies to all selected invoices)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. UTR984210"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Bulk payment reference, bank details, etc."
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
              disabled={isSubmitting || selectedIds.size === 0}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#133255] rounded-xl hover:bg-[#1a3d66] transition-colors shadow-xs disabled:opacity-40"
            >
              {isSubmitting ? "Recording..." : `Record ${selectedIds.size} Payment(s)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
