"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Check, ChevronRight, FileText, Shield, DollarSign, Calendar, Plus, Trash2, Download } from "lucide-react";
import toast from "react-hot-toast";
import { createContractAction } from "@/actions/legal-finance";
import { saveAs } from "file-saver";

interface ClientOption {
  id: string;
  name: string;
  legalEntityName: string | null;
  gstNumber: string | null;
  owner?: string | null;
  vertical?: string | null;
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

    // Signing Authorities
    signingAuthorityClient: {
      name: "",
      designation: "Director / HR Head",
      email: "",
    },
    signingAuthorityMK: {
      name: "Managing Partner",
      designation: "Executive Director",
    },

    // Fee Structure
    useSlabs: false,
    commercialStructure: "SuccessFee" as "SuccessFee" | "Retained" | "Custom",
    successFeePct: 20,
    ctcSlabs: [
      { minCtc: 0, maxCtc: 30, feePct: 18 },
      { minCtc: 30, maxCtc: 60, feePct: 20 },
      { minCtc: 60, maxCtc: 999, feePct: 25 },
    ],
    minFee: 0,
    maxFee: 0,
    retainerAmount: 0,
    replacementPeriod: 90,
    guaranteePeriod: 90,
    paymentTerms: "30 days from invoice date",
    currency: "INR",

    // Governance & Clauses
    exclusivity: false,
    nonPoachingMonths: 12,
    confidentiality: true,
    latePaymentClause: "Interest of 1.5% per month will be applicable on payments delayed past 30 days.",
    travelExpenses: "Outstation travel & lodging to be reimbursed at actuals upon client pre-approval.",
    customClauses: [
      {
        title: "Off-Limit Period",
        text: "Neither party shall solicit employees of the other party during the term of this agreement and 12 months thereafter.",
      },
    ],

    notes: "",
    status: "Draft",
  });

  const selectedClient = clientsList.find((c) => c.id === formData.clientId);

  // Auto-populate Lead Consultant & Practice from Client Database
  useEffect(() => {
    if (selectedClient) {
      setFormData((prev) => ({
        ...prev,
        consultant: prev.consultant || selectedClient.owner || "",
        practice: prev.practice || selectedClient.vertical || "",
      }));
    }
  }, [formData.clientId]);

  const handleNext = () => {
    if (step === 1 && !formData.clientId) {
      toast.error("Please select a client.");
      return;
    }
    setStep((prev) => Math.min(4, prev + 1));
  };

  const handleBack = () => setStep((prev) => Math.max(1, prev - 1));

  // Dynamic Slab Handlers
  const addSlab = () => {
    setFormData((prev) => ({
      ...prev,
      ctcSlabs: [...prev.ctcSlabs, { minCtc: 0, maxCtc: 0, feePct: 20 }],
    }));
  };

  const removeSlab = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      ctcSlabs: prev.ctcSlabs.filter((_, i) => i !== index),
    }));
  };

  const updateSlab = (index: number, field: string, val: number) => {
    const updated = [...formData.ctcSlabs];
    updated[index] = { ...updated[index], [field]: val };
    setFormData((prev) => ({ ...prev, ctcSlabs: updated }));
  };

  // Dynamic Custom Clause Handlers
  const addCustomClause = () => {
    setFormData((prev) => ({
      ...prev,
      customClauses: [...prev.customClauses, { title: "Special Clause", text: "" }],
    }));
  };

  const removeCustomClause = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      customClauses: prev.customClauses.filter((_, i) => i !== index),
    }));
  };

  const updateCustomClause = (index: number, field: "title" | "text", val: string) => {
    const updated = [...formData.customClauses];
    updated[index] = { ...updated[index], [field]: val };
    setFormData((prev) => ({ ...prev, customClauses: updated }));
  };

  // Download Editable Word Document (.docx)
  const handleDownloadDocx = () => {
    if (!selectedClient) {
      toast.error("Please select a client first.");
      return;
    }

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Commercial Agreement - ${selectedClient.name}</title>
        <style>
          body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; color: #111827; }
          h1 { color: #133255; font-size: 18pt; text-align: center; border-bottom: 2pt solid #133255; padding-bottom: 6pt; }
          h2 { color: #133255; font-size: 13pt; margin-top: 16pt; border-bottom: 1pt solid #e5e7eb; }
          table { width: 100%; border-collapse: collapse; margin-top: 8pt; margin-bottom: 12pt; }
          th, td { border: 1pt solid #d1d5db; padding: 6pt 8pt; text-align: left; font-size: 10pt; }
          th { background-color: #f3f4f6; color: #133255; font-weight: bold; }
          .signature-box { margin-top: 40pt; width: 100%; }
          .sig-col { width: 48%; float: left; border-top: 1pt solid #9ca3af; padding-top: 6pt; }
        </style>
      </head>
      <body>
        <h1>EXECUTIVE SEARCH COMMERCIAL AGREEMENT</h1>
        <p style="text-align:center; font-size: 10pt; color: #4b5563;">
          Between <strong>Mauna Kea OS</strong> and <strong>${selectedClient.legalEntityName || selectedClient.name}</strong>
        </p>

        <h2>1. AGREEMENT DETAILS</h2>
        <table>
          <tr><td><strong>Client Entity:</strong></td><td>${selectedClient.legalEntityName || selectedClient.name}</td></tr>
          <tr><td><strong>GSTIN:</strong></td><td>${selectedClient.gstNumber || "N/A"}</td></tr>
          <tr><td><strong>Contract Period:</strong></td><td>${formData.contractStartDate} to ${formData.contractEndDate}</td></tr>
          <tr><td><strong>Lead Consultant:</strong></td><td>${formData.consultant || "N/A"}</td></tr>
          <tr><td><strong>Practice / Sector:</strong></td><td>${formData.practice || "N/A"}</td></tr>
        </table>

        <h2>2. COMMERCIAL TERMS & PROFESSIONAL FEES</h2>
        ${
          formData.useSlabs
            ? `
          <p>Professional fees shall be charged as per the following CTC Commission Slab structure:</p>
          <table>
            <thead>
              <tr><th>Annual CTC Range (Lakhs ₹)</th><th>Success Fee %</th></tr>
            </thead>
            <tbody>
              ${formData.ctcSlabs
                .map(
                  (s) => `<tr><td>₹${s.minCtc} L to ${s.maxCtc >= 999 ? "Above" : `₹${s.maxCtc} L`}</td><td><strong>${s.feePct}%</strong></td></tr>`
                )
                .join("")}
            </tbody>
          </table>
        `
            : `<p><strong>Success Fee:</strong> ${formData.successFeePct}% of Annual CTC per placed candidate.</p>`
        }
        <p><strong>Payment Terms:</strong> ${formData.paymentTerms}</p>
        <p><strong>Replacement Guarantee:</strong> ${formData.replacementPeriod} days from candidate joining date.</p>

        <h2>3. GOVERNANCE & SPECIAL CLAUSES</h2>
        <p><strong>Exclusivity:</strong> ${formData.exclusivity ? "Exclusive Search Partner" : "Non-exclusive Partner"}</p>
        <p><strong>Non-Poaching Lock-in:</strong> ${formData.nonPoachingMonths} months</p>
        <p><strong>Late Payment Clause:</strong> ${formData.latePaymentClause}</p>
        <p><strong>Travel & Expenses:</strong> ${formData.travelExpenses}</p>

        ${
          formData.customClauses.length > 0
            ? `
          <h2>4. ADDITIONAL CUSTOM CLAUSES</h2>
          ${formData.customClauses
            .map(
              (c) => `<p><strong>${c.title}:</strong> ${c.text}</p>`
            )
            .join("")}
        `
            : ""
        }

        <h2>5. SIGNING AUTHORITIES</h2>
        <table style="border:none; margin-top:30pt;">
          <tr style="border:none;">
            <td style="border:none; width:50%;">
              <p><strong>For Mauna Kea OS</strong></p>
              <br><br><br>
              <p>___________________________</p>
              <p><strong>${formData.signingAuthorityMK.name || "Authorized Signatory"}</strong></p>
              <p>${formData.signingAuthorityMK.designation}</p>
            </td>
            <td style="border:none; width:50%;">
              <p><strong>For ${selectedClient.name}</strong></p>
              <br><br><br>
              <p>___________________________</p>
              <p><strong>${formData.signingAuthorityClient.name || "Client Signatory"}</strong></p>
              <p>${formData.signingAuthorityClient.designation}</p>
              <p>${formData.signingAuthorityClient.email}</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(["\ufeff", htmlContent], {
      type: "application/msword",
    });
    saveAs(blob, `Contract_Draft_${selectedClient.name.replace(/\s+/g, "_")}.docx`);
    toast.success("Editable Word document (.docx) downloaded!");
  };

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
        {/* STEP 1: Client & Dates & Signatories */}
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
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
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
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
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
                  Lead Consultant (Auto-filled from Client Master)
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
                  Practice / Sector (Auto-filled)
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

            {/* Signing Authorities */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-slate-800">Signing Authorities</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Client Signatory Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Vikram Mehta"
                    value={formData.signingAuthorityClient.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        signingAuthorityClient: { ...formData.signingAuthorityClient, name: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Client Signatory Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. VP Human Resources"
                    value={formData.signingAuthorityClient.designation}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        signingAuthorityClient: { ...formData.signingAuthorityClient, designation: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Mauna Kea Signatory Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Partner Name"
                    value={formData.signingAuthorityMK.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        signingAuthorityMK: { ...formData.signingAuthorityMK, name: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Commercial Terms & Slabs */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Step 2: Commercials & Fee Structure
            </h2>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-900 block">CTC-Wise Commission Slabs</span>
                <span className="text-[11px] text-slate-500">Enable variable success fee % based on candidate CTC slabs</span>
              </div>
              <input
                type="checkbox"
                checked={formData.useSlabs}
                onChange={(e) => setFormData({ ...formData, useSlabs: e.target.checked })}
                className="w-4 h-4 text-[#133255] rounded focus:ring-0 cursor-pointer"
              />
            </div>

            {formData.useSlabs ? (
              <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-800">CTC Commission Slab Structure</span>
                  <button
                    type="button"
                    onClick={addSlab}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-[#133255] rounded-lg hover:bg-[#1a3d66]"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Slab
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.ctcSlabs.map((slab, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-xs bg-white p-2.5 rounded-lg border border-slate-200">
                      <span>CTC: ₹</span>
                      <input
                        type="number"
                        value={slab.minCtc}
                        onChange={(e) => updateSlab(idx, "minCtc", parseFloat(e.target.value) || 0)}
                        className="w-16 px-2 py-1 bg-slate-50 border rounded text-xs"
                      />
                      <span>L to</span>
                      <input
                        type="number"
                        value={slab.maxCtc}
                        onChange={(e) => updateSlab(idx, "maxCtc", parseFloat(e.target.value) || 0)}
                        className="w-16 px-2 py-1 bg-slate-50 border rounded text-xs"
                      />
                      <span>L $\rightarrow$ Fee:</span>
                      <input
                        type="number"
                        step="0.5"
                        value={slab.feePct}
                        onChange={(e) => updateSlab(idx, "feePct", parseFloat(e.target.value) || 0)}
                        className="w-16 px-2 py-1 bg-slate-50 border rounded text-xs font-bold text-[#133255]"
                      />
                      <span>%</span>
                      {formData.ctcSlabs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSlab(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded ml-auto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
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
                    Flat Success Fee (% of Annual CTC)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.successFeePct}
                    onChange={(e) => setFormData({ ...formData, successFeePct: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-bold text-[#133255]"
                  />
                </div>
              </div>
            )}

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

        {/* STEP 3: Generic & Custom Clauses */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Step 3: Governance & Generic Clauses
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

            {/* Dynamic Custom Clauses Section */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-800">Additional Custom Clauses</span>
                <button
                  type="button"
                  onClick={addCustomClause}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-[#133255] rounded-lg hover:bg-[#1a3d66]"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Clause
                </button>
              </div>

              {formData.customClauses.map((clause, idx) => (
                <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      placeholder="Clause Title"
                      value={clause.title}
                      onChange={(e) => updateCustomClause(idx, "title", e.target.value)}
                      className="px-2 py-1 text-xs font-bold text-slate-900 border-b border-slate-200 focus:outline-none w-2/3"
                    />
                    <button
                      type="button"
                      onClick={() => removeCustomClause(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Clause Text..."
                    value={clause.text}
                    onChange={(e) => updateCustomClause(idx, "text", e.target.value)}
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: Review & Word Doc Download */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Step 4: Final Review & Document Generation
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold">Client Entity</span>
                <span className="font-bold text-slate-900">{selectedClient?.name || "Not selected"}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Contract Duration</span>
                <span className="font-bold text-slate-900">{formData.contractStartDate} $\rightarrow$ {formData.contractEndDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Fee Structure</span>
                <span className="font-bold text-slate-900">
                  {formData.useSlabs ? `${formData.ctcSlabs.length} CTC Slabs Configured` : `${formData.successFeePct}% Success Fee`}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Lead Consultant</span>
                <span className="font-bold text-slate-900">{formData.consultant || "Not assigned"}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleDownloadDocx}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                Download Editable Word Doc (.docx)
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmit("Draft")}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmit("Shared")}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#133255] rounded-xl hover:bg-[#1a3d66] transition-colors shadow-md"
                >
                  Submit for Approval & Share
                </button>
              </div>
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
