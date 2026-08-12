"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calculator, FileText, AlertCircle, Plus, Trash2, User, Building2 } from "lucide-react";
import toast from "react-hot-toast";
import { createInvoiceAction } from "@/actions/legal-finance";

interface OptionClient {
  id: string;
  name: string;
  legalEntityName: string | null;
  gstNumber: string | null;
  gstRate: number | null;
  requiresPo: boolean | null;
  state: string | null;
}

interface OptionContract {
  id: string;
  contractNumber: string;
  clientId: string;
  successFeePct: number | null;
  paymentTerms: string | null;
}

interface OptionCandidate {
  candId: string | null;
  candName: string | null;
  currentCtc: number | string | null;
  mandateId: number | null;
  roleTitle: string | null;
  company: string | null;
  clientId: string | null;
  clientName: string | null;
}

interface LineItem {
  candId: string;
  candidateName: string;
  roleTitle: string;
  annualCtc: number; // in Lakhs
  feePct: number;
  feeAmount: number;
  particulars: string;
}

export default function RaiseInvoiceClient({
  initialMandateId,
  clientsList,
  contractsList,
  candidatesList,
}: {
  initialMandateId?: number;
  clientsList: OptionClient[];
  contractsList: OptionContract[];
  candidatesList: OptionCandidate[];
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Proposal Deck Commercial Slab Auto-Matching Helper
  const getProposalSlabFeePct = (ctcLakhs: number) => {
    if (ctcLakhs < 50) return 18;
    if (ctcLakhs <= 100) return 20;
    return 25;
  };

  const [formData, setFormData] = useState({
    clientId: "",
    contractId: "",
    mandateId: null as number | null,
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d.toISOString().split("T")[0];
    })(),
    poNumber: "",
    notes: "",
    taxType: "INTRA_STATE" as "INTRA_STATE" | "UNION_TERRITORY" | "INTER_STATE",
  });

  // Line items state
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      candId: "",
      candidateName: "",
      roleTitle: "",
      annualCtc: 50,
      feePct: 20,
      feeAmount: 1000000,
      particulars: "Executive Search Professional Fee — Success fee (20%) for Placement against Annual CTC of ₹50 Lakhs",
    },
  ]);

  const selectedClient = clientsList.find((c) => c.id === formData.clientId);
  const availableContracts = contractsList.filter((c) => c.clientId === formData.clientId);

  // Auto-fill client & mandate when initialMandateId is provided in URL
  useEffect(() => {
    if (initialMandateId) {
      const match = candidatesList.find((c) => c.mandateId === initialMandateId);
      if (match && match.clientId) {
        setFormData((prev) => ({
          ...prev,
          clientId: match.clientId!,
          mandateId: initialMandateId,
        }));
      } else {
        setFormData((prev) => ({ ...prev, mandateId: initialMandateId }));
      }
    }
  }, [initialMandateId, candidatesList]);

  // Auto-detect tax regime when client changes
  useEffect(() => {
    if (selectedClient) {
      const clientState = (selectedClient.state || "").toLowerCase();
      const utList = ["delhi", "chandigarh", "puducherry", "andaman", "lakshadweep", "ladakh", "jammu", "dadra"];
      if (utList.some((ut) => clientState.includes(ut))) {
        setFormData((prev) => ({ ...prev, taxType: "UNION_TERRITORY" }));
      } else if (clientState && clientState !== "maharashtra") {
        setFormData((prev) => ({ ...prev, taxType: "INTER_STATE" }));
      } else {
        setFormData((prev) => ({ ...prev, taxType: "INTRA_STATE" }));
      }

      // Auto select contract
      const cons = contractsList.filter((c) => c.clientId === selectedClient.id);
      if (cons.length > 0 && !formData.contractId) {
        setFormData((prev) => ({ ...prev, contractId: cons[0].id }));
      }
    }
  }, [formData.clientId]);

  // Line Item Handlers
  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        candId: "",
        candidateName: "Placement Item " + (prev.length + 1),
        roleTitle: "",
        annualCtc: 45,
        feePct: 18,
        feeAmount: 810000,
        particulars: "Executive Search Professional Fee — Success fee (18%) for Placement against Annual CTC of ₹45 Lakhs",
      },
    ]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCandidateSelect = (index: number, candId: string) => {
    const cand = candidatesList.find((c) => c.candId === candId);
    if (!cand) return;

    // Auto-link client & mandate from candidate record
    if (cand.clientId && !formData.clientId) {
      setFormData((prev) => ({
        ...prev,
        clientId: cand.clientId!,
        mandateId: cand.mandateId,
      }));
    }

    const rawCtc = parseFloat(String(cand.currentCtc)) || 50;
    const ctcLakhs = rawCtc > 1000 ? Math.round(rawCtc / 100000) : rawCtc;
    const autoFeePct = getProposalSlabFeePct(ctcLakhs);
    const feeAmt = Math.round((ctcLakhs * 100000 * autoFeePct) / 100);

    const updated = [...lineItems];
    updated[index] = {
      ...updated[index],
      candId: cand.candId || "",
      candidateName: cand.candName || "Candidate",
      roleTitle: cand.roleTitle || "",
      annualCtc: ctcLakhs,
      feePct: autoFeePct,
      feeAmount: feeAmt,
      particulars: `Executive Search Professional Fee — Success fee (${autoFeePct}%) for Placement of ${cand.candName || "Candidate"} as ${cand.roleTitle || "Executive"} against Annual CTC of ₹${ctcLakhs} Lakhs`,
    };
    setLineItems(updated);
  };

  const updateLineItem = (index: number, field: keyof LineItem, val: any) => {
    const updated = [...lineItems];
    const item = { ...updated[index], [field]: val };

    if (field === "annualCtc" || field === "feePct") {
      const ctc = parseFloat(String(item.annualCtc)) || 0;
      const pct = parseFloat(String(item.feePct)) || 0;
      item.feeAmount = Math.round((ctc * 100000 * pct) / 100);
      item.particulars = `Executive Search Professional Fee — Success fee (${pct}%) for Placement against Annual CTC of ₹${ctc} Lakhs`;
    }

    updated[index] = item;
    setLineItems(updated);
  };

  // Tax calculations
  const feeBeforeTax = lineItems.reduce((sum, item) => sum + (item.feeAmount || 0), 0);
  const gstRate = selectedClient?.gstRate || 18;
  const gstAmount = Math.round((feeBeforeTax * gstRate) / 100);
  const totalAmount = feeBeforeTax + gstAmount;

  let cgst = 0;
  let sgst = 0;
  let utgst = 0;
  let igst = 0;

  if (formData.taxType === "INTRA_STATE") {
    cgst = Math.round(gstAmount / 2);
    sgst = Math.round(gstAmount / 2);
  } else if (formData.taxType === "UNION_TERRITORY") {
    cgst = Math.round(gstAmount / 2);
    utgst = Math.round(gstAmount / 2);
  } else {
    igst = gstAmount;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientId) {
      toast.error("Please select a client or candidate.");
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
        contractId: formData.contractId || undefined,
        mandateId: formData.mandateId || undefined,
        candId: lineItems[0]?.candId || undefined,
        invoiceDate: formData.invoiceDate,
        dueDate: formData.dueDate,
        annualCtc: lineItems[0]?.annualCtc || 0,
        commercialPct: lineItems[0]?.feePct || 0,
        poNumber: formData.poNumber || undefined,
        notes: formData.notes || undefined,
        taxType: formData.taxType,
        lineItems,
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
            Step 1: Link placed candidate $\rightarrow$ Generate compliant tax invoice
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Candidate & Client Linkage */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-4 h-4 text-[#133255]" />
            1. Placement & Client Database Linkage
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Client Entity *
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-semibold text-slate-900"
              >
                <option value="">-- Select Client Entity --</option>
                {clientsList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.legalEntityName ? `(${c.legalEntityName})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Linked Commercial Contract
              </label>
              <select
                value={formData.contractId}
                onChange={(e) => setFormData({ ...formData, contractId: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              >
                <option value="">-- Standard Commercial Terms --</option>
                {availableContracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.contractNumber} ({c.successFeePct}% Success Fee)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Card 2: Multi-Placement Line Items */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#133255]" />
              2. Placement Line Items & Proposal Slabs
            </h2>
            <button
              type="button"
              onClick={addLineItem}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#133255] rounded-xl hover:bg-[#1a3d66] transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Placement Line Item
            </button>
          </div>

          <div className="space-y-4">
            {lineItems.map((item, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-800">
                    Placement Line #{idx + 1}
                  </span>
                  {lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLineItem(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Link Candidate from Database
                    </label>
                    <select
                      value={item.candId}
                      onChange={(e) => handleCandidateSelect(idx, e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                    >
                      <option value="">-- Pick Candidate --</option>
                      {candidatesList.map((cand) => (
                        <option key={cand.candId || Math.random()} value={cand.candId || ""}>
                          {cand.candName} ({cand.roleTitle} @ {cand.clientName || cand.company})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Annual CTC (Lakhs ₹)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={item.annualCtc}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        const autoFeePct = getProposalSlabFeePct(val);
                        updateLineItem(idx, "annualCtc", val);
                        updateLineItem(idx, "feePct", autoFeePct);
                      }}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Success Fee % (Auto Slabs)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={item.feePct}
                      onChange={(e) => updateLineItem(idx, "feePct", parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-bold text-[#133255]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center justify-between">
                    <span>Editable Particulars Description (Printed on Invoice)</span>
                    <span className="text-slate-400 font-normal">Line Fee: ₹{item.feeAmount?.toLocaleString("en-IN")}</span>
                  </label>
                  <textarea
                    rows={2}
                    value={item.particulars}
                    onChange={(e) => updateLineItem(idx, "particulars", e.target.value)}
                    className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none font-mono text-slate-800"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: GST Tax Regime & Dates */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            3. Tax Regime & Invoicing Dates
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className={`p-3 rounded-xl border text-xs cursor-pointer ${formData.taxType === "INTRA_STATE" ? "bg-blue-50 border-blue-200 text-blue-900 font-bold" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
              <input
                type="radio"
                name="taxType"
                value="INTRA_STATE"
                checked={formData.taxType === "INTRA_STATE"}
                onChange={() => setFormData({ ...formData, taxType: "INTRA_STATE" })}
                className="mr-2"
              />
              Intra-State (CGST 9% + SGST 9%)
            </label>

            <label className={`p-3 rounded-xl border text-xs cursor-pointer ${formData.taxType === "UNION_TERRITORY" ? "bg-purple-50 border-purple-200 text-purple-900 font-bold" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
              <input
                type="radio"
                name="taxType"
                value="UNION_TERRITORY"
                checked={formData.taxType === "UNION_TERRITORY"}
                onChange={() => setFormData({ ...formData, taxType: "UNION_TERRITORY" })}
                className="mr-2"
              />
              Union Territory (CGST 9% + UTGST 9%)
            </label>

            <label className={`p-3 rounded-xl border text-xs cursor-pointer ${formData.taxType === "INTER_STATE" ? "bg-emerald-50 border-emerald-200 text-emerald-900 font-bold" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
              <input
                type="radio"
                name="taxType"
                value="INTER_STATE"
                checked={formData.taxType === "INTER_STATE"}
                onChange={() => setFormData({ ...formData, taxType: "INTER_STATE" })}
                className="mr-2"
              />
              Inter-State (IGST 18%)
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Date</label>
              <input
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">PO Number (Optional)</label>
              <input
                type="text"
                placeholder="e.g. PO-2026-99"
                value={formData.poNumber}
                onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Total Summary Strip */}
        <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-xs">
            <p>Fee Before Tax: <strong>₹{feeBeforeTax.toLocaleString("en-IN")}</strong></p>
            {formData.taxType === "INTRA_STATE" && <p className="text-slate-300">CGST (9%): ₹{cgst.toLocaleString("en-IN")} | SGST (9%): ₹{sgst.toLocaleString("en-IN")}</p>}
            {formData.taxType === "UNION_TERRITORY" && <p className="text-slate-300">CGST (9%): ₹{cgst.toLocaleString("en-IN")} | UTGST (9%): ₹{utgst.toLocaleString("en-IN")}</p>}
            {formData.taxType === "INTER_STATE" && <p className="text-slate-300">IGST (18%): ₹{igst.toLocaleString("en-IN")}</p>}
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 block uppercase tracking-wider font-semibold">Total Payable</span>
            <span className="text-2xl font-bold font-serif text-emerald-400">₹{totalAmount.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3">
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
            className="px-6 py-2.5 text-xs font-bold text-white bg-[#133255] rounded-xl hover:bg-[#1a3d66] transition-colors shadow-md disabled:opacity-40"
          >
            Generate Tax Invoice Draft
          </button>
        </div>
      </form>
    </div>
  );
}
