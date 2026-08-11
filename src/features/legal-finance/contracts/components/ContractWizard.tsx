"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { ArrowLeft, Check, ChevronRight, FileText, Shield, DollarSign, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import { createContractAction } from "@/actions/legal-finance";

interface ClientOption {
  id: string;
  name: string;
  legalEntityName: string | null;
  gstNumber: string | null;
}

export default function ContractWizard({
  clientsList,
}: {
  clientsList: ClientOption[];
}) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    clientId: "",
    contractStartDate: new Date().toISOString().split("T")[0],
    contractEndDate: (() => {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      return d.toISOString().split("T")[0];
    })(),
    renewalType: "Manual" as "Manual" | "Auto",
    consultant: "",
    businessHead: "",
    practice: "",
    commercialStructure: "SuccessFee" as "SuccessFee" | "Retained" | "Custom",
    successFeePct: 20,
    minFee: 0,
    maxFee: 0,
    retainerAmount: 0,
    replacementPeriod: 90,
    guaranteePeriod: 90,
    paymentTerms: "30 days from invoice date",
    currency: "INR",
    exclusivity: false,
    nonPoachingMonths: 12,
    confidentiality: true,
    latePaymentClause: "Interest of 1.5% per month will be applicable on payments delayed past 30 days.",
    travelExpenses: "Outstation travel & lodging to be reimbursed at actuals upon client pre-approval.",
    notes: "",
    status: "Draft",
  });

  const selectedClient = clientsList.find((c) => c.id === formData.clientId);

  const handleNext = () => {
    if (step === 1 && !formData.clientId) {
      toast.error("Please select a client.");
      return;
    }
    setStep((prev) => Math.min(4, prev + 1));
  };

  const handleBack = () => setStep((prev) => Math.max(1, prev - 1));

  const handleSubmit = async (finalStatus: "Draft" | "Shared") => {
    if (!formData.clientId) {
      toast.error("Please select a client.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createContractAction({
        ...formData,
        status: finalStatus,
      });
      toast.success(`Contract ${res.contractNumber} created!`);
      window.location.href = `/dashboard/legal-finance/contracts/${res.id}`;
    } catch (err: any) {
      toast.error(err.message || "Failed to create contract.");
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
            New Commercial Contract
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Step {step} of 4 — Fill terms to generate agreement draft
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { num: 1, label: "Client & Duration", icon: Calendar },
          { num: 2, label: "Commercial Terms", icon: DollarSign },
          { num: 3, label: "Clauses & Governance", icon: Shield },
          { num: 4, label: "Review & Generate", icon: FileText },
        ].map((s) => {
          const Icon = s.icon;
          const isActive = step === s.num;
          const isDone = step > s.num;

          return (
            <div
              key={s.num}
              onClick={() => isDone && setStep(s.num)}
              className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                isActive
                  ? "bg-[#133255] text-white border-[#133255] shadow-xs"
                  : isDone
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 cursor-pointer"
                  : "bg-slate-50 text-slate-400 border-slate-200"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : isDone
                    ? "bg-emerald-200 text-emerald-800"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : s.num}
              </div>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          );
        })}
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
        {/* STEP 1: Client & Dates */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Step 1: Select Client & Contract Period
            </h2>

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
                    {c.name} {c.legalEntityName ? `(${c.legalEntityName})` : ""}
                  </option>
                ))}
              </select>
              {selectedClient && (
                <div className="mt-2 p-3 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1">
                  <p><strong>Legal Entity:</strong> {selectedClient.legalEntityName || "N/A"}</p>
                  <p><strong>GST Number:</strong> {selectedClient.gstNumber || "Not recorded"}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.contractStartDate}
                  onChange={(e) => setFormData({ ...formData, contractStartDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#133255]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.contractEndDate}
                  onChange={(e) => setFormData({ ...formData, contractEndDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#133255]/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Renewal Type
                </label>
                <select
                  value={formData.renewalType}
                  onChange={(e) => setFormData({ ...formData, renewalType: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="Manual">Manual Renewal</option>
                  <option value="Auto">Auto-Renewal</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lead Consultant
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rajesh Sharma"
                  value={formData.consultant}
                  onChange={(e) => setFormData({ ...formData, consultant: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Practice / Sector
                </label>
                <input
                  type="text"
                  placeholder="e.g. BFSI, Technology"
                  value={formData.practice}
                  onChange={(e) => setFormData({ ...formData, practice: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Commercial Terms */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Step 2: Commercials & Fee Structure
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Structure Type
                </label>
                <select
                  value={formData.commercialStructure}
                  onChange={(e) => setFormData({ ...formData, commercialStructure: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="SuccessFee">Success Fee %</option>
                  <option value="Retained">Retained Mandate</option>
                  <option value="Custom">Custom Structure</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Success Fee (% of Annual CTC)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.successFeePct}
                  onChange={(e) => setFormData({ ...formData, successFeePct: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Replacement Period (Days)
                </label>
                <input
                  type="number"
                  value={formData.replacementPeriod}
                  onChange={(e) => setFormData({ ...formData, replacementPeriod: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Guarantee Period (Days)
                </label>
                <input
                  type="number"
                  value={formData.guaranteePeriod}
                  onChange={(e) => setFormData({ ...formData, guaranteePeriod: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Terms
                </label>
                <input
                  type="text"
                  placeholder="e.g. 30 days"
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Clauses */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Step 3: Governance & Special Clauses
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.exclusivity}
                  onChange={(e) => setFormData({ ...formData, exclusivity: e.target.checked })}
                  className="w-4 h-4 text-[#133255] rounded focus:ring-0"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">Exclusivity Clause</span>
                  <span className="text-[11px] text-slate-500">MK is sole search partner for mandate</span>
                </div>
              </label>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Non-Poaching Lock-in (Months)
                </label>
                <input
                  type="number"
                  value={formData.nonPoachingMonths}
                  onChange={(e) => setFormData({ ...formData, nonPoachingMonths: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Late Payment Clause
              </label>
              <textarea
                rows={2}
                value={formData.latePaymentClause}
                onChange={(e) => setFormData({ ...formData, latePaymentClause: e.target.value })}
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Outstation Travel & Expenses Clause
              </label>
              <textarea
                rows={2}
                value={formData.travelExpenses}
                onChange={(e) => setFormData({ ...formData, travelExpenses: e.target.value })}
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* STEP 4: Review & Generate */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Step 4: Final Review & Generate Contract
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold">Client</span>
                <span className="font-bold text-slate-900">{selectedClient?.name || "Not selected"}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Contract Duration</span>
                <span className="font-bold text-slate-900">{formData.contractStartDate} → {formData.contractEndDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Commercial Terms</span>
                <span className="font-bold text-slate-900">{formData.successFeePct}% Success Fee</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Replacement Period</span>
                <span className="font-bold text-slate-900">{formData.replacementPeriod} Days</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit("Draft")}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              >
                Save as Draft
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit("Shared")}
                className="w-full sm:w-auto px-5 py-2 text-xs font-semibold text-white bg-[#133255] rounded-xl hover:bg-[#1a3d66] transition-colors shadow-md"
              >
                Submit for Approval & Share
              </button>
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            disabled={step === 1}
            onClick={handleBack}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl disabled:opacity-40 hover:bg-slate-200 transition-colors"
          >
            Back
          </button>
          {step < 4 && (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#133255] rounded-xl hover:bg-[#1a3d66] transition-colors"
            >
              Next Step <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
