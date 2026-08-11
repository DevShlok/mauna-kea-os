"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calculator, FileText, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { createInvoiceAction } from "@/actions/legal-finance";

interface OptionClient {
  id: string;
  name: string;
  legalEntityName: string | null;
  gstNumber: string | null;
  gstRate: number | null;
  requiresPo: boolean | null;
}

interface OptionContract {
  id: string;
  contractNumber: string;
  clientId: string;
  successFeePct: number | null;
  paymentTerms: string | null;
}

export default function RaiseInvoiceClient({
  clientsList,
  contractsList,
}: {
  clientsList: OptionClient[];
  contractsList: OptionContract[];
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    clientId: "",
    contractId: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d.toISOString().split("T")[0];
    })(),
    annualCtc: 50, // in Lakhs
    commercialPct: 20,
    poNumber: "",
    notes: "",
  });

  const selectedClient = clientsList.find((c) => c.id === formData.clientId);
  const availableContracts = contractsList.filter((c) => c.clientId === formData.clientId);
  const selectedContract = availableContracts.find((c) => c.id === formData.contractId);

  // Auto-select active contract & commercial terms when client changes
  useEffect(() => {
    if (formData.clientId) {
      const clientCons = contractsList.filter((c) => c.clientId === formData.clientId);
      if (clientCons.length > 0) {
        const active = clientCons[0];
        setFormData((prev) => ({
          ...prev,
          contractId: active.id,
          commercialPct: active.successFeePct || 20,
        }));
      }
    }
  }, [formData.clientId]);

  // Financial calculations
  const ctcRupees = (formData.annualCtc || 0) * 100000;
  const feeBeforeTax = Math.round((ctcRupees * (formData.commercialPct || 0)) / 100);
  const gstRate = selectedClient?.gstRate || 18;
  const gstAmount = Math.round((feeBeforeTax * gstRate) / 100);
  const totalAmount = feeBeforeTax + gstAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientId) {
      toast.error("Please select a client.");
      return;
    }
    if (!formData.contractId) {
      toast.error("Please select a valid contract.");
      return;
    }
    if (selectedClient?.requiresPo && !formData.poNumber?.trim()) {
      toast.error("Client requires a Purchase Order (PO) number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createInvoiceAction({
        clientId: formData.clientId,
        contractId: formData.contractId,
        invoiceDate: formData.invoiceDate,
        dueDate: formData.dueDate,
        annualCtc: formData.annualCtc,
        commercialPct: formData.commercialPct,
        poNumber: formData.poNumber,
        notes: formData.notes,
      });

      toast.success(`Tax Invoice ${res.invoiceNumber} raised successfully!`);
      router.push(`/dashboard/legal-finance/invoices/${res.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to raise invoice.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
        <button
          onClick={() => window.history.back()}
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-serif">
            Raise Tax Invoice
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Auto-linked with Client Contract & Commercial Snapshot
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Client *
            </label>
            <select
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#133255]/20 focus:outline-none"
            >
              <option value="">-- Select Client --</option>
              {clientsList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.gstNumber ? `(GST: ${c.gstNumber})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Linked Contract *
            </label>
            <select
              value={formData.contractId}
              onChange={(e) => setFormData({ ...formData, contractId: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#133255]/20 focus:outline-none"
            >
              <option value="">-- Select Contract --</option>
              {availableContracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.contractNumber} ({c.successFeePct}% Fee)
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedClient?.requiresPo && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-2 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>This client mandates a Purchase Order (PO) Number on all invoices.</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Candidate Annual CTC (in Lakhs ₹) *
            </label>
            <input
              type="number"
              step="0.5"
              value={formData.annualCtc}
              onChange={(e) => setFormData({ ...formData, annualCtc: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Commercial Fee % *
            </label>
            <input
              type="number"
              step="0.5"
              value={formData.commercialPct}
              onChange={(e) => setFormData({ ...formData, commercialPct: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              PO Number {selectedClient?.requiresPo ? "*" : ""}
            </label>
            <input
              type="text"
              placeholder="e.g. PO-98421"
              value={formData.poNumber}
              onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Invoice Date *
            </label>
            <input
              type="date"
              value={formData.invoiceDate}
              onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Due Date *
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            />
          </div>
        </div>

        {/* Calculation Summary Card */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-200 pb-2">
            <Calculator className="w-4 h-4 text-[#133255]" />
            Invoice Breakup Calculation
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-600">Base Professional Fee:</span>
            <span className="font-semibold text-slate-900">₹{feeBeforeTax.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-600">GST ({gstRate}%):</span>
            <span className="font-semibold text-slate-900">₹{gstAmount.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between py-2 border-t border-slate-200 font-bold text-sm text-[#133255]">
            <span>Total Payable Amount:</span>
            <span>₹{totalAmount.toLocaleString("en-IN")}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 text-xs font-semibold text-white bg-[#133255] rounded-xl hover:bg-[#1a3d66] transition-colors shadow-md"
          >
            {isSubmitting ? "Generating..." : "Generate Tax Invoice"}
          </button>
        </div>
      </form>
    </div>
  );
}
